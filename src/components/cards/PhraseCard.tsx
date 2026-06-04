"use client";

import Link from "next/link";
import { Phrase } from "@/types";
import { useAudio } from "@/hooks/useAudio";
import { useUserPhrases } from "@/hooks/useUserPhrases";

interface PhraseCardProps {
  phrase: Phrase;
  showCategory?: boolean;
}

export default function PhraseCard({
  phrase,
  showCategory = false,
}: PhraseCardProps) {
  const { play, audioState } = useAudio();
  const { userPhrases, staticFavoriteIds, toggleUserFavorite, toggleStaticFavorite } = useUserPhrases();
  const isPlaying = audioState === "playing";

  const userPhrase   = userPhrases.find((p) => p.id === phrase.id);
  const isUserPhrase = !!userPhrase;
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
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-snug">{phrase.romaji}</p>
      </Link>

      <div className="flex items-center gap-3 px-5 pb-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!isPlaying) play(phrase.translatedText);
          }}
          aria-label={isPlaying ? "Playing…" : "Play pronunciation"}
          className={`text-xs font-medium transition-colors ${
            isPlaying ? "text-stone-500 dark:text-stone-400" : "text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400"
          }`}
        >
          {isPlaying ? "⏸ Bezig" : "🔊 Afspelen"}
        </button>

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
