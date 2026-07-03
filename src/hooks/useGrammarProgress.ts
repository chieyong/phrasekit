"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

// Afvink-status van het grammatica-leerpad, per taal opgeslagen als één document
// met de IDs van afgeronde onderwerpen: users/{uid}/grammarProgress/{language}.

export function useGrammarProgress(language: string) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setCompleted([]); setLoading(false); return; }
    const ref = doc(db, "users", user.uid, "grammarProgress", language);
    const unsub = onSnapshot(ref, (snap) => {
      setCompleted(snap.exists() ? ((snap.data().completed as string[]) ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [user, language]);

  const completedSet = useMemo(() => new Set(completed), [completed]);
  const isDone = useCallback((topicId: string) => completedSet.has(topicId), [completedSet]);

  const toggle = useCallback(async (topicId: string) => {
    if (!user) return;
    const next = completedSet.has(topicId)
      ? completed.filter((id) => id !== topicId)
      : [...completed, topicId];
    await setDoc(
      doc(db, "users", user.uid, "grammarProgress", language),
      { completed: next, updatedAt: Date.now() },
      { merge: true },
    );
  }, [user, language, completed, completedSet]);

  return { completed, completedSet, isDone, toggle, loading };
}
