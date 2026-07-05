import { NextRequest, NextResponse } from "next/server";
import { vocabTranslateSystemPrompt } from "@/lib/vocabTranslatePrompt";

// Vertaalt een lijst Nederlandse woorden naar de doeltaal (met lezing), zodat een
// gedeelde conceptenlijst per taal kan worden aangevuld zonder opnieuw te genereren.

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let words: { dutch: string; type?: string }[];
  let language: string;
  try {
    const body = await request.json();
    words    = body.words ?? [];
    language = body.language ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!words.length) return NextResponse.json({ translations: [] });

  const list = words
    .slice(0, 60)
    .map((w, i) => `${i + 1}. ${w.dutch}${w.type ? ` (${w.type})` : ""}`)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: vocabTranslateSystemPrompt(language) },
          { role: "user",   content: list },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Vocabulary translate service error" }, { status: 502 });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Vocabulary translate route error:", err);
    return NextResponse.json({ error: "Vocabulary translation failed" }, { status: 500 });
  }
}
