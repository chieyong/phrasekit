import { NextRequest, NextResponse } from "next/server";
import { getLanguage } from "@/data/languages";

// Whisper verwacht een ISO-639-1 taalcode; Kantonees valt onder Chinees.
const WHISPER_LANGS = ["ja", "zh", "ko", "id", "en", "fr", "de", "es"];
function whisperLang(code: string): string | undefined {
  if (code === "yue") return "zh";
  return WHISPER_LANGS.includes(code) ? code : undefined;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file       = form.get("file");
  const target     = String(form.get("target") ?? "");
  const language   = String(form.get("language") ?? "ja");
  const sourceText = String(form.get("sourceText") ?? "");
  const ext        = String(form.get("ext") ?? "webm");
  if (!(file instanceof Blob) || !target) {
    return NextResponse.json({ error: "Audio en doelzin zijn vereist" }, { status: 400 });
  }

  // 1. Spraak → tekst (Whisper). De doelzin als prompt helpt de herkenning.
  let transcription = "";
  try {
    const wForm = new FormData();
    wForm.append("file", file, `audio.${ext}`);
    wForm.append("model", "whisper-1");
    wForm.append("prompt", target);
    const lang = whisperLang(language);
    if (lang) wForm.append("language", lang);

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: wForm,
    });
    if (!res.ok) return NextResponse.json({ error: "Transcriptie mislukt" }, { status: 502 });
    const data = await res.json();
    transcription = (data.text ?? "").trim();
  } catch (err) {
    console.error("pronunciation transcribe error:", err);
    return NextResponse.json({ error: "Transcriptie mislukt" }, { status: 500 });
  }

  // 2. Vergelijk met de doelzin en geef feedback.
  const label = getLanguage(language)?.label ?? "de doeltaal";
  const system = `Je bent een vriendelijke uitspraakcoach ${label} voor een Nederlandstalige. Je krijgt de doelzin en wat de spraakherkenning van de opname maakte. Beoordeel de uitspraak op basis van hoe dicht de herkende tekst bij de doelzin ligt qua klank en betekenis (niet qua exacte spelling). Wees bemoedigend maar eerlijk.

Antwoord met ALLEEN geldige JSON:
{ "score": 0-100, "verdict": "goed|bijna|opnieuw", "feedback": "1-2 zinnen in het Nederlands", "tip": "korte uitspraaktip of lege string" }

Richtlijnen:
- 80-100 = goed herkenbaar; 50-79 = bijna, kleine afwijkingen; onder 50 = moeilijk te verstaan of iets anders gezegd.
- Als de herkende tekst leeg of totaal anders is: verdict "opnieuw", lage score, moedig aan het opnieuw te proberen.
- feedback: benoem concreet wat goed ging of afweek, zonder technisch jargon.`;
  const user = `Doelzin (${label}): ${target}${sourceText ? `\nBetekenis (NL): ${sourceText}` : ""}\nHerkend uit de opname: ${transcription || "(niets verstaan)"}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });
    if (!res.ok) return NextResponse.json({ transcription, score: null });
    const data    = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed  = content ? JSON.parse(content) : {};
    return NextResponse.json({ transcription, ...parsed });
  } catch (err) {
    console.error("pronunciation feedback error:", err);
    return NextResponse.json({ transcription, score: null });
  }
}
