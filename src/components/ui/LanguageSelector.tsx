"use client";

import { ENABLED_LANGUAGES } from "@/data/languages";
import { useLanguage } from "@/contexts/LanguageContext";

// Taal-kiezer gevoed door het register — schaalt naar N talen (rij van vlag-chips).
export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
      {ENABLED_LANGUAGES.map((l) => {
        const active = language === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            aria-label={l.label}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all active:scale-95 ${
              active ? "bg-white dark:bg-stone-700 shadow-sm" : "opacity-50 hover:opacity-80"
            }`}
          >
            <span className="text-sm">{l.flag}</span>
            {!compact && (
              <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                {l.code.toUpperCase()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
