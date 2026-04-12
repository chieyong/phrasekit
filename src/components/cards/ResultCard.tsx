"use client";

import { useState } from "react";
import { AskNowResult } from "@/types";
import { useFavorites } from "@/hooks/useFavorites";
import { useAudio } from "@/hooks/useAudio";
import { useUserPhrases, UserCategory } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, signInWithGoogle } = useAuth();

  const [showPicker, setShowPicker] = useState(false);
  const [savedTo,    setSavedTo]    = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

  const isSaved   = savedResults.includes(result.sourceText);
  const isPlaying = audioState === "playing";

  const handleSelectCategory = async (categoryId: string) => {
    setSaving(true);
    try {
      await addPhrase(categoryId, result);
      setShowPicker(false);
      const allCats = [...categories, ...userCategories];
      const cat = allCats.find((c) => c.id === categoryId);
      setSavedTo(cat?.name ?? "categorie");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (
    name: string,
    icon: string
  ): Promise<UserCategory> => {
    return addCategory(name, icon);
  };

  const handleSaveClick = () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setShowPicker(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Main content */}
        <div className="px-5 py-5">
          <p className="text-xs text-stone-400 italic mb-3">
            "{result.sourceText}"
          </p>

          <p className="text-3xl font-bold text-stone-900 leading-tight mb-2">
            {result.translatedText}
          </p>

          <p className="text-base text-stone-400 italic mb-4">{result.romaji}</p>

          <p className="text-sm text-stone-500 leading-relaxed border-t border-stone-100 pt-3">
            {result.explanation}
          </p>

          {result.shortVersion && (
            <div className="mt-4 pt-3 border-t border-stone-100">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                {result.shortVersion.label}
              </p>
              <p className="text-lg font-semibold text-stone-900">{result.shortVersion.translatedText}</p>
              <p className="text-sm text-stone-400 italic">{result.shortVersion.romaji}</p>
            </div>
          )}

          {result.politeVersion && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
                {result.politeVersion.label}
              </p>
              <p className="text-lg font-semibold text-stone-900">{result.politeVersion.translatedText}</p>
              <p className="text-sm text-stone-400 italic">{result.politeVersion.romaji}</p>
            </div>
          )}
        </div>

        {/* Save to category CTA */}
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
              onClick={handleSaveClick}
              disabled={saving}
              className="w-full flex items-center justify-between bg-stone-50 hover:bg-stone-100 rounded-xl px-4 py-3 transition-colors active:scale-95 disabled:opacity-50"
            >
              <span className="text-sm font-medium text-stone-700">
                {!user
                  ? "Inloggen om op te slaan"
                  : saving
                  ? "Opslaan…"
                  : "Voeg toe aan categorie"}
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
