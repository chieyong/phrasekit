"use client";

import { useState, useRef, useEffect } from "react";
import { ENABLED_LANGUAGES, getLanguage } from "@/data/languages";
import { useLanguage } from "@/contexts/LanguageContext";

// Compacte taal-kiezer: één knop met de huidige taal, tik opent een lijstje.
// Schaalt naar veel talen zonder de header vol te zetten.
export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const current = getLanguage(language);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Taal kiezen"
        className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 active:scale-95 transition-all"
      >
        <span>{current?.label ?? language}</span>
        <span className={`text-[9px] text-stone-400 dark:text-stone-500 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 z-50 min-w-[9rem] bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 py-1 overflow-hidden">
          {ENABLED_LANGUAGES.map((l) => {
            const active = language === l.code;
            return (
              <button
                key={l.code}
                onClick={() => { setLanguage(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                  active
                    ? "bg-stone-50 dark:bg-stone-700/50 font-semibold text-stone-900 dark:text-stone-100"
                    : "text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                }`}
              >
                <span className="text-sm">{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {active && <span className="text-stone-400 dark:text-stone-500">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
