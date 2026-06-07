import { NextRequest, NextResponse } from "next/server";

// ─── Japanese prompt ──────────────────────────────────────────────────────────

const JA_PROMPT = `Je bent een Japanse taalassistent voor Nederlandstalige toeristen in Japan.
Gegeven een Nederlandse zin of uitdrukking, maak een natuurlijke Japanse vertaling geschikt voor dagelijkse reissituaties.

Reageer met ALLEEN geldig JSON in precies deze vorm:

{
  "sourceText": "<de originele Nederlandse invoer>",
  "translatedText": "<Japans in kanji/kana>",
  "romaji": "<romanisering met koppeltekens voor telwoorden>",
  "explanation": "<in het Nederlands: wat de zin betekent en wanneer te gebruiken, max 2 zinnen>",
  "shortVersion": { "translatedText": "...", "romaji": "...", "label": "Kort" },
  "politeVersion": { "translatedText": "...", "romaji": "...", "label": "Beleefder" }
}

Regels:
- shortVersion: alleen toevoegen als er een betekenisvolle kortere vorm bestaat
- politeVersion: alleen toevoegen als er een beleefder vorm bestaat die gepaster is in formele situaties
- Laat shortVersion of politeVersion volledig weg als ze geen meerwaarde bieden
- Gebruik natuurlijk, correct Japans — geen letterlijke vertaling
- Gebruik Arabische cijfers (2, 3…) in de Japanse tekst, niet kanji-cijfers`;

// ─── Chinese prompt ───────────────────────────────────────────────────────────

const ZH_PROMPT = `Je bent een Chinees (Mandarijn) taalassistent voor Nederlandstalige toeristen in China.
Gegeven een Nederlandse zin of uitdrukking, maak een natuurlijke Chinese vertaling geschikt voor dagelijkse reissituaties.

Reageer met ALLEEN geldig JSON in precies deze vorm:

{
  "chineseText": "<Vereenvoudigd Chinees>",
  "pinyin": "<pinyin met toonmarkeringen, bijv. nǐ hǎo>",
  "chineseExplanation": "<in het Nederlands: wat de zin betekent en wanneer te gebruiken, max 2 zinnen>"
}

Regels:
- Gebruik Vereenvoudigd Chinees (简体字)
- Pinyin met correcte toonmarkeringen (ā á ǎ à)
- Natuurlijke, correct Mandarijn — geen letterlijke vertaling`;

// ─── OpenAI helper ────────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  },
      ],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
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
    // Both languages in parallel — one API round-trip for the user
    const [ja, zh] = await Promise.all([
      callOpenAI(apiKey, JA_PROMPT, query),
      callOpenAI(apiKey, ZH_PROMPT, query),
    ]);

    return NextResponse.json({
      ...ja,
      chineseText:        zh.chineseText        ?? null,
      pinyin:             zh.pinyin             ?? null,
      chineseExplanation: zh.chineseExplanation ?? null,
    });
  } catch (err) {
    console.error("Ask route error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
