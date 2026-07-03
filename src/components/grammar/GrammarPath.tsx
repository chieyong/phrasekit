"use client";

import { useEffect, useState } from "react";
import GrammarLessonBody from "@/components/grammar/GrammarLessonBody";
import { useGrammarModules, GrammarModuleDetail } from "@/hooks/useGrammarModules";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguage } from "@/data/languages";
import { getCurriculum, CurriculumTopic, CurriculumLevel } from "@/data/grammarCurriculum";

// Bouwstenen voor het vaste grammatica-leerpad. Samengesteld door GrammarHub,
// die de schil (segmented control + sluitknop) en de detail-navigatie beheert.

// ─── Lesweergave (detail) ───────────────────────────────────────────────────────

interface LessonViewProps {
  topic:    CurriculumTopic;
  level?:   CurriculumLevel;
  language: string;
  done:     boolean;
  onToggle: () => void;
  onBack:   () => void;
}

export function LessonView({ topic, level, language, done, onToggle, onBack }: LessonViewProps) {
  const { getModuleDetail, saveModuleDetail } = useGrammarModules();
  const [detail,  setDetail]  = useState<GrammarModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      // Zelfde cache als "Ontdekt in jouw zinnen": detail_{lang}_{naam}.
      const cached = await getModuleDetail(topic.naam, language).catch(() => null);
      if (cached && !cancelled) { setDetail(cached); setLoading(false); return; }

      try {
        const res = await fetch("/api/grammar-module-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleName: topic.naam, language, phrases: [] }),
        });
        const data: GrammarModuleDetail = await res.json();
        if (!res.ok || !data?.kernregel) throw new Error("empty");
        if (!cancelled) {
          setDetail(data);
          saveModuleDetail(data, language).catch(() => {});
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.naam, language]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm" aria-label="Terug">←</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 truncate">{topic.naam}</h2>
            <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">{topic.romaji}</span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{topic.tagline}</p>
        </div>
        {level && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${level.color}`}>{level.label}</span>}
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
          <p className="text-sm text-stone-400 dark:text-stone-500">Les laden…</p>
          <p className="text-xs text-stone-300 dark:text-stone-600">Dit kan even duren bij de eerste keer</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
          <p className="text-3xl">⚠️</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">Kon de les niet laden.</p>
          <button onClick={onBack} className="text-sm text-stone-400 underline">Terug</button>
        </div>
      )}

      {detail && !loading && <GrammarLessonBody detail={detail} matchingPhrases={[]} />}

      {detail && !loading && (
        <div className="shrink-0 px-5 pb-8 pt-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <button
            onClick={onToggle}
            className={`w-full rounded-xl py-3 text-sm font-medium active:scale-95 transition-all ${
              done
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
            }`}
          >
            {done ? "✓ Afgerond — tik om te ontvinken" : "Als afgerond markeren"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Leerpad-lijst (body, zonder schil) ─────────────────────────────────────────

export function CurriculumList({ onOpen }: { onOpen: (t: CurriculumTopic) => void }) {
  const { language } = useLanguage();
  const curriculum   = getCurriculum(language);
  const { completedSet } = useGrammarProgress(language);

  const langLabel = getLanguage(language)?.label ?? "";
  const topics    = curriculum?.topics ?? [];

  if (!curriculum) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
        <p className="text-3xl">🚧</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Er is nog geen vast leerpad voor het {langLabel}. Bekijk zolang &ldquo;Ontdekt in jouw zinnen&rdquo;.
        </p>
      </div>
    );
  }

  const doneTotal = topics.filter((t) => completedSet.has(t.id)).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-12">
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 mb-4">
        {curriculum.framework} · {doneTotal}/{topics.length} afgerond
      </p>

      {curriculum.levels.map((level) => {
        const levelTopics = topics.filter((t) => t.niveau === level.id);
        if (!levelTopics.length) return null;
        const levelDone = levelTopics.filter((t) => completedSet.has(t.id)).length;
        const pct = Math.round((levelDone / levelTopics.length) * 100);

        return (
          <section key={level.id} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${level.color}`}>{level.label}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500">{levelDone}/{levelTopics.length} afgerond</span>
              </div>
              <span className="text-xs font-medium text-stone-400 dark:text-stone-500 tabular-nums">{pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden mb-3">
              <div className="h-full bg-stone-700 dark:bg-stone-300 transition-all" style={{ width: `${pct}%` }} />
            </div>

            <div className="flex flex-col gap-1.5">
              {levelTopics.map((topic) => {
                const done = completedSet.has(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => onOpen(topic)}
                    className="w-full text-left bg-white dark:bg-stone-900 rounded-2xl px-4 py-3.5 shadow-sm active:opacity-70 transition-opacity flex items-center gap-3"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] transition-colors ${
                      done ? "bg-green-500 text-white" : "border-2 border-stone-200 dark:border-stone-700 text-transparent"
                    }`}>✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{topic.naam}</p>
                        <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">{topic.romaji}</span>
                      </div>
                      <p className="text-xs text-stone-400 dark:text-stone-500 leading-snug truncate">{topic.tagline}</p>
                    </div>
                    <span className="text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
