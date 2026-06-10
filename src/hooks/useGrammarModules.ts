"use client";

import { useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface GrammarModule {
  naam: string;
  romaji: string;
  tagline: string;
  niveau: "basis" | "gemiddeld" | "gevorderd";
  zinIds: string[];
}

export interface GrammarModuleDetail {
  naam: string;
  tagline: string;
  niveau: "basis" | "gemiddeld" | "gevorderd";
  kernregel: string;
  patroon: string;
  uitleg: string;
  opbouw: { element: string; rol: string; voorbeeld: string }[];
  tips: string[];
  veelgemaaktefouten: string[];
  extraVoorbeelden: { japanese: string; romaji: string; dutch: string }[];
}

const safeId = (naam: string) => naam.replace(/\//g, "-").replace(/\s+/g, "_").slice(0, 80);

export function useGrammarModules() {
  const { user } = useAuth();

  const getModules = useCallback(async (language = "ja"): Promise<{ modules: GrammarModule[]; phraseCount: number } | null> => {
    if (!user) return null;
    const snap = await getDoc(doc(db, "users", user.uid, "grammarModules", `index_${language}`));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { modules: (data.modules as GrammarModule[]) ?? [], phraseCount: data.phraseCount ?? 0 };
  }, [user]);

  const saveModules = useCallback(async (modules: GrammarModule[], phraseCount: number, language = "ja"): Promise<void> => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "grammarModules", `index_${language}`), {
      modules,
      phraseCount,
      generatedAt: Date.now(),
    });
  }, [user]);

  const getModuleDetail = useCallback(async (naam: string, language = "ja"): Promise<GrammarModuleDetail | null> => {
    if (!user) return null;
    const snap = await getDoc(doc(db, "users", user.uid, "grammarModules", `detail_${language}_${safeId(naam)}`));
    if (!snap.exists()) return null;
    return snap.data() as GrammarModuleDetail;
  }, [user]);

  const saveModuleDetail = useCallback(async (detail: GrammarModuleDetail, language = "ja"): Promise<void> => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "grammarModules", `detail_${language}_${safeId(detail.naam)}`), {
      ...detail,
      generatedAt: Date.now(),
    });
  }, [user]);

  return { getModules, saveModules, getModuleDetail, saveModuleDetail };
}
