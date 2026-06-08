"use client";

import { useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface VocabWord {
  japanese: string;
  romaji: string;
  dutch: string;
  type?: "noun" | "verb" | "adjective";
}

export function useVocabulary() {
  const { user } = useAuth();

  // Cache key includes language so Japanese and Chinese vocab are stored separately.
  // Falls back to legacy key (no language suffix) for backward compat.
  const getVocab = useCallback(async (categoryId: string, language = "ja"): Promise<VocabWord[] | null> => {
    if (!user) return null;
    const langKey    = `${categoryId}_${language}`;
    const legacyKey  = categoryId;

    let snap = await getDoc(doc(db, "users", user.uid, "vocab", langKey));
    if (!snap.exists() && language === "ja") {
      snap = await getDoc(doc(db, "users", user.uid, "vocab", legacyKey));
    }
    if (!snap.exists()) return null;
    return (snap.data().words as VocabWord[]) ?? null;
  }, [user]);

  const saveVocab = useCallback(async (categoryId: string, words: VocabWord[], language = "ja"): Promise<void> => {
    if (!user) return;
    const key = `${categoryId}_${language}`;
    await setDoc(doc(db, "users", user.uid, "vocab", key), {
      words,
      generatedAt: Date.now(),
    });
  }, [user]);

  return { getVocab, saveVocab };
}
