"use client";

import { useEffect, useRef, useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguage } from "@/data/languages";
import AudioButton from "@/components/ui/AudioButton";

interface Item { target: string; reading: string; dutch: string; }

interface Result {
  transcription: string;
  score:    number | null;
  verdict?: "goed" | "bijna" | "opnieuw";
  feedback?: string;
  tip?:     string;
}

interface PronunciationSessionProps {
  getPhrasesForCategory: (id: string) => Array<{ translatedText: string; romaji: string; sourceText: string }>;
  selectedCategoryIds: string[];
  onClose: () => void;
}

const MAX_ITEMS = 15;

const VERDICT_STYLE: Record<string, string> = {
  goed:    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  bijna:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  opnieuw: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
};

export default function PronunciationSession({ getPhrasesForCategory, selectedCategoryIds, onClose }: PronunciationSessionProps) {
  const { language }               = useLanguage();
  const { recording, error, start, stop } = useRecorder();

  const [phase,     setPhase]     = useState<"loading" | "practice" | "empty">("loading");
  const [items,     setItems]     = useState<Item[]>([]);
  const [index,     setIndex]     = useState(0);
  const [busy,      setBusy]      = useState(false);   // transcriberen/feedback ophalen
  const [result,    setResult]    = useState<Result | null>(null);
  const [myUrl,     setMyUrl]     = useState<string | null>(null);
  const [revealed,  setRevealed]  = useState(false);   // antwoord (doeltaal) tonen

  const langLabel = getLanguage(language)?.label ?? "";

  // ── Zinnen verzamelen uit de gekozen categorieën ──────────────────────────────
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const seen = new Set<string>();
    const collected: Item[] = [];
    for (const catId of selectedCategoryIds) {
      for (const p of getPhrasesForCategory(catId)) {
        if (!p.translatedText || seen.has(p.translatedText)) continue;
        seen.add(p.translatedText);
        collected.push({ target: p.translatedText, reading: p.romaji, dutch: p.sourceText });
      }
    }
    const shuffled = collected.sort(() => Math.random() - 0.5).slice(0, MAX_ITEMS);
    setItems(shuffled);
    setPhase(shuffled.length ? "practice" : "empty");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Object-URL's van eigen opnames opruimen.
  const clearMyUrl = () => setMyUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  useEffect(() => () => { if (myUrl) URL.revokeObjectURL(myUrl); }, [myUrl]);

  const item = items[index];

  const handleMic = async () => {
    if (busy) return;
    if (!recording) {
      clearMyUrl();
      setResult(null);
      await start();
      return;
    }
    // Stoppen → opname verwerken.
    const rec = await stop();
    if (!rec) return;
    setMyUrl(rec.url);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", rec.blob, `audio.${rec.ext}`);
      form.append("ext", rec.ext);
      form.append("target", item.target);
      form.append("reading", item.reading);
      form.append("language", language);
      form.append("sourceText", item.dutch);
      const res  = await fetch("/api/pronunciation", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "mislukt");
      setResult(data as Result);
      setRevealed(true);   // na je poging het antwoord tonen om te vergelijken
    } catch {
      setResult({ transcription: "", score: null, verdict: "opnieuw", feedback: "Er ging iets mis bij het verwerken. Probeer het opnieuw." });
    } finally {
      setBusy(false);
    }
  };

  const playMine = () => { if (myUrl) void new Audio(myUrl).play(); };

  const next = () => {
    clearMyUrl();
    setResult(null);
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  // ── Laden ─────────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
        <p className="text-sm text-stone-400 dark:text-stone-500">Zinnen laden…</p>
      </div>
    );
  }

  // ── Niets te oefenen ────────────────────────────────────────────────────────────
  if (phase === "empty" || !item) {
    const done = phase === "practice" && !item;
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-4xl">{done ? "🎉" : "🎙️"}</p>
        <p className="text-base font-semibold text-stone-700 dark:text-stone-300">{done ? "Klaar!" : "Geen zinnen gevonden"}</p>
        <p className="text-sm text-stone-400 dark:text-stone-500 leading-relaxed">
          {done ? "Je hebt alle zinnen geoefend." : "Kies categorieën met zinnen om je uitspraak te oefenen."}
        </p>
        <button onClick={onClose} className="mt-2 text-sm text-stone-500 dark:text-stone-400 underline">Sluiten</button>
      </div>
    );
  }

  const verdict = result?.verdict ?? "";

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <p className="text-sm font-medium text-stone-400 dark:text-stone-500 tabular-nums">
          {index + 1} <span className="text-stone-300 dark:text-stone-600">/</span> {items.length}
        </p>
        <div className="w-9" />
      </div>

      {/* Doelzin */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-sm px-8 py-8 text-center">
          {revealed ? (
            <>
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">{langLabel}</p>
              <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight mb-2">{item.target}</p>
              <p className="text-base text-stone-400 dark:text-stone-500 italic mb-1">{item.reading}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">{item.dutch}</p>
              <AudioButton text={item.target} />
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">Hoe zeg je dit in het {langLabel}?</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 leading-snug mb-6">{item.dutch}</p>
              <button onClick={() => setRevealed(true)} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors underline">
                Toon antwoord
              </button>
            </>
          )}
        </div>

        {/* Resultaat */}
        {result && (
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-sm px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              {typeof result.score === "number" && (
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${VERDICT_STYLE[verdict] ?? "bg-stone-100 dark:bg-stone-800 text-stone-500"}`}>
                  {result.score}
                </span>
              )}
              {result.feedback && <p className="flex-1 text-sm text-stone-700 dark:text-stone-300 leading-snug">{result.feedback}</p>}
            </div>
            {result.transcription && (
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Herkend: <span className="text-stone-600 dark:text-stone-300">{result.transcription}</span>
              </p>
            )}
            {result.tip && (
              <p className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2">💡 {result.tip}</p>
            )}
            {myUrl && (
              <button onClick={playMine} className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors flex items-center gap-1.5">
                <span>▶</span> Speel je opname
              </button>
            )}
          </div>
        )}

        {error && <p className="text-xs text-rose-500 text-center">{error}</p>}
      </div>

      {/* Opname-knop + navigatie */}
      <div className="px-5 pb-12 pt-4 flex flex-col items-center gap-4">
        <button
          onClick={handleMic}
          disabled={busy}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
            recording
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
          }`}
          aria-label={recording ? "Stop opname" : "Start opname"}
        >
          {busy ? <span className="w-6 h-6 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : recording ? "◼" : "🎤"}
        </button>
        <p className="text-xs text-stone-400 dark:text-stone-500 h-4">
          {busy ? "Verwerken…" : recording ? "Tik om te stoppen" : result ? "Nog een keer? Tik op de microfoon" : "Tik en spreek de zin in"}
        </p>

        <button
          onClick={next}
          className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          {index === items.length - 1 ? "Afronden" : "Volgende zin →"}
        </button>
      </div>
    </div>
  );
}
