import { NextRequest, NextResponse } from "next/server";

// Genereert een VOLLEDIGE themalijst (bijv. "cijfers 1 t/m 20", "alle maanden",
// "dagen van de week") in één keer, zodat de gebruiker niet elk woord apart hoeft
// te laten vertalen. Output sluit aan op de bestaande VocabWord-vorm.

const JA_PROMPT = `Je bent een Japanse woordenschatleraar voor Nederlandstalige reizigers. Genereer de VOLLEDIGE woordenlijst voor het opgegeven thema.

Regels:
- Enumereer het thema COMPLEET. "cijfers 1 t/m 20" = alle 20 getallen; "maanden" = alle 12 maanden; "dagen van de week" = alle 7 dagen. Vat niet samen en laat niets weg.
- Houd een logische volgorde aan (1,2,3…; januari→december; maandag→zondag).
- Geef per woord het Japans (kanji/kana), de romaji-lezing en de Nederlandse betekenis.
- Gebruik Arabische cijfers in de Japanse tekst waar dat natuurlijk is.
- Voeg per woord een "type" toe: "noun", "verb" of "adjective" (getallen/maanden/dagen = "noun").
- Sla woorden over die al in de bestaande lijst staan.

Reageer met ALLEEN geldig JSON:
{ "words": [ { "japanese": "<kanji/kana>", "romaji": "<lezing>", "dutch": "<Nederlandse vertaling>", "type": "<noun|verb|adjective>" } ] }`;

const ZH_PROMPT = `Je bent een Chinese woordenschatleraar voor Nederlandstalige reizigers. Genereer de VOLLEDIGE woordenlijst voor het opgegeven thema.

Regels:
- Enumereer het thema COMPLEET. "cijfers 1 t/m 20" = alle 20 getallen; "maanden" = alle 12 maanden; "dagen van de week" = alle 7 dagen. Vat niet samen en laat niets weg.
- Houd een logische volgorde aan (1,2,3…; januari→december; maandag→zondag).
- Geef per woord het Vereenvoudigd Chinees, de pinyin (met toonmarkeringen) en de Nederlandse betekenis.
- Voeg per woord een "type" toe: "noun", "verb" of "adjective" (getallen/maanden/dagen = "noun").
- Sla woorden over die al in de bestaande lijst staan.

Reageer met ALLEEN geldig JSON — gebruik exact deze veldnamen:
{ "words": [ { "japanese": "<Chinese karakters>", "romaji": "<pinyin met toonmarkeringen>", "dutch": "<Nederlandse vertaling>", "type": "<noun|verb|adjective>" } ] }`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let theme: string;
  let existing: { japanese: string; dutch: string }[];
  let language: string;
  try {
    const body = await request.json();
    theme    = (body.theme ?? "").trim();
    existing = body.existing ?? [];
    language = body.language ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!theme) {
    return NextResponse.json({ error: "theme is required" }, { status: 400 });
  }

  const isZh         = language === "zh";
  const existingList = existing.length
    ? existing.map((w) => `${w.japanese} (${w.dutch})`).join(", ")
    : "(nog geen woorden)";

  const userMessage = `Thema: ${theme}
Bestaande woorden (NIET herhalen): ${existingList}

Genereer de volledige lijst voor dit thema.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: isZh ? ZH_PROMPT : JA_PROMPT },
          { role: "user",   content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Vocabulary list service error" }, { status: 502 });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Vocabulary list route error:", err);
    return NextResponse.json({ error: "Vocabulary list generation failed" }, { status: 500 });
  }
}
