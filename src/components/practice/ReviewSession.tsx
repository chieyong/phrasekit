"use client";

import { useEffect, useRef, useState } from "react";
import { useSrs, SrsSeed, srsCardId } from "@/hooks/useSrs";
import { useDailyStats } from "@/hooks/useDailyStats";
import { useVocabulary, wordForLang } from "@/hooks/useVocabulary";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguage } from "@/data/languages";
import AudioButton from "@/components/ui/AudioButton";

// Hoeveel nieuwe woorden een sessie maximaal introduceert bovenop de herhalingen.
const DAILY_NEW = 10;
// Maximaal aantal kaarten in een gerichte categorie-sessie.
const CATEGORY_MAX = 30;

interface ReviewSessionProps {
  allCategories: Array<{ id: string; name: string; icon: string }>;
  // Gezet = gerichte categorie-sessie: alle woorden uit deze categorieën, geen
  // due-prioriteit. Beoordelingen tellen wél mee in de SRS. Leeg/undefined = Vandaag.
  scopeCategoryIds?: string[];
  onClose: () => void;
}

type Phase = "loading" | "review" | "done" | "empty";

export default function ReviewSession({ allCategories, scopeCategoryIds, onClose }: ReviewSessionProps) {
  const { dueCards, rate }   = useSrs();
  const { recordReviews }    = useDailyStats();
  const { getConcepts }      = useVocabulary();
  const { language }         = useLanguage();

  const [phase,     setPhase]     = useState<Phase>("loading");
  const [queue,     setQueue]     = useState<SrsSeed[]>([]);
  const [dueTotal,  setDueTotal]  = useState(0);
  const [index,     setIndex]     = useState(0);
  const [flipped,   setFlipped]   = useState(false);
  const [dir,       setDir]       = useState(1);
  const [knownCnt,  setKnownCnt]  = useState(0);

  // Aantal beoordeelde kaarten; bij sluiten één keer wegschrijven (streak/dagdoel).
  const ratedRef  = useRef(0);
  const recordRef = useRef(recordReviews);
  recordRef.current = recordReviews;
  useEffect(() => () => { if (ratedRef.current > 0) void recordRef.current(ratedRef.current); }, []);

  // ── Sessie opbouwen: herhalingen eerst, daarna een portie nieuwe woorden ──────
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const build = async () => {
      // ── Gerichte modus: alle woorden uit de gekozen categorieën ───────────────
      if (scopeCategoryIds && scopeCategoryIds.length) {
        const seen  = new Set<string>();
        const words: SrsSeed[] = [];
        for (const catId of scopeCategoryIds) {
          const concepts = await getConcepts(catId).catch(() => null);
          if (!concepts) continue;
          for (const c of concepts) {
            const w = wordForLang(c, language);
            if (!w) continue;
            const seed: SrsSeed = { type: "word", lang: language, dutch: w.dutch, target: w.japanese, reading: w.romaji };
            const id = srsCardId(seed.type, seed.lang, seed.dutch);
            if (seen.has(id)) continue;
            seen.add(id);
            words.push(seed);
          }
        }
        const built = words.sort(() => Math.random() - 0.5).slice(0, CATEGORY_MAX);
        setDueTotal(0);
        setQueue(built);
        setPhase(built.length ? "review" : "empty");
        return;
      }

      // ── Vandaag-modus: herhalingen eerst, daarna een portie nieuwe woorden ────
      // 1. Due-kaarten uit de SRS (momentopname bij openen).
      const due = dueCards(language).map((c): SrsSeed => ({
        type: c.type, lang: c.lang, dutch: c.dutch, target: c.target, reading: c.reading,
      }));
      const inQueue = new Set(due.map((s) => srsCardId(s.type, s.lang, s.dutch)));

      // 2. Nieuwe woorden uit de vocab-concepten (geen netwerk; alleen de actieve taal).
      const fresh: SrsSeed[] = [];
      for (const cat of allCategories) {
        if (fresh.length >= DAILY_NEW) break;
        const concepts = await getConcepts(cat.id).catch(() => null);
        if (!concepts) continue;
        for (const c of concepts) {
          const w = wordForLang(c, language);
          if (!w) continue;
          const seed: SrsSeed = { type: "word", lang: language, dutch: w.dutch, target: w.japanese, reading: w.romaji };
          const id = srsCardId(seed.type, seed.lang, seed.dutch);
          if (inQueue.has(id)) continue;   // al due of al toegevoegd
          inQueue.add(id);
          fresh.push(seed);
          if (fresh.length >= DAILY_NEW) break;
        }
      }

      const shuffledDue = [...due].sort(() => Math.random() - 0.5);
      const built = [...shuffledDue, ...fresh];
      setDueTotal(due.length);
      setQueue(built);
      setPhase(built.length ? "review" : "empty");
    };

    void build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRate = async (known: boolean) => {
    const seed = queue[index];
    if (!seed) return;
    ratedRef.current += 1;
    if (known) setKnownCnt((n) => n + 1);
    void rate(seed, known);          // persist op de achtergrond
    const next = index + 1;
    setDir(1);
    setFlipped(false);
    setTimeout(() => {
      // Laatste kaart → naar de afronding; anders index nooit buiten bereik zetten.
      if (next >= queue.length) setPhase("done");
      else setIndex(next);
    }, known ? 160 : 40);
  };

  const langLabel = getLanguage(language)?.label ?? "";

  // ── Laden ─────────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
        <p className="text-sm text-stone-400 dark:text-stone-500">Sessie samenstellen…</p>
      </div>
    );
  }

  // ── Niets te doen ───────────────────────────────────────────────────────────────
  if (phase === "empty") {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-4xl">🌱</p>
        <p className="text-base font-semibold text-stone-700 dark:text-stone-300">Alles bij!</p>
        <p className="text-sm text-stone-400 dark:text-stone-500 leading-relaxed">
          Geen herhalingen open en geen nieuwe woorden gevonden. Genereer eerst woordenlijsten in je categorieën.
        </p>
        <button onClick={onClose} className="mt-2 text-sm text-stone-500 dark:text-stone-400 underline">Sluiten</button>
      </div>
    );
  }

  // ── Klaar ─────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-5xl">🎉</p>
        <p className="text-lg font-semibold text-stone-800 dark:text-stone-200">Sessie klaar</p>
        <p className="text-sm text-stone-400 dark:text-stone-500 leading-relaxed">
          {queue.length} {queue.length === 1 ? "kaart" : "kaarten"} gedaan · {knownCnt} gewist
          {dueTotal > 0 && ` · ${dueTotal} herhaald`}
        </p>
        <button
          onClick={onClose}
          className="mt-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl px-6 py-2.5 text-sm font-medium active:scale-95 transition-all"
        >
          Terug
        </button>
      </div>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────────
  const card = queue[index];
  if (!card) return null;   // vangnet tijdens de overgang naar "done"
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <p className="text-sm font-medium text-stone-400 dark:text-stone-500 tabular-nums">
          {index + 1} <span className="text-stone-300 dark:text-stone-600">/</span> {queue.length}
        </p>
        <div className="w-9" />
      </div>

      {/* Voortgangsbalk */}
      <div className="px-5 mb-2">
        <div className="h-1 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
          <div className="h-full bg-stone-700 dark:bg-stone-300 transition-all" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
      </div>

      {/* Kaart */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div key={index} className="w-full max-w-sm card-slide-in" style={{ perspective: "1200px", "--slide-from": `${dir * 44}px` } as React.CSSProperties}>
          <div
            onClick={() => setFlipped((v) => !v)}
            style={{
              transformStyle: "preserve-3d",
              transform:      flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition:     "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
              position:       "relative",
              height:         "260px",
              cursor:         "pointer",
            }}
          >
            {/* Voorkant: Nederlands */}
            <div style={{ backfaceVisibility: "hidden" }} className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-6">Nederlands</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">{card.dutch}</p>
              <p className="text-xs text-stone-300 dark:text-stone-600 mt-8">Tik om het antwoord te zien</p>
            </div>
            {/* Achterkant: doeltaal */}
            <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-6">{langLabel}</p>
              <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight mb-2">{card.target}</p>
              <p className="text-base text-stone-400 dark:text-stone-500 italic mb-4">{card.reading}</p>
              <AudioButton text={card.target} />
            </div>
          </div>
        </div>
      </div>

      {/* Scoreknoppen */}
      <div className="px-5 pb-14 pt-4">
        <div className="flex gap-3 max-w-sm mx-auto">
          <button
            onClick={() => handleRate(false)}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl py-4 text-sm font-medium active:scale-95 transition-all"
          >
            <span className="text-red-400">✗</span> Nog niet
          </button>
          <button
            onClick={() => handleRate(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl py-4 text-sm font-medium active:scale-95 transition-all"
          >
            <span className="text-green-400">✓</span> Wist ik
          </button>
        </div>
        <p className="text-center text-[11px] text-stone-300 dark:text-stone-600 mt-3">
          Draai de kaart om, beoordeel dan eerlijk
        </p>
      </div>
    </div>
  );
}
