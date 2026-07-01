"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LangCode, DEFAULT_LANG, isLangCode } from "@/data/languages";

export type AppLanguage = LangCode;

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (l: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANG,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANG);

  useEffect(() => {
    const saved = localStorage.getItem("phrasekit-language");
    if (saved && isLangCode(saved)) setLanguageState(saved);
  }, []);

  const setLanguage = (l: AppLanguage) => {
    setLanguageState(l);
    localStorage.setItem("phrasekit-language", l);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
