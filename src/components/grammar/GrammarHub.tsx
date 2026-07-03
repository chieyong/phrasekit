"use client";

import { useState } from "react";
import { CurriculumList, LessonView } from "@/components/grammar/GrammarPath";
import { DiscoveredModulesList, ModuleDetailScreen } from "@/components/grammar/GrammarScreen";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLanguage } from "@/data/languages";
import { getCurriculum, CurriculumTopic } from "@/data/grammarCurriculum";
import { GrammarModule } from "@/hooks/useGrammarModules";
import { Phrase } from "@/types";

// Eén ingang voor grammatica: het vaste leerpad én de modules die uit je eigen
// zinnen ontdekt zijn. De hub beheert het segmented control en de detail-navigatie.

type Tab = "leerpad" | "ontdekt";

export default function GrammarHub({ allPhrases, onClose }: { allPhrases: Phrase[]; onClose: () => void }) {
  const { language }     = useLanguage();
  const curriculum       = getCurriculum(language);
  const { isDone, toggle } = useGrammarProgress(language);

  const [tab,     setTab]     = useState<Tab>("leerpad");
  const [topic,   setTopic]   = useState<CurriculumTopic | null>(null);
  const [module,  setModule]  = useState<GrammarModule | null>(null);

  const langLabel = getLanguage(language)?.label ?? "";
  const levelMap  = new Map((curriculum?.levels ?? []).map((l) => [l.id, l] as const));

  // ── Detail-weergaven ────────────────────────────────────────────────────────
  if (topic) {
    return (
      <LessonView
        topic={topic}
        level={levelMap.get(topic.niveau)}
        language={language}
        done={isDone(topic.id)}
        onToggle={() => toggle(topic.id)}
        onBack={() => setTopic(null)}
      />
    );
  }

  if (module) {
    return (
      <ModuleDetailScreen
        module={module}
        userPhrases={allPhrases}
        language={language}
        onBack={() => setModule(null)}
      />
    );
  }

  // ── Hub ─────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Grammatica</h2>
          <p className="text-xs text-stone-400 dark:text-stone-500">{langLabel}</p>
        </div>
      </div>

      {/* Segmented control */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
          {([["leerpad", "Leerpad"], ["ontdekt", "Ontdekt in jouw zinnen"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === id
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "leerpad"
        ? <CurriculumList onOpen={setTopic} />
        : <DiscoveredModulesList allPhrases={allPhrases} onOpen={setModule} />}
    </div>
  );
}
