"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import CategoryCard from "@/components/cards/CategoryCard";
import PhraseCard from "@/components/cards/PhraseCard";
import InlineTranslator from "@/components/ui/InlineTranslator";
import CategoryPicker from "@/components/ui/CategoryPicker";
import { categories, phrases, getPhrasesByCategory } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";
import { useVocabulary, VocabWord } from "@/hooks/useVocabulary";
import { useAudio } from "@/hooks/useAudio";

// ─── Vocab practice modal ─────────────────────────────────────────────────────

interface VocabPracticeModalProps {
  allCategories: Array<{ id: string; name: string; icon: string }>;
  getPhrasesForCategory: (id: string) => Array<{ translatedText: string; romaji: string; sourceText: string }>;
  onClose: () => void;
}

function VocabPracticeModal({ allCategories, getPhrasesForCategory, onClose }: VocabPracticeModalProps) {
  const { getVocab, saveVocab }  = useVocabulary();
  const { play, audioState }     = useAudio();
  const [mode,       setMode]       = useState<"select" | "loading" | "practice">("select");
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [words,      setWords]      = useState<VocabWord[]>([]);
  const [cardIndex,  setCardIndex]  = useState(0);
  const [flipped,    setFlipped]    = useState(false);

  const toggleCat = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleStart = async () => {
    if (selected.size === 0) return;
    setMode("loading");

    const all: VocabWord[] = [];
    for (const catId of selected) {
      const cached = await getVocab(catId).catch(() => null);
      if (cached) { all.push(...cached); continue; }

      const catPhrases = getPhrasesForCategory(catId);
      if (!catPhrases.length) continue;
      try {
        const res  = await fetch("/api/vocabulary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrases: catPhrases }),
        });
        const data = await res.json();
        const fetched: VocabWord[] = data.words ?? [];
        saveVocab(catId, fetched);
        all.push(...fetched);
      } catch { /* skip */ }
    }

    // Deduplicate on Japanese key, then shuffle
    const unique  = Array.from(new Map(all.map((w) => [w.japanese, w])).values());
    const shuffled = unique.sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCardIndex(0);
    setFlipped(false);
    setMode("practice");
  };

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
          <div className="flex items-center pt-3 pb-1 px-5">
            <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700 mx-auto" />
            <button onClick={onClose} className="absolute right-5 top-4 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Annuleren
            </button>
          </div>
          <div className="px-5 pt-3 pb-2">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">🎯 Woorden oefenen</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Kies de categorieën die je wilt oefenen</p>
          </div>
          <div className="px-3 overflow-y-auto max-h-[45vh]">
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
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-6">Japans</p>
              <p className="text-4xl font-bold text-white leading-tight mb-2">{word.japanese}</p>
              <p className="text-base text-stone-400 italic mb-4">{word.romaji}</p>
              <button onClick={(e) => { e.stopPropagation(); play(word.japanese); }} className={`text-sm flex items-center gap-2 transition-colors ${audioState === "playing" ? "text-stone-300" : "text-stone-500 hover:text-stone-200"}`}>
                {audioState === "playing" ? "⏸ Bezig…" : "🔊 Afspelen"}
              </button>
            </div>
          </div>
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

// ─── Sentence practice modal ──────────────────────────────────────────────────

interface PracticeSentence { dutch: string; japanese: string; romaji: string; }

interface SentencePracticeModalProps {
  allCategories: Array<{ id: string; name: string; icon: string }>;
  getPhrasesForCategory: (id: string) => Array<{ translatedText: string; romaji: string; sourceText: string }>;
  onClose: () => void;
}

function SentencePracticeModal({ allCategories, getPhrasesForCategory, onClose }: SentencePracticeModalProps) {
  const { getVocab }         = useVocabulary();
  const { play, audioState } = useAudio();
  const [mode,      setMode]      = useState<"select" | "loading" | "practice">("select");
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [sentences, setSentences] = useState<PracticeSentence[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped,   setFlipped]   = useState(false);

  const toggleCat = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleStart = async () => {
    if (selected.size === 0) return;
    setMode("loading");

    // Collect phrases and vocab words from selected categories
    const allPhrases: Array<{ sourceText: string; translatedText: string; romaji: string }> = [];
    const allWords:   Array<{ japanese: string; romaji: string; dutch: string }>             = [];

    for (const catId of selected) {
      allPhrases.push(...getPhrasesForCategory(catId));
      const cached = await getVocab(catId).catch(() => null);
      if (cached) allWords.push(...cached);
    }

    try {
      const res  = await fetch("/api/generate-sentences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases: allPhrases, words: allWords }),
      });
      const data = await res.json();
      const generated: PracticeSentence[] = data.sentences ?? [];
      setSentences(generated.sort(() => Math.random() - 0.5));
    } catch {
      setSentences([]);
    }

    setCardIndex(0);
    setFlipped(false);
    setMode("practice");
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
          <div className="flex items-center pt-3 pb-1 px-5">
            <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700 mx-auto" />
            <button onClick={onClose} className="absolute right-5 top-4 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Annuleren
            </button>
          </div>
          <div className="px-5 pt-3 pb-2">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">✍️ Zinnen oefenen</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">AI genereert nieuwe oefenzinnen op basis van je categorieën</p>
          </div>
          <div className="px-3 overflow-y-auto max-h-[45vh]">
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
              Genereren en starten ({selected.size} {selected.size === 1 ? "categorie" : "categorieën"})
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
        <p className="text-sm text-stone-400 dark:text-stone-500">Oefenzinnen genereren…</p>
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
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <p className="text-sm font-medium text-stone-400 dark:text-stone-500 tabular-nums">
          {cardIndex + 1} <span className="text-stone-300 dark:text-stone-600">/</span> {sentences.length}
        </p>
        <button
          onClick={() => { setSentences((s) => [...s].sort(() => Math.random() - 0.5)); setCardIndex(0); setFlipped(false); }}
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
              height:         "280px",
              cursor:         "pointer",
            }}
          >
            {/* Voorkant — oefenzin in het Nederlands */}
            <div style={{ backfaceVisibility: "hidden" }} className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-5">Hoe zeg je dit in het Japans?</p>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">{sentence.dutch}</p>
              <p className="text-xs text-stone-300 dark:text-stone-600 mt-8">Tik om het antwoord te zien</p>
            </div>
            {/* Achterkant — Japans antwoord */}
            <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} className="absolute inset-0 bg-stone-900 dark:bg-stone-800 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none">
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-5">Japans</p>
              <p className="text-3xl font-bold text-white leading-tight mb-2">{sentence.japanese}</p>
              <p className="text-base text-stone-400 italic mb-4">{sentence.romaji}</p>
              <button onClick={(e) => { e.stopPropagation(); play(sentence.japanese); }} className={`text-sm flex items-center gap-2 transition-colors ${audioState === "playing" ? "text-stone-300" : "text-stone-500 hover:text-stone-200"}`}>
                {audioState === "playing" ? "⏸ Bezig…" : "🔊 Afspelen"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 px-5 pb-14">
        <button onClick={() => go(-1)} disabled={cardIndex === 0} className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all" aria-label="Vorige">←</button>
        <div className="flex gap-1.5 flex-wrap justify-center max-w-[140px]">
          {sentences.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === cardIndex ? "w-4 h-2 bg-stone-700 dark:bg-stone-300" : "w-2 h-2 bg-stone-200 dark:bg-stone-700"}`} />
          ))}
        </div>
        <button onClick={() => go(1)} disabled={cardIndex === sentences.length - 1} className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all" aria-label="Volgende">→</button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { userCategories, userPhrases, staticFavoriteIds, addCategory, getUserPhrasesByCategory } = useUserPhrases();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [showNewCategory,      setShowNewCategory]      = useState(false);
  const [showVocabPractice,    setShowVocabPractice]    = useState(false);
  const [showSentencePractice, setShowSentencePractice] = useState(false);

  const userFavorieten   = userPhrases.filter((p) => p.isFavorite);
  const staticFavorieten = phrases.filter((p) => staticFavoriteIds.includes(p.id));
  const opgeslagenZinnen = [...userFavorieten, ...staticFavorieten].slice(0, 3);

  const allCategories = [
    ...categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    ...userCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
  ];

  const getPhrasesForCategory = (catId: string) => {
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

  return (
    <div className="page-content">

      {/* ── Woordmerk + account ───────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            PhraseKit <span className="text-stone-400 dark:text-stone-500 font-normal">Japan</span>
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 tracking-wide">
            Japanse reiszinnen
          </p>
        </div>

        {/* Auth button */}
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

      {/* ── Inline vertaler ───────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <InlineTranslator />
      </div>

      {/* ── Situaties ─────────────────────────────────────────────── */}
      <section className="px-5 mb-8">
        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
          Situaties
        </p>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
          {userCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-3.5 active:opacity-70 transition-opacity"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{cat.name}</span>
            </Link>
          ))}

          {user && (
            <button
              onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-3 bg-white/60 dark:bg-stone-900/60 border border-dashed border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 active:opacity-70 transition-opacity text-left w-full"
            >
              <span className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 text-base shrink-0">+</span>
              <span className="text-sm font-medium text-stone-400 dark:text-stone-500">Nieuwe categorie aanmaken</span>
            </button>
          )}
        </div>
      </section>

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

      {/* ── Opgeslagen zinnen ─────────────────────────────────────── */}
      {opgeslagenZinnen.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Favorieten
            </p>
            <Link
              href="/favorites"
              className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
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

      {/* ── Woorden oefenen ──────────────────────────────────────── */}
      {user && (
        <section className="px-5 mt-2 mb-2">
          <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            Oefenen
          </p>
          <button
            onClick={() => setShowVocabPractice(true)}
            className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-opacity"
          >
            <span className="text-2xl shrink-0">🎯</span>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Woorden oefenen</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Flashcards van woordenlijsten per categorie</p>
            </div>
            <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
          </button>
          <button
            onClick={() => setShowSentencePractice(true)}
            className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 active:opacity-70 transition-opacity"
          >
            <span className="text-2xl shrink-0">✍️</span>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Zinnen oefenen</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">AI genereert nieuwe oefenzinnen van je categorieën</p>
            </div>
            <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
          </button>
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
          onClose={() => setShowVocabPractice(false)}
        />
      )}

      {showSentencePractice && (
        <SentencePracticeModal
          allCategories={allCategories}
          getPhrasesForCategory={getPhrasesForCategory}
          onClose={() => setShowSentencePractice(false)}
        />
      )}
    </div>
  );
}
