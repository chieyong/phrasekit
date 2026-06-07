import { NextRequest, NextResponse } from "next/server";

const JA_PROMPT = `Je bent een Japanse woordenschatleraar voor Nederlandstalige reizigers. Gegeven Japanse zinnen (met romaji en Nederlandse vertaling), extraheer de meest nuttige inhoudswoorden.

Regels:
- Alleen inhoudswoorden: zelfstandige naamwoorden, werkwoorden, bijvoeglijke naamwoorden — GEEN partikels (wa, ga, wo, ni, de, mo, ka, to, no, e), GEEN losse grammaticale uitgangen
- Max 1–2 sleutelwoorden per zin, max 20 woorden totaal
- Verwijder duplicaten

Reageer met ALLEEN geldig JSON:
{ "words": [ { "japanese": "<kanji/kana>", "romaji": "<lezing>", "dutch": "<Nederlandse vertaling>" } ] }`;

const ZH_PROMPT = `Je bent een Chinese woordenschatleraar voor Nederlandstalige reizigers. Gegeven Chinese zinnen (met pinyin en Nederlandse vertaling), extraheer de meest nuttige inhoudswoorden.

Regels:
- Alleen inhoudswoorden: zelfstandige naamwoorden, werkwoorden, bijvoeglijke naamwoorden — GEEN structuurwoorden (的, 了, 是, 在, 吗 etc.)
- Max 1–2 sleutelwoorden per zin, max 20 woorden totaal
- Verwijder duplicaten
- Gebruik Vereenvoudigd Chinees

Reageer met ALLEEN geldig JSON — gebruik exact deze veldnamen:
{ "words": [ { "japanese": "<Chinese karakters>", "romaji": "<pinyin met toonmarkeringen>", "dutch": "<Nederlandse vertaling>" } ] }`;

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
        max_tokens: 600,
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
