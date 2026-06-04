"use client";

import { useState, useEffect, useCallback } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Difficulty = "basis" | "gemiddeld" | "gevorderd" | "expert";

export interface PracticeSentence {
  dutch: string;
  japanese: string;
  romaji: string;
}

export interface PracticeSet {
  id: string;
  name: string;
  sentences: PracticeSentence[];
  difficulty: Difficulty;
  categoryIds: string[];
  createdAt: number;
}

// ─── Auto-name helper ──────────────────────────────────────────────────────────

const DIFF_LABELS: Record<Difficulty, string> = {
  basis: "Basis", gemiddeld: "Gemiddeld", gevorderd: "Gevorderd", expert: "Expert",
};

export function generateSetName(categoryIcons: string[], difficulty: Difficulty): string {
  const icons = categoryIcons.slice(0, 3).join(" ");
  const date  = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  return `${icons} ${DIFF_LABELS[difficulty]} — ${date}`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function usePracticeSets() {
  const { user } = useAuth();
  const [sets,    setSets]    = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSets([]); setLoading(false); return; }
    const q = query(
      collection(db, "users", user.uid, "practiceSets"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setSets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeSet)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const saveAsNew = useCallback(async (
    sentences:     PracticeSentence[],
    difficulty:    Difficulty,
    categoryIds:   string[],
    categoryIcons: string[],
  ) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "practiceSets"), {
      name:        generateSetName(categoryIcons, difficulty),
      sentences,
      difficulty,
      categoryIds,
      createdAt:   Date.now(),
    });
  }, [user]);

  const addToExisting = useCallback(async (setId: string, newSentences: PracticeSentence[]) => {
    if (!user) return;
    const existing = sets.find((s) => s.id === setId);
    if (!existing) return;
    const knownDutch = new Set(existing.sentences.map((s) => s.dutch));
    const merged     = [...existing.sentences, ...newSentences.filter((s) => !knownDutch.has(s.dutch))];
    await updateDoc(doc(db, "users", user.uid, "practiceSets", setId), { sentences: merged });
  }, [user, sets]);

  const deleteSet = useCallback(async (setId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "practiceSets", setId));
  }, [user]);

  return { sets, loading, saveAsNew, addToExisting, deleteSet };
}
