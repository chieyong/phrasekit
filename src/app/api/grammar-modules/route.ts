import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Je bent een Japanse grammaticadocent voor Nederlandstalige reizigers. Analyseer de gegeven zinnen en identificeer 4-8 grammaticale patronen die prominent aanwezig zijn.

Regels:
- Kies patronen die écht voorkomen in de zinnen (niet hypothetisch)
- Naam: kort, mag Japanse termen bevatten (bijv. "て-vorm", "ます-stam", "は…です")
- Tagline: één zin die het doel/gebruik van het patroon beschrijft
- Elke zin valt in precies één module — kies het meest kenmerkende patroon
- Sorteer van meest voorkomend naar minst voorkomend
- Voeg een "niveau" toe: "basis", "gemiddeld" of "gevorderd"

Reageer met ALLEEN geldig JSON:
{ "modules": [ { "naam": "...", "tagline": "...", "niveau": "basis|gemiddeld|gevorderd", "zinIds": ["..."] } ] }`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

  let phrases: { id: string; translatedText: string; romaji: string; sourceText: string }[];
  try {
    const body = await request.json();
    phrases = body.phrases ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (phrases.length < 3) return NextResponse.json({ modules: [] });

  const list = phrases
    .slice(0, 60)
    .map((p, i) => `${i + 1}. id:${p.id} | 日本語: ${p.translatedText} | romaji: ${p.romaji} | NL: ${p.sourceText}`)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: list },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: "Module discovery error" }, { status: 502 });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("grammar-modules error:", err);
    return NextResponse.json({ error: "Module discovery failed" }, { status: 500 });
  }
}
