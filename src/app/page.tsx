"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CategoryGrid, { GridCategory } from "@/components/cards/CategoryGrid";
import PhraseCard from "@/components/cards/PhraseCard";
import InlineTranslator from "@/components/ui/InlineTranslator";
import CategoryPicker from "@/components/ui/CategoryPicker";
import { categories, phrases as staticPhrases, getPhrasesByCategory } from "@/data/mockData";
import GrammarHub from "@/components/grammar/GrammarHub";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";
import { useVocabulary, VocabWord, wordForLang } from "@/hooks/useVocabulary";
import { usePracticeSets, PracticeSentence, Difficulty, generateSetName } from "@/hooks/usePracticeSets";
import AudioButton from "@/components/ui/AudioButton";
import { useAudio } from "@/hooks/useAudio";
import SpeedButton from "@/components/ui/SpeedButton";
import TodayCard from "@/components/practice/TodayCard";
import ReviewSession from "@/components/practice/ReviewSession";
import ProgressCard from "@/components/practice/ProgressCard";
import ProgressScreen from "@/components/practice/ProgressScreen";
import PronunciationSession from "@/components/practice/PronunciationSession";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { getPhraseTranslation } from "@/utils/phrase";
import { getLanguage } from "@/data/languages";

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
  const { getConceptsForLang }                 = useVocabulary();
  const { saveAsNew, addToExisting, deleteSet, sets } = usePracticeSets();
  const { language }                           = useLanguage();
  const { play }                               = useAudio();

  const [mode,        setMode]        = useState<"select" | "loading" | "practice">(autoStart ? "loading" : "select");
  const [selectTab,   setSelectTab]   = useState<"new" | "saved">(initialView ?? "new");
  const [selected,    setSelected]    = useState<Set<string>>(() => new Set(initialSelected));
  const [difficulty,  setDifficulty]  = useState<Difficulty>(initialDifficulty ?? "basis");
  const [sentences,   setSentences]   = useState<PracticeSentence[]>([]);
  const [cardIndex,   setCardIndex]   = useState(0);
  const [flipped,     setFlipped]     = useState(false);
  const [dir,         setDir]         = useState(1);
  const [audioFirst,  setAudioFirst]  = useState(false);
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
      const concepts = await getConceptsForLang(catId, language).catch(() => []);
      allWords.push(...(concepts.map((c) => wordForLang(c, language)).filter(Boolean) as VocabWord[]));
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
    setDir(delta >= 0 ? 1 : -1);
    setFlipped(false);
    setTimeout(() => setCardIndex((i) => Math.min(Math.max(i + delta, 0), sentences.length - 1)), 50);
  };

  // Luister-eerst: speel de doeltaal automatisch af bij een nieuwe kaart.
  useEffect(() => {
    if (audioFirst && mode === "practice") { const s = sentences[cardIndex]; if (s?.japanese) play(s.japanese); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIndex, audioFirst, mode]);

  // Swipe links = volgende, rechts = vorige. Een swipe onderdrukt de tik-flip.
  const touchStartX = useRef<number | null>(null);
  const didSwipe    = useRef(false);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; didSwipe.current = false; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) { didSwipe.current = true; if (dx < 0) go(1); else go(-1); }
  };
  const onCardClick = () => { if (didSwipe.current) { didSwipe.current = false; return; } setFlipped((v) => !v); };

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
        <div className="flex items-center gap-2">
          <SpeedButton />
          <button onClick={() => setAudioFirst((v) => !v)} className={`w-9 h-9 flex items-center justify-center rounded-full shadow-sm transition-colors text-sm ${audioFirst ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900" : "bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"}`} aria-label="Luister eerst" title="Luister-eerst: hoor de zin, draai om voor het Nederlands">🔊</button>
          <button onClick={() => { setSentences((s) => [...s].sort(() => Math.random() - 0.5)); setCardIndex(0); setFlipped(false); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm" aria-label="Schudden">⇄</button>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div key={cardIndex} className="w-full max-w-sm card-slide-in" style={{ perspective: "1200px", "--slide-from": `${dir * 44}px` } as React.CSSProperties}>
          <div onClick={onCardClick} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)", position: "relative", height: "280px", cursor: "pointer" }}>
            {(() => {
              const targetNode = (
                <>
                  <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-5">{getLanguage(language)?.label ?? ""}</p>
                  <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight mb-2">{sentence.japanese}</p>
                  <p className="text-base text-stone-400 dark:text-stone-500 italic mb-4">{sentence.romaji}</p>
                  <AudioButton text={sentence.japanese} />
                </>
              );
              const dutchNode = (
                <>
                  <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-5">{audioFirst ? "Nederlands" : `Hoe zeg je dit in het ${getLanguage(language)?.label ?? ""}?`}</p>
                  <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">{sentence.dutch}</p>
                  <p className="text-xs text-stone-300 dark:text-stone-600 mt-8">{audioFirst ? "" : "Tik om het antwoord te zien"}</p>
                </>
              );
              return (<>
                <div style={{ backfaceVisibility: "hidden" }} className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
                  {audioFirst ? targetNode : dutchNode}
                </div>
                <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
                  {audioFirst ? dutchNode : targetNode}
                </div>
              </>);
            })()}
          </div>
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
  const { language } = useLanguage();
  const [showNewCategory,      setShowNewCategory]      = useState(false);
  const [sentenceModal,        setSentenceModal]        = useState<{ view: "new" | "saved"; autoStart: boolean } | null>(null);
  const [showGrammar,          setShowGrammar]          = useState(false);
  const [showReview,           setShowReview]           = useState(false);
  const [showProgress,         setShowProgress]         = useState(false);
  const [showPronunciation,    setShowPronunciation]    = useState(false);
  const [wordDrillCats,        setWordDrillCats]        = useState<string[] | null>(null);
  const [activeTab,            setActiveTab]            = useState<"zinnen" | "verdiepen">("zinnen");
  const [reordering,           setReordering]           = useState(false);
  const [practiceSelection,    setPracticeSelection]    = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("phrasekit-cat-selection") ?? "[]"); } catch { return []; }
  });

  const handleSelectionChange = (ids: string[]) => {
    setPracticeSelection(ids);
    localStorage.setItem("phrasekit-cat-selection", JSON.stringify(ids));
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

  // Zinnen in de actieve taal (via de agnostische helper); zinnen zonder die
  // vertaling worden overgeslagen.
  const getPhrasesForCategory = (catId: string) => {
    const all = [...getPhrasesByCategory(catId), ...getUserPhrasesByCategory(catId)];
    return all
      .map((p) => {
        const tr = getPhraseTranslation(p, language);
        return tr ? { translatedText: tr.text, romaji: tr.reading, sourceText: p.sourceText } : null;
      })
      .filter(Boolean) as { translatedText: string; romaji: string; sourceText: string }[];
  };


  return (
    <div className="page-content">

      {/* ── Woordmerk + account ───────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            PhraseKit <span className="text-stone-400 dark:text-stone-500 font-normal">{getLanguage(language)?.label ?? ""}</span>
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 tracking-wide">
            {`${getLanguage(language)?.label ?? ""} reiszinnen`}
          </p>
        </div>

        {/* Theme toggle + taal + auth */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
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

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
          {(["zinnen", "verdiepen"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            >
              {tab === "zinnen" ? "Situaties" : "Leren"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Situaties (reis) ─────────────────────────────────── */}
      {activeTab === "zinnen" && (
        <>
          {/* Inline vertaler — snel iets opzoeken onderweg */}
          <div className="px-5 mb-6">
            <InlineTranslator />
          </div>

          <section className="px-5 mb-8">
            {user && (
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Situaties</p>
                <div className="flex items-center gap-1">
                  {allCategories.length > 1 && (
                    <button
                      onClick={() => setReordering((v) => !v)}
                      aria-label={reordering ? "Klaar met herordenen" : "Herorden categorieën"}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${
                        reordering
                          ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                          : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
                      }`}
                    >
                      {reordering ? "✓" : "↕"}
                    </button>
                  )}
                  <button
                    onClick={() => setShowNewCategory(true)}
                    aria-label="Nieuwe categorie aanmaken"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-base transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <CategoryGrid
              categories={gridCategories}
              reordering={reordering}
              onReorder={saveCategoryOrder}
            />
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

      {/* ── Tab: Leren ────────────────────────────────────────────── */}
      {activeTab === "verdiepen" && (
        <section className="px-5 mb-8">
          {user ? (
            <div className="flex flex-col gap-5">
              {/* Vandaag + voortgang — de dagelijkse leerloop */}
              <div className="flex flex-col gap-2">
                <TodayCard onStart={() => setShowReview(true)} />
                <ProgressCard onOpen={() => setShowProgress(true)} />
              </div>

              {/* ── Gericht oefenen: kies eerst je categorieën ───────── */}
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
                  {/* Woorden oefenen — gerichte SRS-sessie op de gekozen categorieën */}
                  <button
                    onClick={() => setWordDrillCats(practiceSelection)}
                    disabled={!hasScope}
                    className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-all disabled:opacity-40 disabled:active:opacity-40"
                  >
                    <span className="text-2xl shrink-0">🎯</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Woorden oefenen</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Flashcards die je herhaalschema bijwerken</p>
                    </div>
                    <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>

                  {/* Zinnen oefenen — niveau & opgeslagen sets kies je in de flow */}
                  <button
                    onClick={() => setSentenceModal({ view: "new", autoStart: false })}
                    disabled={!hasScope}
                    className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-all disabled:opacity-40 disabled:active:opacity-40"
                  >
                    <span className="text-2xl shrink-0">✍️</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Zinnen oefenen</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">AI-oefenzinnen op jouw niveau</p>
                    </div>
                    <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>

                  {/* Uitspraak oefenen — mic-opname + AI-feedback */}
                  <button
                    onClick={() => setShowPronunciation(true)}
                    disabled={!hasScope}
                    className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-all disabled:opacity-40 disabled:active:opacity-40"
                  >
                    <span className="text-2xl shrink-0">🎤</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Uitspraak oefenen</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Spreek de zin in en krijg feedback</p>
                    </div>
                    <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>

                  {/* Grammatica — leerpad + ontdekt in jouw zinnen (los van de selectie) */}
                  <button onClick={() => setShowGrammar(true)} className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-opacity">
                    <span className="text-2xl shrink-0">📖</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Grammatica</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Leerpad en wat er in jouw zinnen zit</p>
                    </div>
                    <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🔒</p>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Log in om te leren</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">Oefenen, voortgang en grammatica zijn beschikbaar na inloggen</p>
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

      {sentenceModal && (
        <SentencePracticeModal
          allCategories={allCategories}
          getPhrasesForCategory={getPhrasesForCategory}
          initialSelected={practiceSelection}
          onSelectionChange={handleSelectionChange}
          onClose={() => setSentenceModal(null)}
          autoStart={sentenceModal.autoStart}
          initialView={sentenceModal.view}
        />
      )}

      {/* Vandaag: herhalingen uit alle categorieën + nieuwe woorden */}
      {showReview && (
        <ReviewSession
          allCategories={allCategories}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Gerichte woordsessie op de gekozen categorieën (telt mee in de SRS) */}
      {wordDrillCats && (
        <ReviewSession
          allCategories={allCategories}
          scopeCategoryIds={wordDrillCats}
          onClose={() => setWordDrillCats(null)}
        />
      )}

      {showGrammar && (
        <GrammarHub
          key={language}
          allPhrases={allPhrases}
          onClose={() => setShowGrammar(false)}
        />
      )}

      {showProgress && (
        <ProgressScreen
          key={language}
          onClose={() => setShowProgress(false)}
        />
      )}

      {showPronunciation && (
        <PronunciationSession
          getPhrasesForCategory={getPhrasesForCategory}
          selectedCategoryIds={practiceSelection}
          onClose={() => setShowPronunciation(false)}
        />
      )}
    </div>
  );
}
