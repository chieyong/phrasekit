import { NextRequest, NextResponse } from "next/server";

// Verrijkt een bestaande woordenlijst met NIEUWE, categorie-relevante woorden die
// (nog) niet uit de ingevoerde zinnen komen. Bijv. categorie "Sport" met woorden
// over Badminton/Volleybal → ook Voetbal, Basketbal, bal, scoren, wedstrijd…

const JA_PROMPT = `Je bent een Japanse woordenschatleraar voor Nederlandstalige reizigers. Je breidt een bestaande woordenlijst voor een categorie uit met nieuwe, nuttige woorden.

Werkwijze:
- Leid uit de categorienaam en de bestaande woorden de onderliggende sub-thema's af, en verbreed daarna naar het hele domein. Voorbeeld: categorie "Sport" met "badminton, volleybal" → voeg ook andere sporten (voetbal, basketbal, tennis) én algemene sportwoorden (bal, team, scoren, wedstrijd) toe.
- Geef ALLEEN nieuwe woorden die NIET al in de bestaande lijst staan (vermijd duplicaten qua betekenis én schrijfwijze).
- Zelfstandige naamwoorden, werkwoorden én bijvoeglijke naamwoorden; geen partikels.
- Werkwoorden: woordenboek-vorm (辞書形), bijv. 行く, 食べる.
- Gebruik Arabische cijfers in de Japanse tekst.
- Voeg per woord een "type" toe: "noun", "verb" of "adjective".

Reageer met ALLEEN geldig JSON:
{ "words": [ { "japanese": "<kanji/kana>", "romaji": "<lezing>", "dutch": "<Nederlandse vertaling>", "type": "<noun|verb|adjective>" } ] }`;

const ZH_PROMPT = `Je bent een Chinese woordenschatleraar voor Nederlandstalige reizigers. Je breidt een bestaande woordenlijst voor een categorie uit met nieuwe, nuttige woorden.

Werkwijze:
- Leid uit de categorienaam en de bestaande woorden de onderliggende sub-thema's af, en verbreed daarna naar het hele domein. Voorbeeld: categorie "Sport" met "badminton, volleybal" → voeg ook andere sporten (voetbal, basketbal, tennis) én algemene sportwoorden (bal, team, scoren, wedstrijd) toe.
- Geef ALLEEN nieuwe woorden die NIET al in de bestaande lijst staan (vermijd duplicaten qua betekenis én schrijfwijze).
- Zelfstandige naamwoorden, werkwoorden én bijvoeglijke naamwoorden; geen structuurwoorden.
- Werkwoorden: basisvorm (bijv. 买, 去, 吃).
- Gebruik Vereenvoudigd Chinees.
- Voeg per woord een "type" toe: "noun", "verb" of "adjective".

Reageer met ALLEEN geldig JSON — gebruik exact deze veldnamen:
{ "words": [ { "japanese": "<Chinese karakters>", "romaji": "<pinyin met toonmarkeringen>", "dutch": "<Nederlandse vertaling>", "type": "<noun|verb|adjective>" } ] }`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let categoryName: string;
  let existing: { japanese: string; dutch: string }[];
  let language: string;
  let count: number;
  try {
    const body = await request.json();
    categoryName = (body.categoryName ?? "").trim();
    existing     = body.existing ?? [];
    language     = body.language ?? "ja";
    count        = Math.min(Math.max(Number(body.count) || 10, 1), 20);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!categoryName) {
    return NextResponse.json({ error: "categoryName is required" }, { status: 400 });
  }

  const isZh         = language === "zh";
  const existingList = existing.length
    ? existing.map((w) => `${w.japanese} (${w.dutch})`).join(", ")
    : "(nog geen woorden)";

  const userMessage = `Categorie: ${categoryName}
Bestaande woorden (NIET herhalen): ${existingList}

Stel ${count} nieuwe, relevante woorden voor in deze categorie.`;

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
        temperature: 0.6,
        max_tokens: 700,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Vocabulary expand service error" }, { status: 502 });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Vocabulary expand route error:", err);
    return NextResponse.json({ error: "Vocabulary expansion failed" }, { status: 500 });
  }
}
