"use client";

export const dynamic = "force-dynamic";

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Header from "@/components/layout/Header";
import PhraseCard from "@/components/cards/PhraseCard";
import { getCategoryById, getPhrasesByCategory } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useAudio } from "@/hooks/useAudio";
import { useVocabulary, VocabWord } from "@/hooks/useVocabulary";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phrase } from "@/types";
import InlineTranslator from "@/components/ui/InlineTranslator";
import AudioButton from "@/components/ui/AudioButton";

// ─── Vocabulary sheet ─────────────────────────────────────────────────────────

function VocabSheet({ phrases, categoryId, onClose }: { phrases: Phrase[]; categoryId: string; onClose: () => void }) {
  const { getVocab, saveVocab } = useVocabulary();
  const { language } = useLanguage();
  const [words,  setWords]  = useState<VocabWord[]>([]);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    getVocab(categoryId, language).then((cached) => {
      if (cached) { setWords(cached); setStatus("done"); return; }

      // For Chinese: use chineseText+pinyin if available, else skip that phrase
      const apiPhrases = phrases
        .map((p) => language === "zh"
          ? (p.chineseText ? { translatedText: p.chineseText, romaji: p.pinyin ?? "", sourceText: p.sourceText } : null)
          : { translatedText: p.translatedText, romaji: p.romaji, sourceText: p.sourceText }
        )
        .filter(Boolean) as { translatedText: string; romaji: string; sourceText: string }[];

      if (!apiPhrases.length) { setStatus("done"); return; }

      fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases: apiPhrases, language }),
      })
        .then((r) => r.json())
        .then((data) => {
          const fetched: VocabWord[] = data.words ?? [];
          setWords(fetched);
          setStatus("done");
          saveVocab(categoryId, fetched, language);
        })
        .catch(() => setStatus("error"));
    }).catch(() => setStatus("error"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={handleBackdrop}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl">

        {/* Handle + sluitknop */}
        <div className="relative flex items-center justify-center pt-4 pb-1 px-5">
          <div className="w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
          <button
            onClick={onClose}
            className="absolute right-5 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Sluiten
          </button>
        </div>

        <div className="px-5 pt-3 pb-2">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">📚 Woordenlijst</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Sleutelwoorden uit de zinnen in deze categorie</p>
        </div>

        <div className="px-5 pb-8 overflow-y-auto max-h-[55vh]">
          {status === "loading" && (
            <div className="space-y-3 pt-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-6 bg-stone-100 dark:bg-stone-800 rounded-lg w-24" />
                  <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded-lg w-16" />
                  <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded-lg flex-1" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">
              Kon woordenlijst niet laden.
            </p>
          )}

          {status === "done" && words.length === 0 && (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">
              Geen woorden gevonden.
            </p>
          )}

          {status === "done" && words.length > 0 && (() => {
            const nonVerbs = words.filter((w) => w.type !== "verb");
            const verbs    = words.filter((w) => w.type === "verb");
            const renderRow = (w: VocabWord, i: number) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="shrink-0 min-w-[80px]">
                  <p className="text-base font-semibold text-stone-900 dark:text-stone-100">{w.japanese}</p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">{w.romaji}</p>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400">{w.dutch}</p>
              </div>
            );
            return (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {nonVerbs.map(renderRow)}
                {verbs.length > 0 && (
                  <>
                    <div className="pt-3 pb-1">
                      <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Werkwoorden</p>
                    </div>
                    {verbs.map(renderRow)}
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Flashcard module ─────────────────────────────────────────────────────────

function FlashcardModal({ phrases, onClose }: { phrases: Phrase[]; onClose: () => void }) {
  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order,   setOrder]   = useState(() => phrases.map((_, i) => i).sort(() => Math.random() - 0.5));

  const phrase = phrases[order[index]];

  const go = (delta: number) => {
    setFlipped(false);
    // kleine delay zodat de kaart eerst omslaat voor die verdwijnt
    setTimeout(() => setIndex((i) => Math.min(Math.max(i + delta, 0), order.length - 1)), 50);
  };

  const shuffle = () => {
    setOrder((prev) => [...prev].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
  };

  if (!phrase) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg"
          aria-label="Sluiten"
        >
          ✕
        </button>

        <p className="text-sm font-medium text-stone-400 dark:text-stone-500 tabular-nums">
          {index + 1} <span className="text-stone-300 dark:text-stone-600">/</span> {order.length}
        </p>

        <button
          onClick={shuffle}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm"
          aria-label="Schudden"
        >
          ⇄
        </button>
      </div>

      {/* ── Flashcard ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm" style={{ perspective: "1200px" }}>
          <div
            onClick={() => setFlipped((v) => !v)}
            style={{
              transformStyle:  "preserve-3d",
              transform:       flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition:      "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
              position:        "relative",
              height:          "300px",
              cursor:          "pointer",
            }}
          >
            {/* Voorkant — Nederlands */}
            <div
              style={{ backfaceVisibility: "hidden" }}
              className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none"
            >
              <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-6">
                Nederlands
              </p>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                {phrase.sourceText}
              </p>
              <p className="text-xs text-stone-300 dark:text-stone-600 mt-8">Tik om te draaien</p>
            </div>

            {/* Achterkant — Japans */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform:          "rotateY(180deg)",
              }}
              className="absolute inset-0 bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none"
            >
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-6">
                Japans
              </p>
              <p className="text-3xl font-bold text-white leading-tight mb-3">
                {phrase.translatedText}
              </p>
              <p className="text-base text-stone-400 italic">
                {phrase.romaji}
              </p>
              <div className="mt-6">
                <AudioButton text={phrase.translatedText} className="bg-stone-800 hover:bg-stone-700 text-stone-400" />
              </div>
            </div>
          </div>
          {flipped && index < order.length - 1 && (
            <div className="flex justify-end mt-3 pr-1">
              <button onClick={() => go(1)} className="w-9 h-9 rounded-full bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-sm flex items-center justify-center active:scale-95 transition-all" aria-label="Volgende">→</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigatie ────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 px-5 pb-14">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all"
          aria-label="Vorige"
        >
          ←
        </button>

        {/* Voortgangsbollen */}
        <div className="flex gap-1.5">
          {order.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === index
                  ? "w-4 h-2 bg-stone-700 dark:bg-stone-300"
                  : "w-2 h-2 bg-stone-200 dark:bg-stone-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={index === order.length - 1}
          className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all"
          aria-label="Volgende"
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── Sorteerbare kaart (alleen in bewerkingsmodus) ─────────────────────────────

function SortableCard({ phrase }: { phrase: Phrase }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: phrase.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex items-stretch gap-2"
    >
      <div className="flex-1 min-w-0">
        <PhraseCard phrase={phrase} />
      </div>
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 w-8 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 active:text-stone-700 dark:active:text-stone-200 transition-colors touch-none cursor-grab active:cursor-grabbing"
        aria-label="Versleep om te herordenen"
      >
        <span className="text-base leading-none select-none">⠿</span>
      </button>
    </div>
  );
}

// ─── Pagina ────────────────────────────────────────────────────────────────────

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function CategoriePagina({ params }: CategoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { language } = useLanguage();
  const {
    getUserPhrasesByCategory,
    userCategories,
    deleteCategory,
    hideStaticPhrase,
    hiddenStaticPhraseIds,
    updatePhraseSortOrder,
    loading: userLoading,
  } = useUserPhrases();

  const staticCategory = getCategoryById(id);
  const userCategory   = userCategories.find((c) => c.id === id);
  const category       = staticCategory ?? (userCategory ? { ...userCategory, description: "", color: "", accentColor: "" } : null);
  const isUserCategory = !!userCategory && !staticCategory;

  const staticZinnen = getPhrasesByCategory(id).filter(
    (p) => !hiddenStaticPhraseIds.includes(p.id)
  );
  const userZinnen = getUserPhrasesByCategory(id);
  const alleZinnen = [...staticZinnen, ...userZinnen];

  const [query,         setQuery]         = useState("");
  const [deleting,      setDeleting]      = useState(false);
  const [editMode,      setEditMode]      = useState(false);
  const [hiding,        setHiding]        = useState<string | null>(null);
  const [oefenModus,    setOefenModus]    = useState(false);
  const [showVocab,     setShowVocab]     = useState(false);
  const [grammarGroups, setGrammarGroups] = useState<{ groep: string; zinIds: string[] }[] | null>(null);
  const [activeGroep,   setActiveGroep]   = useState<string | null>(null);
  const [groupLoading,  setGroupLoading]  = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = userZinnen.findIndex((p) => p.id === active.id);
    const newIndex = userZinnen.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(userZinnen, oldIndex, newIndex);
    await Promise.all(
      reordered.map((phrase, idx) => updatePhraseSortOrder(phrase.id, (idx + 1) * 1000))
    );
  };

  const handleHideStatic = async (phraseId: string) => {
    setHiding(phraseId);
    try { await hideStaticPhrase(phraseId); }
    finally { setHiding(null); }
  };

  const handleDeleteCategory = async () => {
    if (!confirm(`Categorie "${category?.name}" verwijderen?`)) return;
    setDeleting(true);
    try { await deleteCategory(id); router.back(); }
    finally { setDeleting(false); }
  };

  const handleGroepeerGrammatica = async () => {
    if (grammarGroups) { setGrammarGroups(null); setActiveGroep(null); return; }
    setGroupLoading(true);
    try {
      const res = await fetch("/api/group-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          phrases: alleZinnen.map((p) => ({
            id:             p.id,
            translatedText: language === "zh" ? (p.chineseText ?? p.translatedText) : p.translatedText,
            sourceText:     p.sourceText,
          })),
        }),
      });
      const data = await res.json();
      const groups: { groep: string; zinIds: string[] }[] = data.groups ?? [];
      if (groups.length > 0) {
        setGrammarGroups(groups);
        setActiveGroep(groups[0].groep);
      }
    } catch {
      // silently fail — user stays in normal view
    } finally {
      setGroupLoading(false);
    }
  };

  if (!category && userLoading) {
    return (
      <div className="page-content flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
      </div>
    );
  }

  if (!category) notFound();

  const basisLijst = grammarGroups && activeGroep
    ? alleZinnen.filter((p) => {
        const groep = grammarGroups.find((g) => g.groep === activeGroep);
        return groep?.zinIds.includes(p.id) ?? false;
      })
    : alleZinnen;

  const gefilterd = query.trim()
    ? basisLijst.filter(
        (p) =>
          p.sourceText.toLowerCase().includes(query.toLowerCase()) ||
          p.translatedText.includes(query) ||
          p.romaji.toLowerCase().includes(query.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : basisLijst;

  return (
    <div className="page-content">
      <Header
        title={`${category.icon} ${category.name}`}
        subtitle={category.description}
        showBack
      />

      {/* ── Inline vertaler ───────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3">
        <InlineTranslator defaultCategoryId={id} categoryName={category.name} />
      </div>

      {/* ── Zoekbalk + Bewerk-knop ────────────────────────────────── */}
      <div className="px-5 pb-2 flex items-center gap-2">
        {!editMode && (
          <div className="flex-1 flex items-center gap-2 bg-stone-100/70 dark:bg-stone-800/70 rounded-xl px-3 py-2">
            <span className="text-stone-300 dark:text-stone-600 text-xs">○</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Zoek in ${category.name.toLowerCase()}…`}
              className="flex-1 bg-transparent text-xs text-stone-600 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-stone-300 dark:text-stone-600 text-xs hover:text-stone-500 dark:hover:text-stone-400">✕</button>
            )}
          </div>
        )}
        {alleZinnen.length > 0 && (
          <button
            onClick={() => { setEditMode((v) => !v); setQuery(""); }}
            className={`shrink-0 text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
              editMode ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900" : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {editMode ? "Klaar" : "Bewerk"}
          </button>
        )}
      </div>

      {/* ── Grammaticagroepen tabs ────────────────────────────────── */}
      {grammarGroups && !editMode && (
        <div className="px-5 pb-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {grammarGroups.map((g) => (
              <button
                key={g.groep}
                onClick={() => setActiveGroep(g.groep)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeGroep === g.groep
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {g.groep}
                <span className="ml-1.5 opacity-50">{g.zinIds.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Zinnenlijst ───────────────────────────────────────────── */}
      <div className="px-5 pt-3 flex flex-col gap-1.5">
        {editMode ? (
          <>
            {staticZinnen.map((phrase) => (
              <div key={phrase.id} className="relative">
                <PhraseCard phrase={phrase} />
                <button
                  onClick={() => handleHideStatic(phrase.id)}
                  disabled={hiding === phrase.id}
                  className="absolute top-3 right-3 text-[10px] text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 transition-colors disabled:opacity-40 bg-white/80 dark:bg-stone-800/80 rounded-lg px-2 py-1"
                >
                  {hiding === phrase.id ? "…" : "Verbergen"}
                </button>
              </div>
            ))}

            {userZinnen.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={userZinnen.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-1.5">
                    {userZinnen.map((phrase) => (
                      <SortableCard key={phrase.id} phrase={phrase} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {alleZinnen.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📂</p>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-1">Deze categorie is leeg.</p>
                <p className="text-stone-400 dark:text-stone-500 text-xs">Gebruik de Vraag-knop om een zin toe te voegen.</p>
              </div>
            )}
          </>
        ) : gefilterd.length === 0 ? (
          <div className="text-center py-12">
            {query ? (
              <>
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-stone-500 dark:text-stone-400 text-sm">Geen zinnen gevonden voor "{query}"</p>
                <button onClick={() => setQuery("")} className="mt-3 text-sm text-stone-400 dark:text-stone-500 underline">
                  Zoekopdracht wissen
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">📂</p>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-1">Deze categorie is leeg.</p>
                <p className="text-stone-400 dark:text-stone-500 text-xs">Gebruik de Vraag-knop om een zin toe te voegen.</p>
              </>
            )}
          </div>
        ) : (
          gefilterd.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))
        )}
      </div>

      {/* ── Oefenen + Woordenlijst + Groeperen ──────────────────── */}
      {alleZinnen.length > 0 && !editMode && (
        <div className="px-5 pt-6 pb-4 flex flex-col gap-2">
          <button
            onClick={() => setOefenModus(true)}
            className="w-full py-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl text-sm font-medium active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <span>🃏</span>
            <span>Oefenen met flashcards</span>
          </button>
          <button
            onClick={() => setShowVocab(true)}
            className="w-full py-3.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl text-sm font-medium active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <span>📚</span>
            <span>Woordenlijst</span>
          </button>
          <button
            onClick={handleGroepeerGrammatica}
            disabled={groupLoading}
            className={`w-full py-3.5 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              grammarGroups
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 active:opacity-80"
                : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 active:opacity-80 disabled:opacity-50"
            }`}
          >
            <span>{groupLoading ? "⏳" : grammarGroups ? "✕" : "🔤"}</span>
            <span>
              {groupLoading ? "Groepen bepalen…" : grammarGroups ? "Groepering sluiten" : "Groepeer op grammatica"}
            </span>
          </button>
        </div>
      )}

      {/* Verwijder categorie */}
      {isUserCategory && alleZinnen.length === 0 && !query && !editMode && (
        <div className="px-5 pb-8 pt-4">
          <button
            onClick={handleDeleteCategory}
            disabled={deleting}
            className="w-full py-3 text-xs text-red-400 hover:text-red-600 transition-colors text-center border border-red-100 dark:border-red-900/30 rounded-2xl disabled:opacity-40"
          >
            {deleting ? "Verwijderen…" : "🗑 Categorie verwijderen"}
          </button>
        </div>
      )}

      {/* ── Flashcard overlay ─────────────────────────────────────── */}
      {oefenModus && (
        <FlashcardModal
          phrases={alleZinnen}
          onClose={() => setOefenModus(false)}
        />
      )}

      {/* ── Woordenlijst overlay ──────────────────────────────────── */}
      {showVocab && (
        <VocabSheet
          phrases={alleZinnen}
          categoryId={id}
          onClose={() => setShowVocab(false)}
        />
      )}
    </div>
  );
}
