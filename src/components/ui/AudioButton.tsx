"use client";

import { useAudio } from "@/hooks/useAudio";

interface AudioButtonProps {
  text: string;
  className?: string;
  iconOnly?: boolean;
}

export default function AudioButton({ text, className, iconOnly }: AudioButtonProps) {
  const { play, audioState } = useAudio();
  const isPlaying = audioState === "playing";

  if (iconOnly) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); if (!isPlaying) play(text); }}
        aria-label={isPlaying ? "Bezig met afspelen" : "Afspelen"}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm transition-all active:scale-95 ${
          isPlaying ? "text-stone-400 dark:text-stone-500" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
        } ${className ?? ""}`}
      >
        {isPlaying ? "⏸" : "🔊"}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!isPlaying) play(text); }}
      aria-label={isPlaying ? "Bezig met afspelen" : "Afspelen"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
        isPlaying
          ? "bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500"
          : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
      } ${className ?? ""}`}
    >
      <span>{isPlaying ? "⏸" : "🔊"}</span>
      <span>{isPlaying ? "Bezig…" : "Afspelen"}</span>
    </button>
  );
}
