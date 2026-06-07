"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type AppLanguage = "ja" | "zh";

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (l: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "ja",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("ja");

  useEffect(() => {
    const saved = localStorage.getItem("phrasekit-language") as AppLanguage | null;
    if (saved === "ja" || saved === "zh") setLanguageState(saved);
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
