"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Phrase } from "@/types";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPhraseTranslation } from "@/utils/phrase";
import { getLanguage } from "@/data/languages";
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
  const { userPhrases, staticFavoriteIds, toggleUserFavorite, toggleStaticFavorite, updatePhraseTranslation } = useUserPhrases();
  const { language } = useLanguage();

  const userPhrase   = userPhrases.find((p) => p.id === phrase.id);
  const isUserPhrase = !!userPhrase;
  const current      = userPhrase ?? phrase;               // verse translations bij eigen zinnen
  const tr           = getPhraseTranslation(current, language);
  const needsTranslation = !tr && isUserPhrase;            // actieve taal ontbreekt → vertaal on-demand
  const tkey         = `${phrase.id}_${language}`;
  const isGenerating = needsTranslation && translating.has(tkey);
  const displayText  = tr?.text ?? "";
  const displayRead  = tr?.reading ?? "";

  useEffect(() => {
    if (!needsTranslation || translating.has(tkey)) return;
    translating.add(tkey);
    fetch("/api/translate-phrase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText: current.sourceText, language }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.text) updatePhraseTranslation(phrase.id, language, { text: data.text, reading: data.reading ?? "", explanation: data.explanation });
      })
      .catch(() => {})
      .finally(() => translating.delete(tkey));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsTranslation, phrase.id, language]);

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
          <p className="text-xs text-stone-300 dark:text-stone-600 italic mt-0.5">{getLanguage(language)?.label ?? "Vertalen"} vertalen…</p>
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
