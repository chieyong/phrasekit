"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import NumberChip from "@/components/ui/NumberChip";
import { getCategoryById, getPhraseById } from "@/data/mockData";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useEditablePhrase } from "@/hooks/useEditablePhrase";
import { useAudio } from "@/hooks/useAudio";
import { parseTextSegments } from "@/utils/japaneseNumbers";
import { PhraseVariant } from "@/types";
import CategoryPicker from "@/components/ui/CategoryPicker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExplainResult {
  summary: string;
  parts: { japanese: string; romaji: string; role: string; note?: string }[];
  tip: string;
}

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
    <div className="bg-white rounded-2xl px-5 py-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
          {variant.label}
        </p>
        <button
          onClick={() => onPlay(variant.translatedText)}
          aria-label={`Play ${variant.label}`}
          className="text-stone-300 hover:text-stone-600 transition-colors text-sm"
        >
          {isPlaying ? "⏸" : "🔊"}
        </button>
      </div>
      <p className="text-xl font-semibold text-stone-900 leading-snug mb-1">
        <JapaneseText
          originalText={originalText}
          numberMap={numberMap}
          onUpdate={onUpdate}
          size="md"
        />
      </p>
      <p className="text-sm text-stone-400 italic">{variant.romaji}</p>
    </div>
  );
}

// ─── Grammar panel ────────────────────────────────────────────────────────────

function GrammarPanel({
  japanese,
  romaji,
  english,
}: {
  japanese: string;
  romaji: string;
  english: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState("");

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
    } catch {
      setError("Couldn't load explanation.");
      setState("error");
    }
  };

  // Trigger load on first render of this panel
  if (state === "idle") load();

  return (
    <div className="bg-white rounded-2xl px-5 py-4 mb-3">
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">
        Grammatica
      </p>

      {state === "loading" && (
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-stone-100 rounded-full w-3/4" />
          <div className="h-3 bg-stone-100 rounded-full w-1/2" />
          <div className="h-3 bg-stone-100 rounded-full w-2/3" />
        </div>
      )}

      {state === "error" && (
        <p className="text-sm text-stone-400">{error || "Kon uitleg niet laden."}</p>
      )}

      {state === "done" && result && (
        <div className="space-y-3">
          <p className="text-sm text-stone-700 leading-relaxed">{result.summary}</p>

          {result.parts.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.parts.map((part, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="bg-stone-50 rounded-lg px-2.5 py-1 shrink-0 min-w-[60px]">
                    <p className="text-sm font-semibold text-stone-800">{part.japanese}</p>
                    <p className="text-[10px] text-stone-400">{part.romaji}</p>
                  </div>
                  <div className="mt-0.5">
                    <p className="text-sm text-stone-600">{part.role}</p>
                    {part.note && (
                      <p className="text-xs text-stone-400 mt-0.5">{part.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.tip && (
            <p className="text-xs text-stone-400 border-t border-stone-100 pt-3 leading-relaxed">
              💡 {result.tip}
            </p>
          )}
        </div>
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
  const { getUserPhraseById, userCategories, addCategory, loading: userLoading, deletePhrase, movePhrase, toggleUserFavorite } = useUserPhrases();
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
  const [showMovePicker, setShowMovePicker] = useState(false);

  // Wacht tot Firestore klaar is voor user-zinnen; anders te vroeg notFound
  if (!phrase && userLoading) {
    return (
      <div className="page-content flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
      </div>
    );
  }

  if (!phrase) notFound();

  const category =
    getCategoryById(phrase.categoryId) ??
    userCategories.find((c) => c.id === phrase.categoryId);

  // Favorites: user phrases track isFavorite in Firestore; static phrases use localStorage
  const favorited = isUserPhrase ? phrase.isFavorite : isFavorite(id);

  const handleFavoriteToggle = () => {
    if (isUserPhrase) {
      toggleUserFavorite(id);
    } else {
      toggleFavorite(id);
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
        <p className="text-xs text-stone-400 italic mb-4">
          "{phrase.sourceText}"
        </p>

        {/* ── Hero card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl px-5 py-5 mb-3">
          <p className="text-4xl font-bold text-stone-900 leading-tight mb-3">
            <JapaneseText
              originalText={phrase.translatedText}
              numberMap={numberMap}
              onUpdate={updateNumber}
              size="lg"
            />
          </p>

          <p className="text-base text-stone-400 italic mb-4">{edited.romaji}</p>

          <p className="text-sm text-stone-500 leading-relaxed border-t border-stone-100 pt-3">
            {phrase.explanation}
          </p>

          <div className="flex items-center justify-between mt-3">
            {hasNumbers && !hasChanges && (
              <p className="text-[10px] text-stone-300 tracking-wide">
                Tik op een getal om aan te passen
              </p>
            )}
            {hasChanges && (
              <button
                onClick={reset}
                className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors tracking-wide"
              >
                ↺ Herstellen
              </button>
            )}
          </div>
        </div>

        {/* ── Grammaticapaneel (lazy) ─────────────────────────────── */}
        {showGrammar && (
          <GrammarPanel
            japanese={phrase.translatedText}
            romaji={phrase.romaji}
            english={phrase.sourceText}
          />
        )}

        {/* ── Woord voor woord (verborgen bij gewijzigde getallen of grammatica) */}
        {phrase.wordBreakdown &&
          phrase.wordBreakdown.length > 0 &&
          !hasChanges &&
          !showGrammar && (
          <div className="bg-white rounded-2xl px-5 py-4 mb-3">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">
              Woord voor woord
            </p>
            <div className="flex flex-col gap-2.5">
              {phrase.wordBreakdown.map((wb, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="bg-stone-50 rounded-lg px-2.5 py-1 shrink-0">
                    <p className="text-sm font-semibold text-stone-800">{wb.word}</p>
                    <p className="text-[10px] text-stone-400">{wb.reading}</p>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">→ {wb.meaning}</p>
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
              className="flex-1 py-3 text-xs text-stone-400 hover:text-stone-600 transition-colors text-center border border-stone-100 rounded-2xl"
            >
              ↗ Verplaatsen
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-3 text-xs text-red-400 hover:text-red-600 transition-colors text-center border border-stone-100 rounded-2xl disabled:opacity-40"
            >
              {deleting ? "Verwijderen…" : "🗑 Verwijderen"}
            </button>
          </div>
        )}

        {/* Explain toggle */}
        <button
          onClick={() => setShowGrammar((v) => !v)}
          className="w-full py-3 text-xs text-stone-400 hover:text-stone-600 transition-colors text-center"
        >
          {showGrammar ? "Verberg grammatica ↑" : "📖 Grammatica uitleggen"}
        </button>

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
