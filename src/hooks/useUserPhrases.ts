"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Phrase, AskNowResult, GrammarExplanation } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserCategory {
  id: string;
  name: string;
  icon: string;
  isUserAdded: true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateAndSaveGrammar(
  uid: string,
  phraseId: string,
  japanese: string,
  romaji: string,
  english: string
): Promise<void> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ japanese, romaji, english }),
    });
    if (!res.ok) return;
    const grammarExplanation: GrammarExplanation = await res.json();
    await updateDoc(doc(db, "users", uid, "phrases", phraseId), { grammarExplanation });
  } catch {
    // Best-effort — silently ignore on failure
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserPhrases() {
  const { user } = useAuth();
  const [userPhrases,           setUserPhrases]           = useState<Phrase[]>([]);
  const [userCategories,        setUserCategories]        = useState<UserCategory[]>([]);
  const [staticFavoriteIds,     setStaticFavoriteIds]     = useState<string[]>([]);
  const [hiddenStaticPhraseIds, setHiddenStaticPhraseIds] = useState<string[]>([]);
  // loading stays true until the first Firestore snapshot arrives
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserPhrases([]);
      setUserCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const phrasesRef    = collection(db, "users", user.uid, "phrases");
    const categoriesRef = collection(db, "users", user.uid, "categories");
    const metaRef       = doc(db, "users", user.uid, "meta", "favorites");
    const hiddenRef     = doc(db, "users", user.uid, "meta", "hidden");

    let phrasesReady = false;
    let catsReady    = false;

    const unsubPhrases = onSnapshot(phrasesRef, (snap) => {
      setUserPhrases(
        snap.docs.map((d) => ({ ...d.data(), id: d.id } as Phrase))
      );
      phrasesReady = true;
      if (catsReady) setLoading(false);
    });

    const unsubCats = onSnapshot(categoriesRef, (snap) => {
      setUserCategories(
        snap.docs.map((d) => ({ ...d.data(), id: d.id } as UserCategory))
      );
      catsReady = true;
      if (phrasesReady) setLoading(false);
    });

    const unsubMeta = onSnapshot(metaRef, (snap) => {
      setStaticFavoriteIds((snap.data()?.ids as string[]) ?? []);
    });

    const unsubHidden = onSnapshot(hiddenRef, (snap) => {
      setHiddenStaticPhraseIds((snap.data()?.ids as string[]) ?? []);
    });

    return () => {
      unsubPhrases();
      unsubCats();
      unsubMeta();
      unsubHidden();
    };
  }, [user]);

  // ── Write helpers ──────────────────────────────────────────────────────────

  const addPhrase = async (
    categoryId: string,
    result: AskNowResult
  ): Promise<Phrase> => {
    if (!user) throw new Error("Niet ingelogd");

    // Firestore rejects undefined values — only include optional fields when defined
    const data: Omit<Phrase, "id"> = {
      categoryId,
      sourceText:     result.sourceText,
      translatedText: result.translatedText,
      romaji:         result.romaji,
      explanation:    result.explanation,
      tags:           [],
      isFavorite:     false,
      sortOrder:      Date.now(),
      ...(result.shortVersion  && { shortVersion:  result.shortVersion  }),
      ...(result.politeVersion && { politeVersion: result.politeVersion }),
    };

    const ref = await addDoc(
      collection(db, "users", user.uid, "phrases"),
      data
    );

    // Generate grammar in the background — don't block the save flow
    generateAndSaveGrammar(user.uid, ref.id, data.translatedText, data.romaji, data.sourceText);

    return { ...data, id: ref.id };
  };

  const addCategory = async (
    name: string,
    icon: string
  ): Promise<UserCategory> => {
    if (!user) throw new Error("Niet ingelogd");

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 32);
    const id = slug || `cat-${Date.now()}`;

    const category: UserCategory = { id, name, icon, isUserAdded: true };
    await setDoc(doc(db, "users", user.uid, "categories", id), category);
    return category;
  };

  const deletePhrase = async (id: string): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    await deleteDoc(doc(db, "users", user.uid, "phrases", id));
  };

  const movePhrase = async (id: string, newCategoryId: string): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    await updateDoc(doc(db, "users", user.uid, "phrases", id), {
      categoryId: newCategoryId,
    });
  };

  const deleteCategory = async (id: string): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    await deleteDoc(doc(db, "users", user.uid, "categories", id));
  };

  const toggleUserFavorite = async (id: string): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    const phrase = userPhrases.find((p) => p.id === id);
    if (!phrase) return;
    await updateDoc(doc(db, "users", user.uid, "phrases", id), {
      isFavorite: !phrase.isFavorite,
    });
  };

  const toggleStaticFavorite = async (id: string): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    const metaRef = doc(db, "users", user.uid, "meta", "favorites");
    const isFav   = staticFavoriteIds.includes(id);
    await setDoc(metaRef, {
      ids: isFav ? arrayRemove(id) : arrayUnion(id),
    }, { merge: true });
  };

  const hideStaticPhrase = async (id: string): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    const hiddenRef = doc(db, "users", user.uid, "meta", "hidden");
    await setDoc(hiddenRef, { ids: arrayUnion(id) }, { merge: true });
  };

  const updatePhraseSortOrder = async (id: string, sortOrder: number): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    await updateDoc(doc(db, "users", user.uid, "phrases", id), { sortOrder });
  };

  const updatePhraseGrammar = async (id: string, grammarExplanation: GrammarExplanation): Promise<void> => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "phrases", id), { grammarExplanation });
  };

  // ── Read helpers ───────────────────────────────────────────────────────────

  const getUserPhraseById = (id: string) =>
    userPhrases.find((p) => p.id === id);

  const getUserPhrasesByCategory = (categoryId: string) =>
    userPhrases
      .filter((p) => p.categoryId === categoryId)
      .sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));

  return {
    userPhrases,
    userCategories,
    staticFavoriteIds,
    hiddenStaticPhraseIds,
    loading,
    addPhrase,
    addCategory,
    deletePhrase,
    movePhrase,
    deleteCategory,
    toggleUserFavorite,
    toggleStaticFavorite,
    hideStaticPhrase,
    updatePhraseSortOrder,
    updatePhraseGrammar,
    getUserPhraseById,
    getUserPhrasesByCategory,
  };
}
