import { NextRequest, NextResponse } from "next/server";

const JA_PROMPT = `Je bent een Japanse grammaticadocent die uitvoerige, heldere lessen schrijft voor Nederlandstalige reizigers. Schrijf een volledige grammaticales over het opgegeven patroon.

Geef terug als JSON:
{
  "naam": "...",
  "tagline": "...",
  "niveau": "basis|gemiddeld|gevorderd",
  "kernregel": "...",
  "patroon": "...",
  "uitleg": "...",
  "opbouw": [ { "element": "...", "rol": "...", "voorbeeld": "..." } ],
  "tips": [ "..." ],
  "veelgemaaktefouten": [ "..." ],
  "extraVoorbeelden": [ { "japanese": "...", "romaji": "...", "dutch": "..." } ]
}

Richtlijnen:
- kernregel: 2-3 zinnen die precies uitleggen wanneer en waarom dit patroon wordt gebruikt
- patroon: formele notatie, bijv. "[werkwoordstam] + て + [volgende handeling]"
- uitleg: uitvoerige uitleg in 5-7 zinnen — context, nuances, vergelijking met Nederlands
- opbouw: elk onderdeel apart verklaard met woordvoorbeeld (3-5 elementen)
- tips: 3-4 praktische geheugensteuntjes
- veelgemaaktefouten: 2-3 fouten die Nederlandstaligen maken, met correctie
- extraVoorbeelden: 6 nieuwe voorbeeldzinnen; veld "japanese" bevat de Japanse tekst`;

const ZH_PROMPT = `Je bent een Chinese grammaticadocent (Mandarijn) die uitvoerige, heldere lessen schrijft voor Nederlandstalige reizigers. Schrijf een volledige grammaticales over het opgegeven patroon.

Geef terug als JSON:
{
  "naam": "...",
  "tagline": "...",
  "niveau": "basis|gemiddeld|gevorderd",
  "kernregel": "...",
  "patroon": "...",
  "uitleg": "...",
  "opbouw": [ { "element": "...", "rol": "...", "voorbeeld": "..." } ],
  "tips": [ "..." ],
  "veelgemaaktefouten": [ "..." ],
  "extraVoorbeelden": [ { "japanese": "...", "romaji": "...", "dutch": "..." } ]
}

Richtlijnen:
- kernregel: 2-3 zinnen die precies uitleggen wanneer en waarom dit patroon wordt gebruikt
- patroon: formele notatie, bijv. "[onderwerp] + 把 + [object] + [werkwoord] + [resultaat]"
- uitleg: uitvoerige uitleg in 5-7 zinnen — context, nuances, vergelijking met Nederlands
- opbouw: elk onderdeel apart verklaard met woordvoorbeeld (3-5 elementen)
- tips: 3-4 praktische geheugensteuntjes specifiek voor Nederlandstaligen
- veelgemaaktefouten: 2-3 fouten die Nederlandstaligen maken met dit patroon, met correctie
- extraVoorbeelden: 6 nieuwe voorbeeldzinnen; veld "japanese" bevat de Chinese tekst (Vereenvoudigd), "romaji" bevat de pinyin met toonmarkeringen`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

  let moduleName: string;
  let phrases: { translatedText: string; romaji: string; sourceText: string }[];
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

  const isZh        = language === "zh";
  const langLabel   = isZh ? "Chinees (Mandarijn)" : "Japans";
  const readingLabel = isZh ? "pinyin" : "romaji";

  const phrasesText = phrases.length > 0
    ? `\n\nDe gebruiker heeft deze zinnen in zijn collectie die dit patroon gebruiken:\n${
        phrases.slice(0, 15).map((p, i) => `${i + 1}. ${p.translatedText} (${p.romaji}) — ${p.sourceText}`).join("\n")
      }`
    : "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: isZh ? ZH_PROMPT : JA_PROMPT },
          { role: "user",   content: `Schrijf een uitvoerige ${langLabel} grammaticales over het patroon: "${moduleName}". Gebruik ${readingLabel} voor de romanisering.${phrasesText}` },
        ],
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
