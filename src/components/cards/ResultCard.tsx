"use client";

import { useState } from "react";
import { AskNowResult } from "@/types";
import { useAudio } from "@/hooks/useAudio";
import { useUserPhrases, UserCategory } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";
import CategoryPicker from "@/components/ui/CategoryPicker";
import GrammarPanel from "@/components/grammar/GrammarPanel";
import { categories } from "@/data/mockData";

interface ResultCardProps {
  result: AskNowResult;
  onMakePolite?: () => void;
  onMakeShorter?: () => void;
  defaultCategoryId?: string;
}

export default function ResultCard({
  result,
  onMakePolite,
  onMakeShorter,
  defaultCategoryId,
}: ResultCardProps) {
  const { play, audioState } = useAudio();
  const { addPhrase, addCategory, userCategories } = useUserPhrases();
  const { user, signInWithGoogle } = useAuth();

  const [showPicker, setShowPicker] = useState(false);
  const [savedTo,    setSavedTo]    = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

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

  const handleDirectSave = async () => {
    if (!defaultCategoryId) return;
    await handleSelectCategory(defaultCategoryId);
  };

  const handleAddCategory = async (name: string, icon: string): Promise<UserCategory> => {
    return addCategory(name, icon);
  };

  const handleSaveClick = () => {
    if (!user) { signInWithGoogle(); return; }
    if (defaultCategoryId) { handleDirectSave(); } else { setShowPicker(true); }
  };

  return (
    <>
      <div className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden">
        <div className="px-5 py-5">
          <p className="text-xs text-stone-400 dark:text-stone-500 italic mb-3">
            "{result.sourceText}"
          </p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight mb-2">
            {result.text}
          </p>
          <p className="text-base text-stone-400 dark:text-stone-500 italic mb-4">{result.reading}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-700 pt-3">
            {result.explanation}
          </p>

          {result.shortVersion && (
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-700">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5">
                {result.shortVersion.label}
              </p>
              <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{result.shortVersion.translatedText}</p>
              <p className="text-sm text-stone-400 dark:text-stone-500 italic">{result.shortVersion.romaji}</p>
            </div>
          )}

          {result.politeVersion && (
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5">
                {result.politeVersion.label}
              </p>
              <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{result.politeVersion.translatedText}</p>
              <p className="text-sm text-stone-400 dark:text-stone-500 italic">{result.politeVersion.romaji}</p>
            </div>
          )}

          {user && (
            <GrammarPanel
              key={result.language}
              embedded
              japanese={result.text}
              romaji={result.reading}
              english={result.sourceText}
              language={result.language}
            />
          )}
        </div>

        {savedTo ? (
          <div className="mx-5 mb-4 flex items-center gap-2 bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3">
            <span className="text-green-500 text-sm">✓</span>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Opgeslagen in <strong>{savedTo}</strong>
            </p>
          </div>
        ) : (
          <div className="px-5 mb-4">
            <button
              onClick={handleSaveClick}
              disabled={saving}
              className="w-full flex items-center justify-between bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl px-4 py-3 transition-colors active:scale-95 disabled:opacity-50"
            >
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {!user ? "Inloggen om op te slaan" : saving ? "Opslaan…" : defaultCategoryId ? "Opslaan in deze categorie" : "Voeg toe aan categorie"}
              </span>
              {!defaultCategoryId && <span className="text-stone-400 dark:text-stone-500 text-sm">›</span>}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 px-5 pb-4 border-t border-stone-50 dark:border-stone-800 pt-1">
          <button
            onClick={() => !isPlaying && play(result.text)}
            className={`text-xs font-medium transition-colors ${isPlaying ? "text-stone-500 dark:text-stone-400" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"}`}
          >
            {isPlaying ? "⏸ Bezig" : "🔊 Afspelen"}
          </button>

          {onMakePolite && !result.politeVersion && (
            <button onClick={onMakePolite} className="text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              🎩 Beleefder
            </button>
          )}

          {onMakeShorter && !result.shortVersion && (
            <button onClick={onMakeShorter} className="text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              ✂️ Korter
            </button>
          )}
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
