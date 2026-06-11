"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Phrase } from "@/types";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useLanguage } from "@/contexts/LanguageContext";
import AudioButton from "@/components/ui/AudioButton";

// Module-level set — shared across all PhraseCard instances to prevent duplicate calls
const translating = new Set<string>();

interface PhraseCardProps {
  phrase: Phrase;
  showCategory?: boolean;
}

export default function PhraseCard({
  phrase,
  showCategory = false,
}: PhraseCardProps) {
  const { userPhrases, staticFavoriteIds, toggleUserFavorite, toggleStaticFavorite, updateChinese } = useUserPhrases();
  const { language } = useLanguage();

  const userPhrase              = userPhrases.find((p) => p.id === phrase.id);
  const isUserPhrase            = !!userPhrase;
  const needsChineseTranslation = language === "zh" && !phrase.chineseText && isUserPhrase;
  const showChinese             = language === "zh" && !!phrase.chineseText;
  const displayText             = showChinese ? phrase.chineseText! : phrase.translatedText;
  const displayRead             = showChinese ? (phrase.pinyin ?? "") : phrase.romaji;
  const isGenerating            = needsChineseTranslation && translating.has(phrase.id);

  useEffect(() => {
    if (!needsChineseTranslation || translating.has(phrase.id)) return;
    translating.add(phrase.id);
    fetch("/api/translate-chinese", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText: phrase.sourceText }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.chineseText) updateChinese(phrase.id, data.chineseText, data.pinyin ?? "", data.chineseExplanation ?? "");
      })
      .catch(() => {})
      .finally(() => translating.delete(phrase.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsChineseTranslation, phrase.id]);

  const isFavorite   = isUserPhrase
    ? (userPhrase?.isFavorite ?? false)
    : staticFavoriteIds.includes(phrase.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUserPhrase) {
      toggleUserFavorite(phrase.id);
    } else {
      toggleStaticFavorite(phrase.id);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden">
      <Link href={`/phrase/${phrase.id}`} className="block px-5 pt-4 pb-3">
        {showCategory && (
          <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">
            {phrase.categoryId}
          </p>
        )}
        <p className="text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug mb-1">
          {phrase.sourceText}
        </p>
        {isGenerating ? (
          <p className="text-xs text-stone-300 dark:text-stone-600 italic mt-0.5">Chinees vertalen…</p>
        ) : (
          <>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-snug">{displayText}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 italic leading-snug mt-0.5">{displayRead}</p>
          </>
        )}
      </Link>

      <div className="flex items-center gap-3 px-5 pb-4">
        <AudioButton text={displayText} />

        <button
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "Verwijder favoriet" : "Markeer als favoriet"}
          className={`text-sm transition-colors ${
            isFavorite ? "text-amber-400" : "text-stone-200 dark:text-stone-700 hover:text-amber-300"
          }`}
        >
          {isFavorite ? "★" : "☆"}
        </button>

        <span className="ml-auto text-stone-200 dark:text-stone-700 text-xs">›</span>
      </div>
    </div>
  );
}
