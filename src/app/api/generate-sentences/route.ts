import { NextRequest, NextResponse } from "next/server";

const BASE_PROMPT = `You are a Japanese language teacher for Dutch-speaking travelers. Given a set of existing Japanese phrases and vocabulary words as context, generate exactly 8 new practice sentences.

Sentences must be realistic travel situations (ordering food, asking directions, shopping, hotels, transport, etc.).

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

const DIFFICULTY_RULES: Record<string, { rules: string; temperature: number }> = {
  basis: {
    rules: `Difficulty: BASIS (beginner)
- Use ONLY the vocabulary and grammar patterns explicitly provided — introduce NO new words
- Create natural combinations of the provided material
- Short, simple sentences (max 7–8 Japanese words)
- Present tense only (〜です、〜ます forms)
- Same sentence structures as the provided examples`,
    temperature: 0.5,
  },
  gemiddeld: {
    rules: `Difficulty: GEMIDDELD (intermediate)
- Primarily use the provided vocabulary; you may introduce 1–2 closely related words per sentence (e.g. if "bus" is given, "tram" is acceptable; if "coffee" is given, "tea" is fine)
- Slightly more varied sentence structures
- Mix of present and simple past tense (〜ました)
- Medium-length sentences (max 10 Japanese words)`,
    temperature: 0.7,
  },
  gevorderd: {
    rules: `Difficulty: GEVORDERD (upper-intermediate)
- Use the provided material as inspiration; freely introduce related vocabulary from the same topic domain
- Varied sentence structures: use て-form, requests (〜てください), suggestions (〜ましょう), wants (〜たい)
- Mix of tenses; simple conjunctions (そして, でも, から)
- Longer sentences (up to 13 Japanese words)`,
    temperature: 0.85,
  },
  expert: {
    rules: `Difficulty: EXPERT (advanced)
- Be freely inspired by the category themes — introduce new, related vocabulary (e.g. if "piano" was given, use "violin"; if "train" was given, use "bullet train" or "subway")
- Complex sentence structures with multiple clauses
- All verb tenses including conditional (〜たら、〜ば), causative, or honorific forms
- Long, natural sentences that may include cultural nuances
- Aim to surprise and challenge the learner`,
    temperature: 1.0,
  },
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let phrases: { sourceText: string; translatedText: string; romaji: string }[];
  let words:   { japanese: string; romaji: string; dutch: string }[];
  let difficulty: string;

  try {
    const body = await request.json();
    phrases    = body.phrases    ?? [];
    words      = body.words      ?? [];
    difficulty = body.difficulty ?? "basis";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!phrases.length && !words.length) {
    return NextResponse.json({ sentences: [] });
  }

  const { rules, temperature } = DIFFICULTY_RULES[difficulty] ?? DIFFICULTY_RULES.basis;
  const systemPrompt = `${BASE_PROMPT}\n\n${rules}`;

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
    words.length   ? `\nBekende woordenschat:\n${wordsBlock}` : "",
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
          { role: "system", content: systemPrompt },
          { role: "user",   content: userMessage  },
        ],
        temperature,
        max_tokens: 900,
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
