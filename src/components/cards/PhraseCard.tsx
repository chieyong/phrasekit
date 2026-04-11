"use client";

import Link from "next/link";
import { Phrase } from "@/types";
import { useFavorites } from "@/hooks/useFavorites";
import { useAudio } from "@/hooks/useAudio";

interface PhraseCardProps {
  phrase: Phrase;
  showCategory?: boolean;
}

export default function PhraseCard({
  phrase,
  showCategory = false,
}: PhraseCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { play, audioState } = useAudio();

  const favorited = isFavorite(phrase.id);
  const isPlaying = audioState === "playing";

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Tappable area → phrase detail */}
      <Link href={`/phrase/${phrase.id}`} className="block px-5 pt-4 pb-3">
        {showCategory && (
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">
            {phrase.categoryId}
          </p>
        )}

        {/* English source — small, muted label */}
        <p className="text-xs text-stone-400 mb-1.5 leading-snug">
          {phrase.sourceText}
        </p>

        {/* Japanese — the hero */}
        <p className="text-2xl font-semibold text-stone-900 leading-snug">
          {phrase.translatedText}
        </p>

        {/* Romaji — supporting */}
        <p className="text-sm text-stone-400 italic mt-1">{phrase.romaji}</p>
      </Link>

      {/* Action strip */}
      <div className="flex items-center gap-3 px-5 pb-4">
        <button
          onClick={() => toggleFavorite(phrase.id)}
          aria-label={favorited ? "Remove from favorites" : "Save phrase"}
          className={`text-xs font-medium transition-colors ${
            favorited ? "text-amber-500" : "text-stone-300 hover:text-stone-500"
          }`}
        >
          {favorited ? "★ Opgeslagen" : "☆ Opslaan"}
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            if (!isPlaying) play(phrase.translatedText);
          }}
          aria-label={isPlaying ? "Playing…" : "Play pronunciation"}
          className={`text-xs font-medium transition-colors ${
            isPlaying ? "text-stone-500" : "text-stone-300 hover:text-stone-500"
          }`}
        >
          {isPlaying ? "⏸ Bezig" : "🔊 Afspelen"}
        </button>

        <span className="ml-auto text-stone-200 text-xs">›</span>
      </div>
    </div>
  );
}
