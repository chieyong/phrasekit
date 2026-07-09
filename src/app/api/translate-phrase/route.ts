import { NextRequest, NextResponse } from "next/server";
import { buildPhraseTranslatePrompt } from "@/lib/phraseTranslatePrompt";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let sourceText: string, language: string;
  try {
    const body = await request.json();
    sourceText = (body.sourceText ?? "").trim();
    language   = body.language ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!sourceText) return NextResponse.json({ error: "sourceText is required" }, { status: 400 });

  const systemPrompt = buildPhraseTranslatePrompt(language);
  if (!systemPrompt) return NextResponse.json({ error: "Unknown language" }, { status: 400 });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: sourceText },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Translation service error" }, { status: 502 });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("translate-phrase route error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
