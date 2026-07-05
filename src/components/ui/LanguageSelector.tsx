"use client";

import { useState, useRef, useEffect } from "react";
import { ENABLED_LANGUAGES, getLanguage, isDemoLang, DEFAULT_LANG } from "@/data/languages";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

// Compacte taal-kiezer: één knop met de huidige taal, tik opent een lijstje.
// Schaalt naar veel talen zonder de header vol te zetten.
export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Zonder inloggen zijn alleen de demo-talen bruikbaar. Staat er nog een
  // vergrendelde taal ingesteld (bijv. uit een vorige sessie), val dan terug.
  const demoOnly = !loading && !user;
  useEffect(() => {
    if (demoOnly && !isDemoLang(language)) setLanguage(DEFAULT_LANG);
  }, [demoOnly, language, setLanguage]);

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
            const locked = demoOnly && !isDemoLang(l.code);
            if (locked) {
              return (
                <div
                  key={l.code}
                  title="Log in om deze taal te gebruiken"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-stone-300 dark:text-stone-600 cursor-not-allowed select-none"
                >
                  <span className="text-sm grayscale opacity-60">{l.flag}</span>
                  <span className="flex-1">{l.label}</span>
                  <span className="text-[10px]">🔒</span>
                </div>
              );
            }
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
          {demoOnly && (
            <p className="px-3 pt-1.5 pb-1 mt-1 border-t border-stone-100 dark:border-stone-700 text-[10px] leading-snug text-stone-400 dark:text-stone-500">
              🔒 Log in voor alle talen
            </p>
          )}
        </div>
      )}
    </div>
  );
}
