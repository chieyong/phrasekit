import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a Japanese language teacher for Dutch-speaking travelers. Given a set of existing Japanese phrases and vocabulary words as context, generate exactly 8 new practice sentences.

Rules:
- Generate creative VARIATIONS and COMBINATIONS based on the provided material — not exact copies
- Sentences must be realistic travel situations (ordering food, asking directions, shopping, hotels, transport, etc.)
- Use the same vocabulary and grammar patterns as the provided examples so difficulty stays consistent
- Keep sentences short and practical (max ~10 words in Japanese)
- Vary the difficulty slightly: a mix of easy and slightly more challenging combinations

Respond with ONLY valid JSON in exactly this shape:
{
  "sentences": [
    {
      "dutch": "<Dutch sentence>",
      "japanese": "<Japanese in kanji/kana>",
      "romaji": "<romaji pronunciation>"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let phrases: { sourceText: string; translatedText: string; romaji: string }[];
  let words: { japanese: string; romaji: string; dutch: string }[];

  try {
    const body = await request.json();
    phrases = body.phrases ?? [];
    words   = body.words   ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!phrases.length && !words.length) {
    return NextResponse.json({ sentences: [] });
  }

  const phrasesBlock = phrases
    .slice(0, 20)
    .map((p) => `- "${p.sourceText}" → ${p.translatedText} (${p.romaji})`)
    .join("\n");

  const wordsBlock = words
    .slice(0, 20)
    .map((w) => `- ${w.dutch}: ${w.japanese} (${w.romaji})`)
    .join("\n");

  const userMessage = [
    phrases.length ? `Bestaande zinnen:\n${phrasesBlock}` : "",
    words.length   ? `\nBekend woordenschat:\n${wordsBlock}` : "",
  ].filter(Boolean).join("\n");

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
          { role: "user",   content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Generation service error" }, { status: 502 });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty response from service" }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Generate-sentences route error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
