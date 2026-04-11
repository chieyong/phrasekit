import { NextRequest, NextResponse } from "next/server";

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Japanese language teacher helping English-speaking tourists understand Japanese phrases.

Given a Japanese phrase (with its romaji and English meaning), explain the grammar in plain, friendly English — as if talking to someone with zero Japanese knowledge.

Respond with ONLY valid JSON in exactly this shape:

{
  "summary": "<1 sentence overview of what the phrase does grammatically>",
  "parts": [
    {
      "japanese": "<word or particle>",
      "romaji": "<romanized>",
      "role": "<brief role, e.g. 'topic marker', 'destination particle', 'polite request ending'>",
      "note": "<optional extra tip, keep it short>"
    }
  ],
  "tip": "<1 practical tip about when or how to use this phrase in real life>"
}

Keep everything short and non-technical. Avoid jargon like 'nominative' or 'copula' — say 'marks the subject' or 'means is/are' instead.`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  let japanese: string;
  let romaji: string;
  let english: string;

  try {
    const body = await request.json();
    japanese = (body.japanese ?? "").trim();
    romaji = (body.romaji ?? "").trim();
    english = (body.english ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!japanese) {
    return NextResponse.json({ error: "Japanese text is required" }, { status: 400 });
  }

  const userMessage = `Japanese: ${japanese}\nRomaji: ${romaji}\nMeaning: ${english}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "Explanation service error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from service" },
        { status: 502 }
      );
    }

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Explain route error:", err);
    return NextResponse.json({ error: "Explanation failed" }, { status: 500 });
  }
}
