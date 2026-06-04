"use client";

export const dynamic = "force-dynamic";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import NumberChip from "@/components/ui/NumberChip";
import { getCategoryById, getPhraseById } from "@/data/mockData";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { GrammarExplanation } from "@/types";
import { useEditablePhrase } from "@/hooks/useEditablePhrase";
import { useAudio } from "@/hooks/useAudio";
import { parseTextSegments } from "@/utils/japaneseNumbers";
import { PhraseVariant } from "@/types";
import CategoryPicker from "@/components/ui/CategoryPicker";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExplainResult = GrammarExplanation;

// ─── Inline Japanese renderer ─────────────────────────────────────────────────

function JapaneseText({
  originalText,
  numberMap,
  onUpdate,
  size,
  className,
}: {
  originalText: string;
  numberMap: Map<number, number>;
  onUpdate: (orig: number, newVal: number) => void;
  size: "lg" | "md";
  className?: string;
}) {
  const segments = parseTextSegments(originalText);
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.content}</span>;
        const current = numberMap.get(seg.value) ?? seg.value;
        return (
          <NumberChip
            key={i}
            originalValue={seg.value}
            currentValue={current}
            onChange={onUpdate}
            size={size}
          />
        );
      })}
    </span>
  );
}

// ─── Variant row ──────────────────────────────────────────────────────────────

function VariantRow({
  variant,
  originalText,
  numberMap,
  onUpdate,
  onPlay,
  isPlaying,
}: {
  variant: PhraseVariant;
  originalText: string;
  numberMap: Map<number, number>;
  onUpdate: (orig: number, newVal: number) => void;
  onPlay: (text: string) => void;
  isPlaying: boolean;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
          {variant.label}
        </p>
        <button
          onClick={() => onPlay(variant.translatedText)}
          aria-label={`Play ${variant.label}`}
          className="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-sm"
        >
          {isPlaying ? "⏸" : "🔊"}
        </button>
      </div>
      <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 leading-snug mb-1">
        <JapaneseText
          originalText={originalText}
          numberMap={numberMap}
          onUpdate={onUpdate}
          size="md"
        />
      </p>
      <p className="text-sm text-stone-400 dark:text-stone-500 italic">{variant.romaji}</p>
    </div>
  );
}

// ─── Grammar panel ────────────────────────────────────────────────────────────

interface QA { question: string; answer: string; }

function GrammarPanel({
  japanese,
  romaji,
  english,
  stored,
  onFetched,
}: {
  japanese: string;
  romaji: string;
  english: string;
  stored?: GrammarExplanation;
  onFetched?: (result: GrammarExplanation) => void;
}) {
  const [state,    setState]    = useState<"idle" | "loading" | "done" | "error">(stored ? "done" : "idle");
  const [result,   setResult]   = useState<ExplainResult | null>(stored ?? null);
  const [error,    setError]    = useState("");
  const [qaList,   setQaList]   = useState<QA[]>([]);
  const [vraag,    setVraag]    = useState("");
  const [asking,   setAsking]   = useState(false);

  const load = async () => {
    if (state === "loading" || state === "done") return;
    setState("loading");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ japanese, romaji, english }),
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
    <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 mb-3">
      <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
        Grammatica
      </p>

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
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{qa.answer}</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PhraseDetailPageProps {
  params: Promise<{ id: string }>;
}

// Lege placeholder zodat hooks nooit undefined ontvangen tijdens laden
const EMPTY_PHRASE = {
  id: "", categoryId: "", sourceText: "", translatedText: "",
  romaji: "", explanation: "", tags: [], isFavorite: false,
};

export default function PhraseDetailPage({ params }: PhraseDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { getUserPhraseById, userCategories, addCategory, loading: userLoading, deletePhrase, movePhrase, toggleUserFavorite, staticFavoriteIds, toggleStaticFavorite, hideStaticPhrase, updatePhraseGrammar } = useUserPhrases();
  const userPhrase = getUserPhraseById(id);
  const staticPhrase = getPhraseById(id);
  const phrase = staticPhrase ?? userPhrase;
  const isUserPhrase = !!userPhrase;

  const { isFavorite, toggleFavorite } = useFavorites();
  // Geef altijd een geldig object mee zodat de hook niet crasht tijdens laden
  const { edited, numberMap, hasChanges, updateNumber, reset } =
    useEditablePhrase((phrase ?? EMPTY_PHRASE) as Parameters<typeof useEditablePhrase>[0]);
  const { play, audioState } = useAudio();

  const [showGrammar,    setShowGrammar]    = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [hiding,         setHiding]         = useState(false);
  const [showMovePicker, setShowMovePicker] = useState(false);

  // Wacht tot Firestore klaar is voor user-zinnen; anders te vroeg notFound
  if (!phrase && userLoading) {
    return (
      <div className="page-content flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
      </div>
    );
  }

  if (!phrase) notFound();

  const category =
    getCategoryById(phrase.categoryId) ??
    userCategories.find((c) => c.id === phrase.categoryId);

  // Favorites: user phrases → Firestore isFavorite; static phrases → Firestore staticFavoriteIds
  const favorited = isUserPhrase
    ? (userPhrase?.isFavorite ?? false)
    : staticFavoriteIds.includes(id);

  const handleFavoriteToggle = () => {
    if (isUserPhrase) {
      toggleUserFavorite(id);
    } else {
      toggleStaticFavorite(id);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Deze zin verwijderen uit je categorie?")) return;
    setDeleting(true);
    try {
      await deletePhrase(id);
      router.back();
    } finally {
      setDeleting(false);
    }
  };

  const isPlaying = audioState === "playing";
  const hasNumbers = [...numberMap.keys()].length > 0;

  return (
    <div className="page-content">
      <Header
        title={category ? `${category.icon} ${category.name}` : "Phrase"}
        showBack
      />

      <div className="px-5 pt-5">

        {/* ── English source ─────────────────────────────────────── */}
        <p className="text-xs text-stone-400 dark:text-stone-500 italic mb-4">
          "{phrase.sourceText}"
        </p>

        {/* ── Hero card ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-5 mb-3 relative">

          {/* Favoriet-knop rechtsboven */}
          <button
            onClick={handleFavoriteToggle}
            aria-label={favorited ? "Verwijder favoriet" : "Markeer als favoriet"}
            className={`absolute top-4 right-4 text-xl transition-colors ${
              favorited ? "text-amber-400" : "text-stone-200 dark:text-stone-700 hover:text-amber-300"
            }`}
          >
            {favorited ? "★" : "☆"}
          </button>

          <p className="text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight mb-3 pr-8">
            <JapaneseText
              originalText={phrase.translatedText}
              numberMap={numberMap}
              onUpdate={updateNumber}
              size="lg"
            />
          </p>

          <p className="text-base text-stone-400 dark:text-stone-500 italic mb-4">{edited.romaji}</p>

          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-700 pt-3">
            {phrase.explanation}
          </p>

          <div className="flex items-center justify-between mt-3">
            {hasNumbers && !hasChanges && (
              <p className="text-[10px] text-stone-300 dark:text-stone-600 tracking-wide">
                Tik op een getal om aan te passen
              </p>
            )}
            {hasChanges && (
              <button
                onClick={reset}
                className="text-[10px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors tracking-wide"
              >
                ↺ Herstellen
              </button>
            )}
          </div>
        </div>

        {/* ── Grammatica toggle + paneel ─────────────────────────── */}
        <button
          onClick={() => setShowGrammar((v) => !v)}
          className="w-full py-2.5 mb-3 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-center bg-white dark:bg-stone-900 rounded-2xl"
        >
          {showGrammar ? "Verberg grammatica ↑" : "📖 Grammatica uitleggen"}
        </button>

        {showGrammar && (
          <GrammarPanel
            japanese={phrase.translatedText}
            romaji={phrase.romaji}
            english={phrase.sourceText}
            stored={phrase.grammarExplanation}
            onFetched={isUserPhrase ? (result) => updatePhraseGrammar(id, result) : undefined}
          />
        )}

        {/* ── Woord voor woord (verborgen bij gewijzigde getallen of grammatica) */}
        {phrase.wordBreakdown &&
          phrase.wordBreakdown.length > 0 &&
          !hasChanges &&
          !showGrammar && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 mb-3">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
              Woord voor woord
            </p>
            <div className="flex flex-col gap-2.5">
              {phrase.wordBreakdown.map((wb, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="bg-stone-50 dark:bg-stone-800 rounded-lg px-2.5 py-1 shrink-0">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{wb.word}</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500">{wb.reading}</p>
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">→ {wb.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Variants ───────────────────────────────────────────── */}
        {phrase.shortVersion && edited.shortVersion && (
          <VariantRow
            variant={edited.shortVersion}
            originalText={phrase.shortVersion.translatedText}
            numberMap={numberMap}
            onUpdate={updateNumber}
            onPlay={play}
            isPlaying={isPlaying}
          />
        )}

        {phrase.politeVersion && edited.politeVersion && (
          <VariantRow
            variant={edited.politeVersion}
            originalText={phrase.politeVersion.translatedText}
            numberMap={numberMap}
            onUpdate={updateNumber}
            onPlay={play}
            isPlaying={isPlaying}
          />
        )}

        {/* ── Tags ───────────────────────────────────────────────── */}
        {phrase.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {phrase.tags.map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
        )}

        {/* ── Actions ────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => !isPlaying && play(edited.translatedText)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-colors ${
              isPlaying
                ? "bg-stone-200 text-stone-600"
                : "bg-stone-900 text-white active:opacity-80"
            }`}
          >
            <span>{isPlaying ? "⏸" : "🔊"}</span>
            <span>{isPlaying ? "Bezig…" : "Afspelen"}</span>
          </button>
        </div>

        {/* ── Verplaatsen + Verwijderen (alleen voor eigen zinnen) ── */}
        {isUserPhrase && (
          <div className="flex gap-2 mb-1">
            <button
              onClick={() => setShowMovePicker(true)}
              className="flex-1 py-3 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-center border border-stone-100 dark:border-stone-700 rounded-2xl"
            >
              ↗ Verplaatsen
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-3 text-xs text-red-400 hover:text-red-600 transition-colors text-center border border-stone-100 dark:border-stone-700 rounded-2xl disabled:opacity-40"
            >
              {deleting ? "Verwijderen…" : "🗑 Verwijderen"}
            </button>
          </div>
        )}

        {/* ── Verbergen (alleen voor standaardzinnen) ──────────────── */}
        {!isUserPhrase && (
          <div className="flex gap-2 mb-1">
            <button
              onClick={async () => {
                if (!confirm("Deze standaardzin verbergen? Je kunt hem niet terugzetten.")) return;
                setHiding(true);
                try {
                  await hideStaticPhrase(id);
                  router.back();
                } finally {
                  setHiding(false);
                }
              }}
              disabled={hiding}
              className="flex-1 py-3 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-center border border-stone-100 dark:border-stone-700 rounded-2xl disabled:opacity-40"
            >
              {hiding ? "Verbergen…" : "👁 Verberg standaardzin"}
            </button>
          </div>
        )}


      </div>

      {/* ── Categorie verplaatsen picker ───────────────────────────── */}
      {showMovePicker && (
        <CategoryPicker
          userCategories={userCategories}
          onSelect={async (newCatId) => {
            await movePhrase(id, newCatId);
            setShowMovePicker(false);
            router.back();
          }}
          onAddCategory={async (name, icon) => addCategory(name, icon)}
          onClose={() => setShowMovePicker(false)}
          title="Verplaatsen naar"
          subtitle="Kies de nieuwe categorie voor deze zin"
        />
      )}
    </div>
  );
}
