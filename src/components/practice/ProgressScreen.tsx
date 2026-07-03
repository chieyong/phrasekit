"use client";

import { useSrs } from "@/hooks/useSrs";
import { useDailyStats, DAILY_GOAL } from "@/hooks/useDailyStats";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguage } from "@/data/languages";
import { getCurriculum } from "@/data/grammarCurriculum";

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
      <div className="h-full bg-stone-700 dark:bg-stone-300 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export default function ProgressScreen({ onClose }: { onClose: () => void }) {
  const { language }        = useLanguage();
  const { masteryStats }    = useSrs();
  const { currentStreak, longest, todayCount, goalMet } = useDailyStats();
  const { completedSet }    = useGrammarProgress(language);

  const langLabel  = getLanguage(language)?.label ?? "";
  const words      = masteryStats(language);
  const curriculum = getCurriculum(language);
  const topics     = curriculum?.topics ?? [];

  const wordPct = words.total > 0 ? Math.round((words.mastered / words.total) * 100) : 0;
  const goalPct = Math.round((todayCount / DAILY_GOAL) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Voortgang</h2>
          <p className="text-xs text-stone-400 dark:text-stone-500">{langLabel}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-12 space-y-4">

        {/* Streak + dagdoel */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-5 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{currentStreak > 0 ? "🔥" : "🌙"}</span>
            <div className="flex-1">
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 leading-none">
                {currentStreak} <span className="text-sm font-medium text-stone-400 dark:text-stone-500">{currentStreak === 1 ? "dag" : "dagen"} op rij</span>
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Langste reeks: {longest} {longest === 1 ? "dag" : "dagen"}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Dagdoel {goalMet && <span className="text-green-500">· gehaald 🎉</span>}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">{todayCount}/{DAILY_GOAL}</p>
            </div>
            <Bar pct={goalPct} />
          </div>
        </div>

        {/* Woorden beheerst */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-5 shadow-sm">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Woorden beheerst</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
              {words.mastered} / {words.total}
            </p>
          </div>
          <Bar pct={wordPct} />
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 leading-relaxed">
            {words.total === 0
              ? "Nog geen woorden geoefend. Start een sessie via Vandaag."
              : `Een woord telt als beheerst na een paar geslaagde herhalingen (interval van 16+ dagen).`}
          </p>
        </div>

        {/* Grammatica-leerpad */}
        {curriculum && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-5 shadow-sm">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">Grammatica-leerpad</p>
            <div className="space-y-3">
              {curriculum.levels.map((level) => {
                const lvl  = topics.filter((t) => t.niveau === level.id);
                if (!lvl.length) return null;
                const done = lvl.filter((t) => completedSet.has(t.id)).length;
                const pct  = Math.round((done / lvl.length) * 100);
                return (
                  <div key={level.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{level.label}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">{done}/{lvl.length} · {pct}%</p>
                    </div>
                    <Bar pct={pct} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
