"use client";

import { useSrs } from "@/hooks/useSrs";
import { useLanguage } from "@/contexts/LanguageContext";

interface TodayCardProps {
  onStart: () => void;
}

export default function TodayCard({ onStart }: TodayCardProps) {
  const { dueCount } = useSrs();
  const { language } = useLanguage();
  const due = dueCount(language);

  return (
    <button
      onClick={onStart}
      className="w-full flex items-center gap-4 bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 shadow-sm active:scale-[0.99] transition-all text-left"
    >
      <span className="w-11 h-11 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl shrink-0">
        {due > 0 ? "🔁" : "🌱"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Vandaag</p>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
          {due > 0
            ? `${due} ${due === 1 ? "kaart" : "kaarten"} te herhalen · nieuwe woorden erbij`
            : "Geen herhalingen open — leer nieuwe woorden"}
        </p>
      </div>
      <span className="ml-auto shrink-0 flex items-center gap-2">
        {due > 0 && (
          <span className="min-w-6 h-6 px-1.5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold flex items-center justify-center tabular-nums">
            {due}
          </span>
        )}
        <span className="text-stone-300 dark:text-stone-600 text-sm">›</span>
      </span>
    </button>
  );
}
