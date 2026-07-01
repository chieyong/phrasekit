import { NextRequest, NextResponse } from "next/server";
import { getLanguage } from "@/data/languages";

// Vertaalt een Nederlandse zin naar de gekozen taal, opgebouwd uit het
// taalregister zodat elke taal werkt. Levert tekst + lezing + uitleg + varianten.
function buildPrompt(langCode: string): string | null {
  const l = getLanguage(langCode);
  if (!l) return null;
  return `Je bent een taalassistent voor Nederlandstalige reizigers. Gegeven een Nederlandse zin of uitdrukking, maak een natuurlijke vertaling naar het ${l.label} (${l.scriptNote}), geschikt voor dagelijkse reissituaties.

Reageer met ALLEEN geldig JSON in precies deze vorm:
{
  "text": "<vertaling ${l.scriptNote}>",
  "reading": "<${l.readingLabel}-lezing met koppeltekens waar nuttig>",
  "explanation": "<in het Nederlands: wat de zin betekent en wanneer te gebruiken, max 2 zinnen>",
  "shortVersion": { "translatedText": "<kortere vorm>", "romaji": "<${l.readingLabel}>", "label": "Kort" },
  "politeVersion": { "translatedText": "<beleefdere vorm>", "romaji": "<${l.readingLabel}>", "label": "Beleefder" }
}

Regels:
- shortVersion: alleen toevoegen als er een betekenisvolle kortere vorm bestaat.
- politeVersion: alleen toevoegen als er een gepastere, beleefdere vorm bestaat.
- Laat shortVersion of politeVersion volledig weg als ze geen meerwaarde bieden.
- Natuurlijk, correct ${l.label} — geen letterlijke woord-voor-woord vertaling.
- Gebruik Arabische cijfers (2, 3…) in de tekst, geen cijfer-tekens uit het schrift.`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let query: string, language: string;
  try {
    const body = await request.json();
    query    = (body.query ?? "").trim();
    language = body.language ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  const systemPrompt = buildPrompt(language);
  if (!systemPrompt) return NextResponse.json({ error: "Unknown language" }, { status: 400 });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: query },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Translation service error" }, { status: 502 });
    }
    const data    = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    const parsed = JSON.parse(content);
    return NextResponse.json({ sourceText: query, language, ...parsed });
  } catch (err) {
    console.error("Ask route error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
