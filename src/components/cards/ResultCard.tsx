"use client";

import { useState } from "react";
import { AskNowResult } from "@/types";
import { useFavorites } from "@/hooks/useFavorites";
import { useAudio } from "@/hooks/useAudio";
import { useUserPhrases, UserCategory } from "@/hooks/useUserPhrases";
import CategoryPicker from "@/components/ui/CategoryPicker";
import { categories } from "@/data/mockData";

interface ResultCardProps {
  result: AskNowResult;
  onMakePolite?: () => void;
  onMakeShorter?: () => void;
}

export default function ResultCard({
  result,
  onMakePolite,
  onMakeShorter,
}: ResultCardProps) {
  const { addFavoriteResult, savedResults } = useFavorites();
  const { play, audioState } = useAudio();
  const { addPhrase, addCategory, userCategories } = useUserPhrases();

  const [showPicker, setShowPicker] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null); // category name after saving

  const isSaved = savedResults.includes(result.sourceText);
  const isPlaying = audioState === "playing";

  const handleSelectCategory = (categoryId: string) => {
    addPhrase(categoryId, result);
    setShowPicker(false);

    // Find category name for confirmation message
    const allCats = [...categories, ...userCategories];
    const cat = allCats.find((c) => c.id === categoryId);
    setSavedTo(cat?.name ?? "categorie");
  };

  const handleAddCategory = (name: string, icon: string): UserCategory => {
    return addCategory(name, icon);
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Main content */}
        <div className="px-5 py-5">
          {/* Source label */}
          <p className="text-xs text-stone-400 italic mb-3">
            "{result.sourceText}"
          </p>

          {/* Japanese — hero */}
          <p className="text-3xl font-bold text-stone-900 leading-tight mb-2">
            {result.translatedText}
          </p>

          {/* Romaji */}
          <p className="text-base text-stone-400 italic mb-4">{result.romaji}</p>

          {/* Explanation */}
          <p className="text-sm text-stone-500 leading-relaxed border-t border-stone-100 pt-3">
            {result.explanation}
          </p>

          {/* Short version */}
          {result.shortVersion && (
            <div className="mt-4 pt-3 border-t border-stone-100">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                {result.shortVersion.label}
              </p>
              <p className="text-lg font-semibold text-stone-900">
                {result.shortVersion.translatedText}
              </p>
              <p className="text-sm text-stone-400 italic">
                {result.shortVersion.romaji}
              </p>
            </div>
          )}

          {/* Polite version */}
          {result.politeVersion && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                {result.politeVersion.label}
              </p>
              <p className="text-lg font-semibold text-stone-900">
                {result.politeVersion.translatedText}
              </p>
              <p className="text-sm text-stone-400 italic">
                {result.politeVersion.romaji}
              </p>
            </div>
          )}
        </div>

        {/* Save to category — prominent CTA */}
        {savedTo ? (
          <div className="mx-5 mb-4 flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-3">
            <span className="text-green-500 text-sm">✓</span>
            <p className="text-sm text-stone-600">
              Opgeslagen in <strong>{savedTo}</strong>
            </p>
          </div>
        ) : (
          <div className="px-5 mb-4">
            <button
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-between bg-stone-50 hover:bg-stone-100 rounded-xl px-4 py-3 transition-colors active:scale-95"
            >
              <span className="text-sm font-medium text-stone-700">
                Voeg toe aan categorie
              </span>
              <span className="text-stone-400 text-sm">›</span>
            </button>
          </div>
        )}

        {/* Action strip */}
        <div className="flex flex-wrap gap-3 px-5 pb-4 border-t border-stone-50 pt-1">
          <button
            onClick={() => addFavoriteResult(result.sourceText)}
            className={`text-xs font-medium transition-colors ${
              isSaved ? "text-amber-500" : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {isSaved ? "★ Opgeslagen" : "☆ Opslaan"}
          </button>

          <button
            onClick={() => !isPlaying && play(result.translatedText)}
            className={`text-xs font-medium transition-colors ${
              isPlaying ? "text-stone-500" : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {isPlaying ? "⏸ Bezig" : "🔊 Afspelen"}
          </button>

          {onMakePolite && !result.politeVersion && (
            <button
              onClick={onMakePolite}
              className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
            >
              🎩 Beleefder
            </button>
          )}

          {onMakeShorter && !result.shortVersion && (
            <button
              onClick={onMakeShorter}
              className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
            >
              ✂️ Korter
            </button>
          )}

          <button
            onClick={() => alert("Grammatica uitleg komt binnenkort!")}
            className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
          >
            📖 Uitleggen
          </button>
        </div>
      </div>

      {/* Category picker bottom sheet */}
      {showPicker && (
        <CategoryPicker
          userCategories={userCategories}
          onSelect={handleSelectCategory}
          onAddCategory={handleAddCategory}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
