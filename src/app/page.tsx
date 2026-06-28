"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CategoryGrid, { GridCategory } from "@/components/cards/CategoryGrid";
import PhraseCard from "@/components/cards/PhraseCard";
import InlineTranslator from "@/components/ui/InlineTranslator";
import CategoryPicker from "@/components/ui/CategoryPicker";
import { categories, phrases as staticPhrases, getPhrasesByCategory } from "@/data/mockData";
import GrammarScreen from "@/components/grammar/GrammarScreen";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";
import { useVocabulary, VocabWord } from "@/hooks/useVocabulary";
import { usePracticeSets, PracticeSentence, Difficulty, generateSetName } from "@/hooks/usePracticeSets";
import AudioButton from "@/components/ui/AudioButton";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phrase } from "@/types";

// ─── Vocab practice modal ─────────────────────────────────────────────────────

interface VocabPracticeModalProps {
  allCategories: Array<{ id: string; name: string; icon: string }>;
  getPhrasesForCategory: (id: string) => Array<{ translatedText: string; romaji: string; sourceText: string }>;
  initialSelected: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
  autoStart?: boolean;
}

function VocabPracticeModal({ allCategories, getPhrasesForCategory, initialSelected, onSelectionChange, onClose, autoStart }: VocabPracticeModalProps) {
  const { getVocab, saveVocab }  = useVocabulary();
  const { language }             = useLanguage();
  const [mode,       setMode]       = useState<"select" | "loading" | "practice">(autoStart ? "loading" : "select");
  const [selected,   setSelected]   = useState<Set<string>>(() => new Set(initialSelected));
  const [words,      setWords]      = useState<VocabWord[]>([]);
  const [cardIndex,  setCardIndex]  = useState(0);
  const [flipped,    setFlipped]    = useState(false);

  const allIds = allCategories.map((c) => c.id);
  const allSelected = allIds.every((id) => selected.has(id));

  const toggleCat = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id);
      onSelectionChange([...s]); return s;
    });

  const toggleAll = () => {
    const next = allSelected ? new Set<string>() : new Set(allIds);
    setSelected(next); onSelectionChange([...next]);
  };

  const handleStart = async () => {
    if (selected.size === 0) return;
    setMode("loading");

    const all: VocabWord[] = [];
    for (const catId of selected) {
      const cached = await getVocab(catId, language).catch(() => null);
      if (cached) { all.push(...cached); continue; }

      const catPhrases = getPhrasesForCategory(catId);
      if (!catPhrases.length) continue;
      try {
        const res  = await fetch("/api/vocabulary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrases: catPhrases, language }),
        });
        const data = await res.json();
        const fetched: VocabWord[] = data.words ?? [];
        saveVocab(catId, fetched, language);
        all.push(...fetched);
      } catch { /* skip */ }
    }

    // Deduplicate on text key, then shuffle (verbs stay grouped at end within the shuffle)
    const unique  = Array.from(new Map(all.map((w) => [w.japanese, w])).values());
    const nonVerbs = unique.filter((w) => w.type !== "verb").sort(() => Math.random() - 0.5);
    const verbs    = unique.filter((w) => w.type === "verb").sort(() => Math.random() - 0.5);
    const shuffled = [...nonVerbs, ...verbs];
    setWords(shuffled);
    setCardIndex(0);
    setFlipped(false);
    setMode("practice");
  };

  // Scope is chosen on the Verdiepen tab; when opened from there we skip the
  // select screen and generate straight away.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    void handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const go = (delta: number) => {
    setFlipped(false);
    setTimeout(() => setCardIndex((i) => Math.min(Math.max(i + delta, 0), words.length - 1)), 50);
  };

  const handleBackdrop = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  // ── Select screen ──────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={handleBackdrop}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md mx-auto bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl">
          <div className="relative flex items-center justify-center pt-4 pb-1 px-5">
            <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
            <button onClick={onClose} className="absolute right-5 top-4 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Annuleren
            </button>
          </div>
          <div className="px-5 pt-3 pb-2">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">🎯 Woorden oefenen</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Kies de categorieën die je wilt oefenen</p>
          </div>
          <div className="px-3 overflow-y-auto max-h-[45vh]">
            <button onClick={toggleAll} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left border-b border-stone-100 dark:border-stone-800 mb-1">
              <span className="flex-1 text-sm font-medium text-stone-500 dark:text-stone-400">Alles selecteren</span>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${allSelected ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100" : "border-stone-200 dark:border-stone-600"}`}>
                {allSelected && <span className="text-white dark:text-stone-900 text-[10px] leading-none">✓</span>}
              </span>
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
              >
                <span className="text-xl shrink-0">{cat.icon}</span>
                <span className="flex-1 text-sm font-medium text-stone-800 dark:text-stone-200">{cat.name}</span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(cat.id)
                    ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100"
                    : "border-stone-200 dark:border-stone-600"
                }`}>
                  {selected.has(cat.id) && <span className="text-white dark:text-stone-900 text-[10px] leading-none">✓</span>}
                </span>
              </button>
            ))}
          </div>
          <div className="px-5 pb-8 pt-3 border-t border-stone-100 dark:border-stone-700">
            <button
              onClick={handleStart}
              disabled={selected.size === 0}
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-3 text-sm font-medium disabled:opacity-30 active:scale-95 transition-all"
            >
              Starten ({selected.size} {selected.size === 1 ? "categorie" : "categorieën"})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (mode === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
        <p className="text-sm text-stone-400 dark:text-stone-500">Woordenlijst ophalen…</p>
      </div>
    );
  }

  // ── Practice screen ────────────────────────────────────────────────────────
  if (!words.length) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-4xl">📭</p>
        <p className="text-base font-semibold text-stone-700 dark:text-stone-300">Geen woorden gevonden</p>
        <p className="text-sm text-stone-400 dark:text-stone-500 leading-relaxed">Open een categorie en genereer eerst de woordenlijst.</p>
        <button onClick={onClose} className="mt-2 text-sm text-stone-500 dark:text-stone-400 underline">Sluiten</button>
      </div>
    );
  }

  const word = words[cardIndex];
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <p className="text-sm font-medium text-stone-400 dark:text-stone-500 tabular-nums">
          {cardIndex + 1} <span className="text-stone-300 dark:text-stone-600">/</span> {words.length}
        </p>
        <button
          onClick={() => { setWords((w) => [...w].sort(() => Math.random() - 0.5)); setCardIndex(0); setFlipped(false); }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm"
          aria-label="Schudden"
        >⇄</button>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm" style={{ perspective: "1200px" }}>
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
            {/* Voorkant — Nederlands */}
            <div style={{ backfaceVisibility: "hidden" }} className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-6">Nederlands</p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">{word.dutch}</p>
              <p className="text-xs text-stone-300 dark:text-stone-600 mt-8">Tik om te draaien</p>
            </div>
            {/* Achterkant — Japans */}
            <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} className="absolute inset-0 bg-stone-900 dark:bg-stone-800 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-6">{language === "zh" ? "Chinees" : "Japans"}</p>
              <p className="text-4xl font-bold text-white leading-tight mb-2">{word.japanese}</p>
              <p className="text-base text-stone-400 italic mb-4">{word.romaji}</p>
              <AudioButton text={word.japanese} className="bg-stone-800 hover:bg-stone-700 text-stone-300" />
            </div>
          </div>
          {flipped && cardIndex < words.length - 1 && (
            <div className="flex justify-end mt-3 pr-1">
              <button onClick={() => go(1)} className="w-9 h-9 rounded-full bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-sm flex items-center justify-center active:scale-95 transition-all" aria-label="Volgende">→</button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 px-5 pb-14">
        <button onClick={() => go(-1)} disabled={cardIndex === 0} className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all" aria-label="Vorige">←</button>
        <div className="flex gap-1.5">
          {words.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === cardIndex ? "w-4 h-2 bg-stone-700 dark:bg-stone-300" : "w-2 h-2 bg-stone-200 dark:bg-stone-700"}`} />
          ))}
        </div>
        <button onClick={() => go(1)} disabled={cardIndex === words.length - 1} className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all" aria-label="Volgende">→</button>
      </div>
    </div>
  );
}

// ─── Grammar group modal ──────────────────────────────────────────────────────

interface GrammarGroupModalProps {
  allCategories: Array<{ id: string; name: string; icon: string }>;
  getFullPhrasesForCategory: (id: string) => Phrase[];
  initialSelected: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
  autoStart?: boolean;
}

function GrammarGroupModal({ allCategories, getFullPhrasesForCategory, initialSelected, onSelectionChange, onClose, autoStart }: GrammarGroupModalProps) {
  const { language }                     = useLanguage();
  const [mode,         setMode]         = useState<"select" | "loading" | "result">(autoStart ? "loading" : "select");
  const [selected,     setSelected]     = useState<Set<string>>(() => new Set(initialSelected));
  const [groups,       setGroups]       = useState<{ groep: string; zinIds: string[] }[]>([]);
  const [allPhrases,   setAllPhrases]   = useState<Phrase[]>([]);
  const [activeGroep,  setActiveGroep]  = useState<string | null>(null);

  const allIds = allCategories.map((c) => c.id);
  const allSelected = allIds.every((id) => selected.has(id));

  const toggleCat = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id);
      onSelectionChange([...s]); return s;
    });

  const toggleAll = () => {
    const next = allSelected ? new Set<string>() : new Set(allIds);
    setSelected(next); onSelectionChange([...next]);
  };

  const handleGroepeer = async () => {
    if (selected.size === 0) { if (autoStart) onClose(); return; }
    const collected: Phrase[] = [];
    for (const catId of selected) collected.push(...getFullPhrasesForCategory(catId));
    if (collected.length < 2) { if (autoStart) onClose(); return; }

    setMode("loading");
    try {
      const res  = await fetch("/api/group-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          phrases: collected.map((p) => ({
            id:             p.id,
            translatedText: language === "zh" ? (p.chineseText ?? p.translatedText) : p.translatedText,
            sourceText:     p.sourceText,
          })),
        }),
      });
      const data = await res.json();
      const fetched: { groep: string; zinIds: string[] }[] = data.groups ?? [];
      setGroups(fetched);
      setAllPhrases(collected);
      setActiveGroep(fetched[0]?.groep ?? null);
      setMode("result");
    } catch {
      if (autoStart) onClose(); else setMode("select");
    }
  };

  // Scope is chosen on the Verdiepen tab; auto-run when opened from there.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    void handleGroepeer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const handleBackdrop = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  // ── Select screen ──────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={handleBackdrop}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md mx-auto bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl">
          <div className="relative flex items-center justify-center pt-4 pb-1 px-5">
            <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
            <button onClick={onClose} className="absolute right-5 top-4 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Annuleren
            </button>
          </div>
          <div className="px-5 pt-3 pb-2">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">🔤 Grammatica groeperen</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Kies categorieën — AI groepeert alle zinnen op grammaticale structuur</p>
          </div>
          <div className="px-3 overflow-y-auto max-h-[45vh]">
            <button onClick={toggleAll} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left border-b border-stone-100 dark:border-stone-800 mb-1">
              <span className="flex-1 text-sm font-medium text-stone-500 dark:text-stone-400">Alles selecteren</span>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${allSelected ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100" : "border-stone-200 dark:border-stone-600"}`}>
                {allSelected && <span className="text-white dark:text-stone-900 text-[10px] leading-none">✓</span>}
              </span>
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
              >
                <span className="text-xl shrink-0">{cat.icon}</span>
                <span className="flex-1 text-sm font-medium text-stone-800 dark:text-stone-200">{cat.name}</span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(cat.id)
                    ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100"
                    : "border-stone-200 dark:border-stone-600"
                }`}>
                  {selected.has(cat.id) && <span className="text-white dark:text-stone-900 text-[10px] leading-none">✓</span>}
                </span>
              </button>
            ))}
          </div>
          <div className="px-5 pb-8 pt-3 border-t border-stone-100 dark:border-stone-700">
            <button
              onClick={handleGroepeer}
              disabled={selected.size === 0}
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-3 text-sm font-medium disabled:opacity-30 active:scale-95 transition-all"
            >
              Groepeer ({selected.size} {selected.size === 1 ? "categorie" : "categorieën"})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (mode === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
        <p className="text-sm text-stone-400 dark:text-stone-500">Grammaticagroepen bepalen…</p>
      </div>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  const actieveZinnen = activeGroep
    ? allPhrases.filter((p) => groups.find((g) => g.groep === activeGroep)?.zinIds.includes(p.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg"
          aria-label="Sluiten"
        >✕</button>
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Grammaticagroepen</p>
        <div className="w-9" />
      </div>

      {/* Tabs */}
      <div className="px-5 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {groups.map((g) => (
            <button
              key={g.groep}
              onClick={() => setActiveGroep(g.groep)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                activeGroep === g.groep
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                  : "bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-sm"
              }`}
            >
              {g.groep}
              <span className="ml-1.5 opacity-50">{g.zinIds.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Phrases */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 flex flex-col gap-1.5 pb-8">
        {actieveZinnen.map((phrase) => (
          <div key={phrase.id} className="shrink-0">
            <PhraseCard phrase={phrase} showCategory />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sentence practice modal ──────────────────────────────────────────────────

interface SentencePracticeModalProps {
  allCategories: Array<{ id: string; name: string; icon: string }>;
  getPhrasesForCategory: (id: string) => Array<{ translatedText: string; romaji: string; sourceText: string }>;
  initialSelected: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
  autoStart?: boolean;
  initialDifficulty?: Difficulty;
  initialView?: "new" | "saved";
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; dot: string }[] = [
  { id: "basis",     label: "Basis",     desc: "Combinaties van bestaande zinnen en woorden",          dot: "bg-green-400"  },
  { id: "gemiddeld", label: "Gemiddeld", desc: "Kleine variaties, enkele verwante woorden",            dot: "bg-yellow-400" },
  { id: "gevorderd", label: "Gevorderd", desc: "Gerelateerde woordenschat, meerdere tijdsvormen",      dot: "bg-orange-400" },
  { id: "expert",    label: "Expert",    desc: "Vrije variaties, nieuwe woorden, complexe structuren", dot: "bg-red-400"    },
];

function SentencePracticeModal({ allCategories, getPhrasesForCategory, initialSelected, onSelectionChange, onClose, autoStart, initialDifficulty, initialView }: SentencePracticeModalProps) {
  const { getVocab }                           = useVocabulary();
  const { saveAsNew, addToExisting, deleteSet, sets } = usePracticeSets();
  const { language }                           = useLanguage();

  const [mode,        setMode]        = useState<"select" | "loading" | "practice">(autoStart ? "loading" : "select");
  const [selectTab,   setSelectTab]   = useState<"new" | "saved">(initialView ?? "new");
  const [selected,    setSelected]    = useState<Set<string>>(() => new Set(initialSelected));
  const [difficulty,  setDifficulty]  = useState<Difficulty>(initialDifficulty ?? "basis");
  const [sentences,   setSentences]   = useState<PracticeSentence[]>([]);
  const [cardIndex,   setCardIndex]   = useState(0);
  const [flipped,     setFlipped]     = useState(false);
  const [isFromSaved, setIsFromSaved] = useState(false);
  const [showSave,    setShowSave]    = useState(false);
  const [savedMsg,    setSavedMsg]    = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  const allIds = allCategories.map((c) => c.id);
  const allSelected = allIds.every((id) => selected.has(id));

  const toggleCat = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id);
      onSelectionChange([...s]); return s;
    });

  const toggleAll = () => {
    const next = allSelected ? new Set<string>() : new Set(allIds);
    setSelected(next); onSelectionChange([...next]);
  };

  const handleStart = async () => {
    if (selected.size === 0) { if (autoStart) onClose(); return; }
    setMode("loading");

    const allPhrases: Array<{ sourceText: string; translatedText: string; romaji: string }> = [];
    const allWords:   Array<{ japanese: string; romaji: string; dutch: string }>             = [];

    for (const catId of selected) {
      allPhrases.push(...getPhrasesForCategory(catId));
      const cached = await getVocab(catId, language).catch(() => null);
      if (cached) allWords.push(...cached);
    }

    try {
      const res  = await fetch("/api/generate-sentences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases: allPhrases, words: allWords, difficulty, language }),
      });
      const data = await res.json();
      const generated: PracticeSentence[] = data.sentences ?? [];
      setSentences(generated.sort(() => Math.random() - 0.5));
    } catch {
      setSentences([]);
    }

    setIsFromSaved(false);
    setCardIndex(0);
    setFlipped(false);
    setSavedMsg(null);
    setMode("practice");
  };

  // Scope + difficulty are chosen on the Verdiepen tab; auto-generate when
  // opened from there (the "saved sets" entry passes autoStart=false).
  const startedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    void handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const handlePracticeFromSet = (set: { sentences: PracticeSentence[]; difficulty: Difficulty }) => {
    setSentences([...set.sentences].sort(() => Math.random() - 0.5));
    setDifficulty(set.difficulty);
    setIsFromSaved(true);
    setCardIndex(0);
    setFlipped(false);
    setSavedMsg(null);
    setMode("practice");
  };

  const handleSaveAsNew = async () => {
    setSaving(true);
    const selectedCats = allCategories.filter((c) => selected.has(c.id));
    const name = generateSetName(selectedCats.map((c) => c.icon), difficulty);
    try {
      await saveAsNew(sentences, difficulty, selectedCats.map((c) => c.id), selectedCats.map((c) => c.icon));
      setSavedMsg(`✓ Opgeslagen als "${name}"`);
    } finally {
      setSaving(false);
      setShowSave(false);
    }
  };

  const handleAddToSet = async (setId: string, setName: string) => {
    setSaving(true);
    try {
      await addToExisting(setId, sentences);
      setSavedMsg(`✓ Toegevoegd aan "${setName}"`);
    } finally {
      setSaving(false);
      setShowSave(false);
    }
  };

  const go = (delta: number) => {
    setFlipped(false);
    setTimeout(() => setCardIndex((i) => Math.min(Math.max(i + delta, 0), sentences.length - 1)), 50);
  };

  const handleBackdrop = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  // ── Select screen ──────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={handleBackdrop}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md mx-auto bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl">
          <div className="relative flex items-center justify-center pt-4 pb-1 px-5">
            <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
            <button onClick={onClose} className="absolute right-5 top-4 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Annuleren
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mx-5 mt-3 mb-3 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
            {(["new", "saved"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectTab === tab
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-400 dark:text-stone-500"
                }`}
              >
                {tab === "new" ? "✍️ Nieuw genereren" : `💾 Opgeslagen (${sets.length})`}
              </button>
            ))}
          </div>

          {selectTab === "new" ? (
            <>
              <div className="px-3 overflow-y-auto max-h-[30vh]">
                <button onClick={toggleAll} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left border-b border-stone-100 dark:border-stone-800 mb-1">
                  <span className="flex-1 text-sm font-medium text-stone-500 dark:text-stone-400">Alles selecteren</span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${allSelected ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100" : "border-stone-200 dark:border-stone-600"}`}>
                    {allSelected && <span className="text-white dark:text-stone-900 text-[10px] leading-none">✓</span>}
                  </span>
                </button>
                {allCategories.map((cat) => (
                  <button key={cat.id} onClick={() => toggleCat(cat.id)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left">
                    <span className="text-xl shrink-0">{cat.icon}</span>
                    <span className="flex-1 text-sm font-medium text-stone-800 dark:text-stone-200">{cat.name}</span>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected.has(cat.id) ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100" : "border-stone-200 dark:border-stone-600"}`}>
                      {selected.has(cat.id) && <span className="text-white dark:text-stone-900 text-[10px] leading-none">✓</span>}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-5 pt-3 pb-2 border-t border-stone-100 dark:border-stone-700">
                <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Moeilijkheidsgraad</p>
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {DIFFICULTIES.map((d) => (
                    <button key={d.id} onClick={() => setDifficulty(d.id)} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${difficulty === d.id ? "bg-stone-900 dark:bg-stone-100" : "bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700"}`}>
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${d.dot}`} />
                      <div>
                        <p className={`text-xs font-semibold ${difficulty === d.id ? "text-white dark:text-stone-900" : "text-stone-700 dark:text-stone-200"}`}>{d.label}</p>
                        <p className={`text-[10px] leading-tight mt-0.5 ${difficulty === d.id ? "text-stone-300 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>{d.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={handleStart} disabled={selected.size === 0} className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-3 text-sm font-medium disabled:opacity-30 active:scale-95 transition-all">
                  Genereren en starten ({selected.size} {selected.size === 1 ? "categorie" : "categorieën"})
                </button>
              </div>
            </>
          ) : (
            <div className="px-3 overflow-y-auto max-h-[50vh] pb-8">
              {sets.length === 0 ? (
                <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-8">
                  Nog geen opgeslagen sets.<br />
                  <span className="text-xs">Genereer eerst zinnen en sla ze op.</span>
                </p>
              ) : (
                sets.map((set) => {
                  const diff = DIFFICULTIES.find((d) => d.id === set.difficulty);
                  return (
                    <div key={set.id} className="flex items-center gap-2 py-2">
                      <button onClick={() => handlePracticeFromSet(set)} className="flex-1 flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${diff?.dot ?? "bg-stone-400"}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{set.name}</p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">{set.sentences.length} zinnen · {diff?.label}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => void deleteSet(set.id)}
                        className="w-8 h-8 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-red-400 transition-colors shrink-0"
                        aria-label="Verwijderen"
                      >
                        🗑
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (mode === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
        <p className="text-sm text-stone-400 dark:text-stone-500">Oefenzinnen genereren…</p>
        <p className="text-xs text-stone-300 dark:text-stone-600">{DIFFICULTIES.find((d) => d.id === difficulty)?.label}</p>
      </div>
    );
  }

  // ── Empty result ───────────────────────────────────────────────────────────
  if (!sentences.length) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-4xl">😕</p>
        <p className="text-base font-semibold text-stone-700 dark:text-stone-300">Geen zinnen gegenereerd</p>
        <p className="text-sm text-stone-400 dark:text-stone-500 leading-relaxed">Voeg meer zinnen toe aan je categorieën en probeer opnieuw.</p>
        <button onClick={onClose} className="mt-2 text-sm text-stone-500 dark:text-stone-400 underline">Sluiten</button>
      </div>
    );
  }

  // ── Practice screen ────────────────────────────────────────────────────────
  const sentence = sentences[cardIndex];
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-2">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-stone-400 dark:text-stone-500 tabular-nums">
            {cardIndex + 1} <span className="text-stone-300 dark:text-stone-600">/</span> {sentences.length}
          </p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${DIFFICULTIES.find((d) => d.id === difficulty)?.dot ?? "bg-stone-400"}`}>
            {DIFFICULTIES.find((d) => d.id === difficulty)?.label}
          </span>
        </div>
        <button onClick={() => { setSentences((s) => [...s].sort(() => Math.random() - 0.5)); setCardIndex(0); setFlipped(false); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm" aria-label="Schudden">⇄</button>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm" style={{ perspective: "1200px" }}>
          <div onClick={() => setFlipped((v) => !v)} style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)", position: "relative", height: "280px", cursor: "pointer" }}>
            <div style={{ backfaceVisibility: "hidden" }} className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-5">{language === "zh" ? "Hoe zeg je dit in het Chinees?" : "Hoe zeg je dit in het Japans?"}</p>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">{sentence.dutch}</p>
              <p className="text-xs text-stone-300 dark:text-stone-600 mt-8">Tik om het antwoord te zien</p>
            </div>
            <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} className="absolute inset-0 bg-stone-900 dark:bg-stone-800 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-5">{language === "zh" ? "Chinees" : "Japans"}</p>
              <p className="text-3xl font-bold text-white leading-tight mb-2">{sentence.japanese}</p>
              <p className="text-base text-stone-400 italic mb-4">{sentence.romaji}</p>
              <AudioButton text={sentence.japanese} className="bg-stone-800 hover:bg-stone-700 text-stone-300" />
            </div>
          </div>
          {flipped && cardIndex < sentences.length - 1 && (
            <div className="flex justify-end mt-3 pr-1">
              <button onClick={() => go(1)} className="w-9 h-9 rounded-full bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-sm flex items-center justify-center active:scale-95 transition-all" aria-label="Volgende">→</button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation + save strip */}
      <div className="flex items-center justify-center gap-6 px-5 pt-2">
        <button onClick={() => go(-1)} disabled={cardIndex === 0} className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all" aria-label="Vorige">←</button>
        <div className="flex gap-1.5 flex-wrap justify-center max-w-[140px]">
          {sentences.map((_, i) => (<div key={i} className={`rounded-full transition-all ${i === cardIndex ? "w-4 h-2 bg-stone-700 dark:bg-stone-300" : "w-2 h-2 bg-stone-200 dark:bg-stone-700"}`} />))}
        </div>
        <button onClick={() => go(1)} disabled={cardIndex === sentences.length - 1} className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all" aria-label="Volgende">→</button>
      </div>

      {!isFromSaved && (
        <div className="px-5 pb-10 pt-3 flex justify-center">
          {savedMsg ? (
            <p className="text-xs text-green-500 font-medium">{savedMsg}</p>
          ) : (
            <button onClick={() => setShowSave(true)} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors flex items-center gap-1.5">
              <span>💾</span><span>Set opslaan</span>
            </button>
          )}
        </div>
      )}
      {isFromSaved && <div className="pb-10" />}

      {/* Save overlay */}
      {showSave && (
        <div className="absolute inset-0 flex items-end z-10">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowSave(false)} />
          <div className="relative w-full bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl px-5 pt-4 pb-8">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">Set opslaan</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
              Auto-naam: <span className="font-medium text-stone-600 dark:text-stone-300">
                {generateSetName(allCategories.filter((c) => selected.has(c.id)).map((c) => c.icon), difficulty)}
              </span>
            </p>
            <button onClick={handleSaveAsNew} disabled={saving} className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-3 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all mb-3">
              {saving ? "Opslaan…" : "Opslaan als nieuwe set"}
            </button>
            {sets.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Toevoegen aan bestaand setje</p>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                  {sets.map((s) => (
                    <button key={s.id} onClick={() => handleAddToSet(s.id, s.name)} disabled={saving} className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left disabled:opacity-40">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${DIFFICULTIES.find((d) => d.id === s.difficulty)?.dot ?? "bg-stone-400"}`} />
                      <span className="text-sm text-stone-700 dark:text-stone-300 truncate">{s.name}</span>
                      <span className="ml-auto text-xs text-stone-300 dark:text-stone-600">{s.sentences.length} zinnen</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => setShowSave(false)} className="w-full mt-3 text-xs text-stone-400 dark:text-stone-500 py-2">Annuleren</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { userCategories, userPhrases, staticFavoriteIds, categoryOrder, saveCategoryOrder, addCategory, getUserPhrasesByCategory } = useUserPhrases();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [showNewCategory,      setShowNewCategory]      = useState(false);
  const [showVocabPractice,    setShowVocabPractice]    = useState(false);
  const [sentenceModal,        setSentenceModal]        = useState<{ view: "new" | "saved"; autoStart: boolean } | null>(null);
  const [showGrammarGroup,     setShowGrammarGroup]     = useState(false);
  const [showGrammarScreen,    setShowGrammarScreen]    = useState(false);
  const [activeTab,            setActiveTab]            = useState<"zinnen" | "verdiepen">("zinnen");
  const [reordering,           setReordering]           = useState(false);
  const [practiceSelection,    setPracticeSelection]    = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("phrasekit-cat-selection") ?? "[]"); } catch { return []; }
  });
  const [difficulty,           setDifficulty]           = useState<Difficulty>(() => {
    try { return (localStorage.getItem("phrasekit-difficulty") as Difficulty) || "basis"; } catch { return "basis"; }
  });

  const handleSelectionChange = (ids: string[]) => {
    setPracticeSelection(ids);
    localStorage.setItem("phrasekit-cat-selection", JSON.stringify(ids));
  };

  const chooseDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    localStorage.setItem("phrasekit-difficulty", d);
  };

  const userFavorieten   = userPhrases.filter((p) => p.isFavorite);
  const staticFavorieten = staticPhrases.filter((p) => staticFavoriteIds.includes(p.id));
  const allPhrases       = [...staticPhrases, ...userPhrases];
  const opgeslagenZinnen = [...userFavorieten, ...staticFavorieten].slice(0, 3);

  const allCategories = [
    ...categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    ...userCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
  ];

  // Situaties-grid gesorteerd op de bewaarde volgorde; nieuwe/onbekende
  // categorieën vallen terug op de standaardvolgorde (stabiele sort).
  const orderIndex = new Map(categoryOrder.map((id, i) => [id, i] as const));
  const gridCategories: GridCategory[] = [...allCategories].sort(
    (a, b) => (orderIndex.get(a.id) ?? Infinity) - (orderIndex.get(b.id) ?? Infinity)
  );

  const hasScope = practiceSelection.length > 0;

  const toggleScope = (id: string) => {
    const s = new Set(practiceSelection);
    s.has(id) ? s.delete(id) : s.add(id);
    handleSelectionChange([...s]);
  };
  const selectAllScope = () => handleSelectionChange(allCategories.map((c) => c.id));
  const clearScope     = () => handleSelectionChange([]);

  const getPhrasesForCategory = (catId: string) => {
    if (language === "zh") {
      // Chinese mode: only user phrases that have a Chinese translation
      return getUserPhrasesByCategory(catId)
        .filter((p) => !!p.chineseText)
        .map((p) => ({
          translatedText: p.chineseText!,
          romaji:         p.pinyin ?? "",
          sourceText:     p.sourceText,
        }));
    }
    const staticPhrases = getPhrasesByCategory(catId).map((p) => ({
      translatedText: p.translatedText,
      romaji:         p.romaji,
      sourceText:     p.sourceText,
    }));
    const userPhr = getUserPhrasesByCategory(catId).map((p) => ({
      translatedText: p.translatedText,
      romaji:         p.romaji,
      sourceText:     p.sourceText,
    }));
    return [...staticPhrases, ...userPhr];
  };

  const getFullPhrasesForCategory = (catId: string): Phrase[] => {
    const staticPhrases = getPhrasesByCategory(catId);
    const userPhr = getUserPhrasesByCategory(catId);
    return [...staticPhrases, ...userPhr];
  };

  return (
    <div className="page-content">

      {/* ── Woordmerk + account ───────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            PhraseKit <span className="text-stone-400 dark:text-stone-500 font-normal">{language === "zh" ? "China" : "Japan"}</span>
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 tracking-wide">
            {language === "zh" ? "Chinese reiszinnen" : "Japanse reiszinnen"}
          </p>
        </div>

        {/* Theme toggle + taal + auth */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === "ja" ? "zh" : "ja")}
            aria-label="Wissel taal"
            className="h-8 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm active:scale-95 transition-all px-2.5 gap-1"
          >
            <span className="text-sm">{language === "ja" ? "🇯🇵" : "🇨🇳"}</span>
            <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">{language === "ja" ? "JP" : "CN"}</span>
          </button>
          <button
            onClick={toggle}
            aria-label="Wissel thema"
            className="w-8 h-8 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 shadow-sm active:scale-95 transition-all text-sm"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-xl px-3 py-2 shadow-sm active:opacity-70 transition-opacity"
            >
              {user.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? ""}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="text-xs text-stone-500 dark:text-stone-400">Uitloggen</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-xl px-3 py-2 shadow-sm active:opacity-70 transition-opacity"
            >
              <span className="text-base">G</span>
              <span className="text-xs text-stone-700 dark:text-stone-200 font-medium">Inloggen</span>
            </button>
          )
        )}
        </div>
      </div>

      {/* ── Inline vertaler ───────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <InlineTranslator />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
          {(["zinnen", "verdiepen"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            >
              {tab === "zinnen" ? "Situaties" : "Verdiepen"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Zinnen ───────────────────────────────────────────── */}
      {activeTab === "zinnen" && (
        <>
          <section className="px-5 mb-8">
            {user && allCategories.length > 1 && (
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => setReordering((v) => !v)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    reordering
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                      : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
                  }`}
                >
                  {reordering ? "Klaar" : "↕ Herorden"}
                </button>
              </div>
            )}

            <CategoryGrid
              categories={gridCategories}
              reordering={reordering}
              onReorder={saveCategoryOrder}
            />

            {user && !reordering && (
              <button
                onClick={() => setShowNewCategory(true)}
                className="mt-1.5 flex items-center gap-3 bg-white/60 dark:bg-stone-900/60 border border-dashed border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3 active:opacity-70 transition-opacity text-left w-full"
              >
                <span className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 text-base shrink-0">+</span>
                <span className="text-sm font-medium text-stone-400 dark:text-stone-500">Nieuwe categorie aanmaken</span>
              </button>
            )}
          </section>

          {opgeslagenZinnen.length > 0 && (
            <section className="px-5 mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                  Favorieten
                </p>
                <Link href="/favorites" className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                  Bekijk alles
                </Link>
              </div>
              <div className="flex flex-col gap-1.5">
                {opgeslagenZinnen.map((phrase) => (
                  <PhraseCard key={phrase.id} phrase={phrase} showCategory />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showNewCategory && (
        <CategoryPicker
          userCategories={userCategories}
          onSelect={() => setShowNewCategory(false)}
          onAddCategory={addCategory}
          onClose={() => setShowNewCategory(false)}
          initialMode="new"
          title="Nieuwe categorie"
          subtitle="Geef je categorie een naam en icoon"
        />
      )}

      {/* ── Tab: Verdiepen ────────────────────────────────────────── */}
      {activeTab === "verdiepen" && (
        <section className="px-5 mb-8">
          {user ? (
            <div className="flex flex-col gap-5">
              {/* ── Scope: kies eerst je categorieën ─────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                    1 · Categorieën
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={selectAllScope} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">Alles</button>
                    <button onClick={clearScope} disabled={!hasScope} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors disabled:opacity-30">Wissen</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => {
                    const on = practiceSelection.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleScope(cat.id)}
                        className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                          on
                            ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                            : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 shadow-sm"
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-2.5">
                  {hasScope
                    ? `${practiceSelection.length} ${practiceSelection.length === 1 ? "categorie" : "categorieën"} geselecteerd`
                    : "Kies minstens één categorie om te oefenen"}
                </p>
              </div>

              {/* ── Activiteiten ─────────────────────────────────────── */}
              <div>
                <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2.5">
                  2 · Activiteit
                </p>
                <div className="flex flex-col gap-1.5">
                  {/* Woorden oefenen */}
                  <button
                    onClick={() => setShowVocabPractice(true)}
                    disabled={!hasScope}
                    className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-all disabled:opacity-40 disabled:active:opacity-40"
                  >
                    <span className="text-2xl shrink-0">🎯</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Woorden oefenen</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Flashcards van de woordenlijsten</p>
                    </div>
                    <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>

                  {/* Zinnen oefenen — met moeilijkheidsgraad + opgeslagen sets */}
                  <div className="bg-white dark:bg-stone-900 rounded-2xl px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0">✍️</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Zinnen oefenen</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">AI genereert nieuwe oefenzinnen</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => chooseDifficulty(d.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                            difficulty === d.id
                              ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                              : "bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setSentenceModal({ view: "new", autoStart: true })}
                        disabled={!hasScope}
                        className="flex-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-2.5 text-xs font-medium disabled:opacity-30 active:scale-95 transition-all"
                      >
                        Genereren ›
                      </button>
                      <button
                        onClick={() => setSentenceModal({ view: "saved", autoStart: false })}
                        className="px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs font-medium text-stone-500 dark:text-stone-400 active:scale-95 transition-all"
                      >
                        💾 Opgeslagen
                      </button>
                    </div>
                  </div>

                  {/* Grammatica groeperen */}
                  <button
                    onClick={() => setShowGrammarGroup(true)}
                    disabled={!hasScope}
                    className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-all disabled:opacity-40 disabled:active:opacity-40"
                  >
                    <span className="text-2xl shrink-0">🔤</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Grammatica groeperen</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Zinnen gegroepeerd op structuur</p>
                    </div>
                    <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>

                  {/* Grammatica uitleg — werkt op al je zinnen, los van de selectie */}
                  <button onClick={() => setShowGrammarScreen(true)} className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-opacity">
                    <span className="text-2xl shrink-0">📖</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Grammatica uitleg</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">AI-lessen op basis van al je zinnen</p>
                    </div>
                    <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🔒</p>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Log in om te verdiepen</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">Oefenen en grammatica zijn beschikbaar na inloggen</p>
              <button onClick={signInWithGoogle} className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-xl px-4 py-2.5 shadow-sm active:opacity-70 transition-opacity mx-auto">
                <span className="text-base">G</span>
                <span className="text-xs text-stone-700 dark:text-stone-200 font-medium">Inloggen met Google</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="px-5 py-8 mt-4 flex items-center justify-center">
        <p className="text-[10px] text-stone-300 dark:text-stone-700 tracking-widest uppercase">
          Gemaakt door <span className="font-semibold text-stone-400 dark:text-stone-500">VizCraft</span>
        </p>
      </div>

      {showVocabPractice && (
        <VocabPracticeModal
          allCategories={allCategories}
          getPhrasesForCategory={getPhrasesForCategory}
          initialSelected={practiceSelection}
          onSelectionChange={handleSelectionChange}
          onClose={() => setShowVocabPractice(false)}
          autoStart
        />
      )}

      {sentenceModal && (
        <SentencePracticeModal
          allCategories={allCategories}
          getPhrasesForCategory={getPhrasesForCategory}
          initialSelected={practiceSelection}
          onSelectionChange={handleSelectionChange}
          onClose={() => setSentenceModal(null)}
          autoStart={sentenceModal.autoStart}
          initialDifficulty={difficulty}
          initialView={sentenceModal.view}
        />
      )}

      {showGrammarGroup && (
        <GrammarGroupModal
          allCategories={allCategories}
          getFullPhrasesForCategory={getFullPhrasesForCategory}
          initialSelected={practiceSelection}
          onSelectionChange={handleSelectionChange}
          onClose={() => setShowGrammarGroup(false)}
          autoStart
        />
      )}

      {showGrammarScreen && (
        <GrammarScreen
          key={language}
          allPhrases={allPhrases}
          onClose={() => setShowGrammarScreen(false)}
        />
      )}
    </div>
  );
}
