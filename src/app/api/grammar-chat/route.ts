import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Je bent een Japanse taalexpert die Nederlandse reizigers helpt een specifieke Japanse zin te begrijpen.

Je krijgt context over de zin en een grammaticauitleg die al is gegeven. Beantwoord de vervolgvraag van de gebruiker beknopt en in het Nederlands. Wees vriendelijk en praktisch. Vermijd technisch jargon — schrijf alsof je praat met iemand zonder taalachtergrond.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let japanese: string, romaji: string, english: string;
  let grammarSummary: string, question: string;
  let history: { question: string; answer: string }[];

  try {
    const body = await request.json();
    japanese      = (body.japanese      ?? "").trim();
    romaji        = (body.romaji        ?? "").trim();
    english       = (body.english       ?? "").trim();
    grammarSummary = (body.grammarSummary ?? "").trim();
    question      = (body.question      ?? "").trim();
    history       = body.history ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const contextBlock = `Japanse zin: ${japanese}
Romaji: ${romaji}
Nederlandse betekenis: ${english}
${grammarSummary ? `Grammaticaoverzicht: ${grammarSummary}` : ""}`;

  // Build conversation: context as first user message, then Q&A history, then new question
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system",    content: SYSTEM_PROMPT },
    { role: "user",      content: `Context over de zin:\n${contextBlock}` },
    { role: "assistant", content: "Begrepen! Stel gerust je vragen over deze zin." },
    ...history.flatMap((qa) => [
      { role: "user"      as const, content: qa.question },
      { role: "assistant" as const, content: qa.answer   },
    ]),
    { role: "user", content: question },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "gpt-4o-mini",
        messages,
        temperature: 0.5,
        max_tokens:  300,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("grammar-chat error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
