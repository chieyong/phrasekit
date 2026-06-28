import { NextRequest, NextResponse } from "next/server";

const ZH_PROMPT = `Je bent een Chinees (Mandarijn) taalassistent voor Nederlandstalige toeristen in China.
Gegeven een Nederlandse zin of uitdrukking, maak een natuurlijke Chinese vertaling geschikt voor dagelijkse reissituaties.

Reageer met ALLEEN geldig JSON:
{
  "chineseText": "<Vereenvoudigd Chinees>",
  "pinyin": "<pinyin met toonmarkeringen, bijv. nǐ hǎo>",
  "chineseExplanation": "<in het Nederlands: wat de zin betekent en wanneer te gebruiken, max 2 zinnen>"
}

Gebruik Vereenvoudigd Chinees (简体字), pinyin met correcte toonmarkeringen, natuurlijk Mandarijn.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

  let sourceText: string;
  try {
    const body = await request.json();
    sourceText = (body.sourceText ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!sourceText) return NextResponse.json({ error: "sourceText is required" }, { status: 400 });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ZH_PROMPT },
          { role: "user",   content: sourceText },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "Translation error" }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(JSON.parse(data.choices?.[0]?.message?.content ?? "{}"));
  } catch (err) {
    console.error("translate-chinese error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
