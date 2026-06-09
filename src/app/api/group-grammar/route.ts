import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Je bent een Japanse grammaticadocent. Gegeven een lijst zinnen (met id, Japanse tekst en Nederlandse vertaling), groepeer ze op grammaticale structuur.

Regels:
- Maak 2–5 zinvolle groepen op basis van grammaticale patronen, bijv. "て-vorm", "Vraagzinnen", "ください-verzoeken", "は…です-structuur", "Richting met に/へ"
- Elke zin valt in precies één groep — wijs elke id toe
- Groepsnamen zijn kort (max 3 woorden), in het Nederlands
- Sorteer groepen van meest voorkomend naar minst voorkomend

Reageer met ALLEEN geldig JSON:
{ "groups": [ { "groep": "<naam>", "zinIds": ["<id>", ...] } ] }`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let phrases: { id: string; translatedText: string; sourceText: string }[];
  try {
    const body = await request.json();
    phrases = body.phrases ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (phrases.length < 2) return NextResponse.json({ groups: [] });

  const list = phrases
    .slice(0, 50)
    .map((p, i) => `${i + 1}. id:${p.id} | Japans: ${p.translatedText} | NL: ${p.sourceText}`)
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
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Grouping service error" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Group grammar route error:", err);
    return NextResponse.json({ error: "Grouping failed" }, { status: 500 });
  }
}
