"use client";

import { useAudio } from "@/hooks/useAudio";

interface AudioButtonProps {
  text: string;
  className?: string;
}

export default function AudioButton({ text, className }: AudioButtonProps) {
  const { play, audioState } = useAudio();
  const isPlaying = audioState === "playing";

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
