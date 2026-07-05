import { NextRequest, NextResponse } from "next/server";
import { buildLessonMessages, LessonPhrase } from "@/lib/grammarLessonPrompt";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

  let moduleName: string;
  let phrases: LessonPhrase[];
  let language: string;
  try {
    const body  = await request.json();
    moduleName  = body.moduleName ?? "";
    phrases     = body.phrases   ?? [];
    language    = body.language  ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!moduleName) return NextResponse.json({ error: "Module name required" }, { status: 400 });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: buildLessonMessages(moduleName, language, phrases),
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: "Module detail error" }, { status: 502 });

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty response" }, { status: 502 });

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("grammar-module-detail error:", err);
    return NextResponse.json({ error: "Module detail failed" }, { status: 500 });
  }
}
