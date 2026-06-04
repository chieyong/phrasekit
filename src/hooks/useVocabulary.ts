"use client";

import { useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface VocabWord {
  japanese: string;
  romaji: string;
  dutch: string;
}

export function useVocabulary() {
  const { user } = useAuth();

  const getVocab = useCallback(async (categoryId: string): Promise<VocabWord[] | null> => {
    if (!user) return null;
    const snap = await getDoc(doc(db, "users", user.uid, "vocab", categoryId));
    if (!snap.exists()) return null;
    return (snap.data().words as VocabWord[]) ?? null;
  }, [user]);

  const saveVocab = useCallback(async (categoryId: string, words: VocabWord[]): Promise<void> => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "vocab", categoryId), {
      words,
      generatedAt: Date.now(),
    });
  }, [user]);

  return { getVocab, saveVocab };
}
