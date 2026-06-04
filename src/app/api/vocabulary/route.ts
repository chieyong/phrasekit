import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a Japanese vocabulary teacher for Dutch-speaking travelers. Given a list of Japanese phrases (with romaji and Dutch meaning), extract the most useful vocabulary words.

Rules:
- Extract content words only: nouns, verbs, adjectives — NOT particles (wa, ga, wo, ni, de, mo, ka, to, no, e, ya), NOT grammatical endings alone (desu, masu, te, tte, shi)
- Extract 1–2 key words per phrase at most
- Remove duplicate words
- Maximum 20 words total
- Prefer practical travel words a tourist would want to learn

Respond with ONLY valid JSON in exactly this shape:
{
  "words": [
    { "japanese": "<kanji or kana>", "romaji": "<reading>", "dutch": "<Dutch translation>" }
  ]
}`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let phrases: { translatedText: string; romaji: string; sourceText: string }[];
  try {
    const body = await request.json();
    phrases = body.phrases ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!phrases.length) {
    return NextResponse.json({ words: [] });
  }

  const list = phrases
    .slice(0, 30)
    .map((p, i) => `${i + 1}. Japanese: ${p.translatedText} | Romaji: ${p.romaji} | Dutch: ${p.sourceText}`)
    .join("\n");

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
          { role: "user", content: list },
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty response from service" }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Vocabulary route error:", err);
    return NextResponse.json({ error: "Vocabulary extraction failed" }, { status: 500 });
  }
}
