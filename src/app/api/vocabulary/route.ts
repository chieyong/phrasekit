import { NextRequest, NextResponse } from "next/server";

const JA_PROMPT = `Je bent een Japanse woordenschatleraar voor Nederlandstalige reizigers. Gegeven Japanse zinnen (met romaji en Nederlandse vertaling), extraheer de meest nuttige inhoudswoorden.

Regels:
- Extraheer zelfstandige naamwoorden, werkwoorden én bijvoeglijke naamwoorden
- GEEN partikels (wa, ga, wo, ni, de, mo, ka, to, no, e), GEEN losse grammaticale uitgangen
- Werkwoorden: geef altijd de woordenboek-vorm (辞書形), bijv. 行く, 食べる, 買う — NIET de ます/ません-vorm
- Extraheer de belangrijkste inhoudswoorden per zin: méér bij langere zinnen (richtlijn: 1–2 bij korte zinnen, tot 5–6 bij lange of opsommende zinnen). Neem bij een opsomming alle genoemde leden mee. Max ~40 woorden totaal; verwijder duplicaten
- Voeg per woord een "type" toe: "noun", "verb" of "adjective"

Reageer met ALLEEN geldig JSON:
{ "words": [ { "japanese": "<kanji/kana>", "romaji": "<lezing>", "dutch": "<Nederlandse vertaling>", "type": "<noun|verb|adjective>" } ] }`;

const ZH_PROMPT = `Je bent een Chinese woordenschatleraar voor Nederlandstalige reizigers. Gegeven Chinese zinnen (met pinyin en Nederlandse vertaling), extraheer de meest nuttige inhoudswoorden.

Regels:
- Extraheer zelfstandige naamwoorden, werkwoorden én bijvoeglijke naamwoorden
- GEEN structuurwoorden (的, 了, 是, 在, 吗, 吧 etc.)
- Werkwoorden: geef de basisvorm (bijv. 买, 去, 吃)
- Extraheer de belangrijkste inhoudswoorden per zin: méér bij langere zinnen (richtlijn: 1–2 bij korte zinnen, tot 5–6 bij lange of opsommende zinnen). Neem bij een opsomming alle genoemde leden mee. Max ~40 woorden totaal; verwijder duplicaten
- Voeg per woord een "type" toe: "noun", "verb" of "adjective"
- Gebruik Vereenvoudigd Chinees

Reageer met ALLEEN geldig JSON — gebruik exact deze veldnamen:
{ "words": [ { "japanese": "<Chinese karakters>", "romaji": "<pinyin met toonmarkeringen>", "dutch": "<Nederlandse vertaling>", "type": "<noun|verb|adjective>" } ] }`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let phrases: { translatedText: string; romaji: string; sourceText: string }[];
  let language: string;
  try {
    const body = await request.json();
    phrases  = body.phrases  ?? [];
    language = body.language ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!phrases.length) return NextResponse.json({ words: [] });

  const isZh    = language === "zh";
  const label1  = isZh ? "Chinees" : "Japans";
  const label2  = isZh ? "Pinyin"  : "Romaji";

  const list = phrases
    .slice(0, 30)
    .map((p, i) => `${i + 1}. ${label1}: ${p.translatedText} | ${label2}: ${p.romaji} | NL: ${p.sourceText}`)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: isZh ? ZH_PROMPT : JA_PROMPT },
          { role: "user",   content: list },
        ],
        temperature: 0.3,
        max_tokens: 900,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Vocabulary service error" }, { status: 502 });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Vocabulary route error:", err);
    return NextResponse.json({ error: "Vocabulary extraction failed" }, { status: 500 });
  }
}
