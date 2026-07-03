"use client";

import { useDailyStats, DAILY_GOAL } from "@/hooks/useDailyStats";

interface ProgressCardProps {
  onOpen: () => void;
}

export default function ProgressCard({ onOpen }: ProgressCardProps) {
  const { currentStreak, todayCount, goalMet } = useDailyStats();
  const goalPct = Math.min(100, Math.round((todayCount / DAILY_GOAL) * 100));

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-5 py-3 shadow-sm active:scale-[0.99] transition-all text-left"
    >
      <span className="text-lg shrink-0">{currentStreak > 0 ? "🔥" : "🌙"}</span>
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 shrink-0 tabular-nums">
        {currentStreak}<span className="font-normal text-stone-400 dark:text-stone-500"> {currentStreak === 1 ? "dag" : "dagen"}</span>
      </p>

      <div className="flex-1 min-w-0 px-1">
        <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
          <div className={`h-full transition-all ${goalMet ? "bg-green-500" : "bg-stone-700 dark:bg-stone-300"}`} style={{ width: `${goalPct}%` }} />
        </div>
      </div>

      <p className="text-xs text-stone-400 dark:text-stone-500 shrink-0 tabular-nums">
        {goalMet ? "🎉" : `${todayCount}/${DAILY_GOAL}`}
      </p>
      <span className="text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
    </button>
  );
}
