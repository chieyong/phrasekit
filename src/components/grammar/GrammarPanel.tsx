"use client";

import { useState } from "react";
import { GrammarExplanation } from "@/types";
import AudioButton from "@/components/ui/AudioButton";

type ExplainResult = GrammarExplanation;

interface QA { question: string; answer: string; }

export default function GrammarPanel({
  japanese,
  romaji,
  english,
  language = "ja",
  stored,
  onFetched,
  embedded = false,
}: {
  japanese: string;
  romaji: string;
  english: string;
  language?: "ja" | "zh";
  stored?: GrammarExplanation;
  onFetched?: (result: GrammarExplanation) => void;
  embedded?: boolean;
}) {
  const [state,    setState]    = useState<"idle" | "loading" | "done" | "error">(stored ? "done" : "idle");
  const [result,   setResult]   = useState<ExplainResult | null>(stored ?? null);
  const [error,    setError]    = useState("");
  const [qaList,      setQaList]      = useState<QA[]>([]);
  const [vraag,       setVraag]       = useState("");
  const [asking,      setAsking]      = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const load = async () => {
    if (state === "loading" || state === "done") return;
    setState("loading");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ japanese, romaji, english, language }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data: ExplainResult = await res.json();
      setResult(data);
      setState("done");
      onFetched?.(data);
    } catch {
      setError("Kon uitleg niet laden.");
      setState("error");
    }
  };

  if (state === "idle") load();

  const handleAskQuestion = async () => {
    const q = vraag.trim();
    if (!q || asking) return;
    setAsking(true);
    setVraag("");
    try {
      const res = await fetch("/api/grammar-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japanese,
          romaji,
          english,
          grammarSummary: result?.summary ?? "",
          question: q,
          history: qaList,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const { answer } = await res.json();
      setQaList((prev) => [...prev, { question: q, answer }]);
    } catch {
      setQaList((prev) => [...prev, { question: q, answer: "Sorry, kon geen antwoord ophalen." }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className={embedded
      ? "border-t border-stone-100 dark:border-stone-700 mt-4 pt-4"
      : "bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 mb-3"}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
          Grammatica
        </p>
        {state === "done" && (
          <button
            onClick={() => { setState("idle"); setResult(null); }}
            className="text-[10px] text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
          >
            ↺ Vernieuwen
          </button>
        )}
      </div>

      {state === "loading" && (
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full w-3/4" />
          <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full w-1/2" />
          <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full w-2/3" />
        </div>
      )}

      {state === "error" && (
        <p className="text-sm text-stone-400 dark:text-stone-500">{error}</p>
      )}

      {state === "done" && result && (
        <>
          <div className="space-y-3">
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{result.summary}</p>

            {result.parts.length > 0 && (
              <div className="flex flex-col gap-2">
                {result.parts.map((part, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-lg px-2.5 py-1 shrink-0 min-w-[60px]">
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{part.japanese}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">{part.romaji}</p>
                    </div>
                    <div className="mt-0.5">
                      <p className="text-sm text-stone-600 dark:text-stone-400">{part.role}</p>
                      {part.note && (
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{part.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.examples && result.examples.length > 0 && (
              <div className="border-t border-stone-100 dark:border-stone-700 pt-3">
                <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">
                  Voorbeelden
                </p>
                <div className="flex flex-col gap-2">
                  {result.examples.map((ex, i) => (
                    <div key={i} className="bg-stone-50 dark:bg-stone-800/60 rounded-xl px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 leading-snug">{ex.japanese}</p>
                        <AudioButton text={ex.japanese} className="shrink-0" />
                      </div>
                      <p className="text-xs text-stone-400 dark:text-stone-500 italic mt-0.5">{ex.romaji}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{ex.dutch}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.tip && (
              <p className="text-xs text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-700 pt-3 leading-relaxed">
                💡 {result.tip}
              </p>
            )}
          </div>

          {/* ── Vervolgvragen ───────────────────────────────── */}
          <div className="mt-4 border-t border-stone-100 dark:border-stone-700 pt-4">
            {qaList.map((qa, i) => (
              <div key={i} className="mb-4">
                <p className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-1">↳ {qa.question}</p>
                <div className="flex items-start gap-2">
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed flex-1">{qa.answer}</p>
                  <button
                    onClick={() => handleCopy(qa.answer, i)}
                    aria-label="Kopieer antwoord"
                    className="shrink-0 mt-0.5 text-xs text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                  >
                    {copiedIndex === i ? "✓" : "⎘"}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={vraag}
                onChange={(e) => setVraag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                placeholder="Stel een aanvullende vraag…"
                className="flex-1 bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-700 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none focus:ring-1 focus:ring-stone-200 dark:focus:ring-stone-600 transition"
              />
              <button
                onClick={handleAskQuestion}
                disabled={!vraag.trim() || asking}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm disabled:opacity-30 active:scale-95 transition-all shrink-0"
                aria-label="Verstuur vraag"
              >
                {asking ? "…" : "↑"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
