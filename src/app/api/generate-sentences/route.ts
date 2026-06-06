import { NextRequest, NextResponse } from "next/server";

const JA_BASE_PROMPT = `Je bent een Japanse taalleraar voor Nederlandstalige reizigers. Gegeven bestaande Japanse zinnen en woordenschat als context, genereer precies 8 nieuwe oefenzinnen.

Zinnen moeten realistische reissituaties zijn (eten bestellen, de weg vragen, winkelen, hotel, transport, etc.).

Reageer met ALLEEN geldig JSON:
{
  "sentences": [
    {
      "dutch": "<Nederlandse zin>",
      "japanese": "<Japans in kanji/kana>",
      "romaji": "<romaji uitspraak>"
    }
  ]
}`;

const ZH_BASE_PROMPT = `Je bent een Chinese (Mandarijn) taalleraar voor Nederlandstalige reizigers. Gegeven bestaande Chinese zinnen en woordenschat als context, genereer precies 8 nieuwe oefenzinnen.

Zinnen moeten realistische reissituaties zijn (eten bestellen, de weg vragen, winkelen, hotel, transport, etc.).
Gebruik Vereenvoudigd Chinees. Gebruik exact dezelfde veldnamen:

{
  "sentences": [
    {
      "dutch": "<Nederlandse zin>",
      "japanese": "<Chinees in vereenvoudigde karakters>",
      "romaji": "<pinyin met toonmarkeringen>"
    }
  ]
}`;

const ZH_DIFFICULTY_RULES: Record<string, { rules: string; temperature: number }> = {
  basis:     { rules: `Moeilijkheid: BASIS\n- Gebruik ALLEEN de opgegeven woorden en zinstructuren\n- Korte zinnen (max 6–8 Chinese tekens)\n- Alleen basisstructuren (主+谓+宾)`, temperature: 0.5 },
  gemiddeld: { rules: `Moeilijkheid: GEMIDDELD\n- Voornamelijk opgegeven woordenschat, mag 1–2 verwante woorden toevoegen\n- Iets gevarieerder: gebruik 的、了、吧\n- Middellange zinnen`, temperature: 0.7 },
  gevorderd: { rules: `Moeilijkheid: GEVORDERD\n- Gerelateerde woordenschat vrij toegestaan\n- Gevarieerde structuren: 把-zinnen, 是...的, resultaatvervoeging\n- Langere zinnen met voegwoorden (因为、所以、但是)`, temperature: 0.85 },
  expert:    { rules: `Moeilijkheid: EXPERT\n- Vrij geïnspireerd op de categorieën — introduceer nieuwe verwante woorden\n- Complexe structuren, meerdere deelzinnen\n- Formeel en informeel taalgebruik, idiomatische uitdrukkingen`, temperature: 1.0 },
};

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
  let language: string;

  try {
    const body = await request.json();
    phrases    = body.phrases    ?? [];
    words      = body.words      ?? [];
    difficulty = body.difficulty ?? "basis";
    language   = body.language   ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!phrases.length && !words.length) {
    return NextResponse.json({ sentences: [] });
  }

  const isZh = language === "zh";
  const diffRules  = isZh ? ZH_DIFFICULTY_RULES : DIFFICULTY_RULES;
  const basePrompt = isZh ? ZH_BASE_PROMPT : JA_BASE_PROMPT;
  const { rules, temperature } = diffRules[difficulty] ?? diffRules.basis;
  const systemPrompt = `${basePrompt}\n\n${rules}`;

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
