"use client";

export const dynamic = "force-dynamic";

import { use, useState, useEffect, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import NumberChip from "@/components/ui/NumberChip";
import { getCategoryById, getPhraseById } from "@/data/mockData";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import GrammarPanel from "@/components/grammar/GrammarPanel";
import { useEditablePhrase } from "@/hooks/useEditablePhrase";
import { useAudio } from "@/hooks/useAudio";
import { parseTextSegments } from "@/utils/japaneseNumbers";
import { PhraseVariant } from "@/types";
import CategoryPicker from "@/components/ui/CategoryPicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPhraseTranslation } from "@/utils/phrase";
import AudioButton from "@/components/ui/AudioButton";

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
  const { getUserPhraseById, userCategories, addCategory, addPhrase, loading: userLoading, deletePhrase, movePhrase, toggleUserFavorite, staticFavoriteIds, toggleStaticFavorite, hideStaticPhrase, updatePhraseGrammar, updatePhraseTranslation } = useUserPhrases();
  const userPhrase = getUserPhraseById(id);
  const staticPhrase = getPhraseById(id);
  const phrase = staticPhrase ?? userPhrase;
  const isUserPhrase = !!userPhrase;

  const { isFavorite, toggleFavorite } = useFavorites();
  // Geef altijd een geldig object mee zodat de hook niet crasht tijdens laden
  const { edited, numberMap, hasChanges, updateNumber, reset } =
    useEditablePhrase((phrase ?? EMPTY_PHRASE) as Parameters<typeof useEditablePhrase>[0]);
  const { play, audioState } = useAudio();
  const { language } = useLanguage();

  // Taal-agnostisch: lees de vertaling voor de actieve taal (met legacy-fallback).
  const isJa           = language === "ja";
  const tr             = phrase ? getPhraseTranslation(phrase, language) : undefined;
  const displayText    = tr?.text ?? "";
  const displayReading = isJa ? (edited.romaji ?? "") : (tr?.reading ?? "");
  const displayExpl    = tr?.explanation ?? "";
  const needsTranslation = !!phrase && isUserPhrase && !tr;

  // Ontbreekt de vertaling voor de actieve taal? Vertaal on-demand.
  const translatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!needsTranslation || !phrase) return;
    const key = `${phrase.id}_${language}`;
    if (translatedRef.current === key) return;
    translatedRef.current = key;
    fetch("/api/translate-phrase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText: phrase.sourceText, language }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.text) updatePhraseTranslation(phrase.id, language, { text: data.text, reading: data.reading ?? "", explanation: data.explanation });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsTranslation, phrase?.id, language]);

  const [showGrammar,    setShowGrammar]    = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [hiding,         setHiding]         = useState(false);
  const [showMovePicker, setShowMovePicker] = useState(false);
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [savedToName,    setSavedToName]    = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);

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
            {isJa && phrase.translatedText ? (
              <JapaneseText
                originalText={phrase.translatedText}
                numberMap={numberMap}
                onUpdate={updateNumber}
                size="lg"
              />
            ) : (displayText || "…")}
          </p>

          <p className="text-base text-stone-400 dark:text-stone-500 italic mb-4">{displayReading}</p>

          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-700 pt-3">
            {displayExpl}
          </p>

          <div className="flex items-center justify-between mt-3">
            {isJa && hasNumbers && !hasChanges && (
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

        {showGrammar && displayText && (
          <GrammarPanel
            key={language}
            japanese={displayText}
            romaji={tr?.reading ?? ""}
            english={phrase.sourceText}
            language={language}
            stored={tr?.grammar}
            onFetched={isUserPhrase
              ? (result) => updatePhraseGrammar(id, language, result)
              : undefined}
          />
        )}

        {/* ── Woord voor woord (verborgen bij gewijzigde getallen of grammatica) */}
        {tr?.wordBreakdown &&
          tr.wordBreakdown.length > 0 &&
          !hasChanges &&
          !showGrammar && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 mb-3">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
              Woord voor woord
            </p>
            <div className="flex flex-col gap-2.5">
              {tr.wordBreakdown.map((wb, idx) => (
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

        {/* ── Variants (alleen Japans) ────────────────────────────── */}
        {isJa && phrase.shortVersion && edited.shortVersion && (
          <VariantRow
            variant={edited.shortVersion}
            originalText={phrase.shortVersion.translatedText}
            numberMap={numberMap}
            onUpdate={updateNumber}
            onPlay={play}
            isPlaying={isPlaying}
          />
        )}

        {isJa && phrase.politeVersion && edited.politeVersion && (
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
        <div className="mb-3">
          <AudioButton text={displayText} />
        </div>

        {/* ── Opslaan in categorie ───────────────────────────────── */}
        {savedToName ? (
          <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 rounded-2xl px-4 py-3 mb-3">
            <span className="text-green-500 text-sm">✓</span>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Opgeslagen in <strong>{savedToName}</strong>
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowSavePicker(true)}
            disabled={saving}
            className="w-full flex items-center justify-between bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-2xl px-4 py-3 mb-3 transition-colors active:scale-95 disabled:opacity-50"
          >
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {saving ? "Opslaan…" : "＋ Opslaan in categorie"}
            </span>
            <span className="text-stone-400 dark:text-stone-500 text-sm">›</span>
          </button>
        )}

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

      {/* ── Opslaan in categorie picker ────────────────────────────── */}
      {showSavePicker && (
        <CategoryPicker
          userCategories={userCategories}
          onSelect={async (catId) => {
            setSaving(true);
            setShowSavePicker(false);
            try {
              await addPhrase(catId, {
                sourceText:   phrase.sourceText,
                language,
                text:         tr?.text ?? "",
                reading:      tr?.reading ?? "",
                explanation:  tr?.explanation ?? "",
                shortVersion: tr?.shortVersion,
                politeVersion: tr?.politeVersion,
              });
              const cat = getCategoryById(catId) ?? userCategories.find((c) => c.id === catId);
              setSavedToName(cat?.name ?? "categorie");
            } finally {
              setSaving(false);
            }
          }}
          onAddCategory={async (name, icon) => addCategory(name, icon)}
          onClose={() => setShowSavePicker(false)}
          title="Opslaan in categorie"
          subtitle="Kies een bestaande of maak een nieuwe aan"
        />
      )}
    </div>
  );
}
