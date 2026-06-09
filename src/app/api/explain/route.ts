import { NextRequest, NextResponse } from "next/server";

const JA_PROMPT = `Je bent een Japanse taalleraar voor Nederlandstalige reizigers. Gegeven een Japanse zin (met romaji en Nederlandse betekenis), leg de grammatica uit in eenvoudig, begrijpelijk Nederlands.

Reageer met ALLEEN geldig JSON:
{
  "summary": "<1 zin overzicht van de grammatica>",
  "parts": [
    {
      "japanese": "<woord of partikel zoals het in de zin staat>",
      "romaji": "<romanisering>",
      "role": "<grammaticale functie, bijv. 'onderwerpmarkeerder', 'beleefde afsluiting'>",
      "note": "<optionele extra tip — zie instructie hieronder>"
    }
  ],
  "tip": "<1 praktische tip over wanneer/hoe te gebruiken>"
}

Instructies voor het 'note' veld bij werkwoorden:
- Als een werkwoord in vervoegde vorm staat (niet de basisvorm), vermeld dan ALTIJD: "Basisvorm: [辞書形] ([romaji]). [1 zin uitleg van de vervoeging, bijv. hoe de て-vorm werkt of wat de ます-vorm betekent]"
- Voorbeeld: voor 遊んでいます → note: "Basisvorm: 遊ぶ (asobu). て-vorm + います = is momenteel aan het spelen."
- Geen jargon — zeg 'markeert het onderwerp' i.p.v. 'nominatief'.`;

const ZH_PROMPT = `Je bent een Chinese (Mandarijn) taalleraar voor Nederlandstalige reizigers. Gegeven een Chinese zin (met pinyin en Nederlandse betekenis), leg de grammatica uit in eenvoudig, begrijpelijk Nederlands.

Reageer met ALLEEN geldig JSON — gebruik dezelfde veldnamen als hieronder:
{
  "summary": "<1 zin overzicht van de grammatica>",
  "parts": [
    {
      "japanese": "<woord of karakter(s) zoals het in de zin staat>",
      "romaji": "<pinyin>",
      "role": "<grammaticale functie, bijv. 'onderwerp', 'werkwoord', 'aanwijzend voornaamwoord'>",
      "note": "<optionele extra tip — zie instructie hieronder>"
    }
  ],
  "tip": "<1 praktische tip over wanneer/hoe te gebruiken>"
}

Instructies voor het 'note' veld bij werkwoorden:
- Als een werkwoord gecombineerd is met aspectdeeltjes (了, 过, 着) of met een resultaatsvervoeging, vermeld dan: "Basisvorm: [karakter(s)] ([pinyin]). [1 zin uitleg van de combinatie]"
- Voorbeeld: voor 买了 → note: "Basisvorm: 买 (mǎi). 了 geeft aan dat de actie is voltooid."
- Geen jargon — eenvoudige, toegankelijke uitleg.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let japanese: string, romaji: string, english: string, language: string;
  try {
    const body = await request.json();
    japanese = (body.japanese ?? "").trim();
    romaji   = (body.romaji   ?? "").trim();
    english  = (body.english  ?? "").trim();
    language = body.language ?? "ja";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!japanese) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const systemPrompt  = language === "zh" ? ZH_PROMPT : JA_PROMPT;
  const labelText     = language === "zh" ? "Chinees" : "Japans";
  const labelReading  = language === "zh" ? "Pinyin"  : "Romaji";
  const userMessage   = `${labelText}: ${japanese}\n${labelReading}: ${romaji}\nBetekenis: ${english}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userMessage  },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Explanation service error" }, { status: 502 });
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty response from service" }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Explain route error:", err);
    return NextResponse.json({ error: "Explanation failed" }, { status: 500 });
  }
}
