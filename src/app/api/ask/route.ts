import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AskResult {
  sourceText: string;
  translatedText: string;
  romaji: string;
  explanation: string;
  shortVersion?: { translatedText: string; romaji: string; label: string };
  politeVersion?: { translatedText: string; romaji: string; label: string };
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Je bent een Japanse taalassistent voor Nederlandstalige toeristen in Japan.
Gegeven een Nederlandse zin of uitdrukking, maak een natuurlijke Japanse vertaling geschikt voor dagelijkse reissituaties.

Reageer met ALLEEN geldig JSON — geen markdown, geen uitleg buiten de JSON — in precies deze vorm:

{
  "sourceText": "<de originele Nederlandse invoer>",
  "translatedText": "<Japans in kanji/kana, zoals een lokale het van nature zou zeggen>",
  "romaji": "<uitgesproken romanisering met koppeltekens voor telwoorden, bijv. ni-mai, san-mei>",
  "explanation": "<in het Nederlands: wat de zin betekent en een korte noot over wanneer/hoe te gebruiken, max 2 zinnen>",
  "shortVersion": {
    "translatedText": "<een kortere of meer informele versie>",
    "romaji": "<romanisering>",
    "label": "Kort"
  },
  "politeVersion": {
    "translatedText": "<een beleefder versie met keigo waar van toepassing>",
    "romaji": "<romanisering>",
    "label": "Beleefder"
  }
}

Regels:
- shortVersion: alleen toevoegen als er een betekenisvoller kortere vorm bestaat die verschilt van de hoofdzin
- politeVersion: alleen toevoegen als er een beleefder vorm bestaat die daadwerkelijk gepaster is in formele situaties
- Laat shortVersion of politeVersion volledig weg als ze geen meerwaarde bieden
- Gebruik natuurlijk, correct Japans — geen letterlijke woord-voor-woord vertaling
- Gebruik voor getallen altijd Arabische cijfers (2, 3, 4…) in de Japanse tekst, niet kanji-cijfers`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  let query: string;
  try {
    const body = await request.json();
    query = (body.query ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
        temperature: 0.3, // low temp for consistent, accurate translations
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "Translation service error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from translation service" },
        { status: 502 }
      );
    }

    const result: AskResult = JSON.parse(content);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Ask route error:", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
