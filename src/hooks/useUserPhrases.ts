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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Phrase, AskNowResult } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserCategory {
  id: string;
  name: string;
  icon: string;
  isUserAdded: true;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserPhrases() {
  const { user } = useAuth();
  const [userPhrases,    setUserPhrases]    = useState<Phrase[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
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

    return () => {
      unsubPhrases();
      unsubCats();
    };
  }, [user]);

  // ── Write helpers ──────────────────────────────────────────────────────────

  const addPhrase = async (
    categoryId: string,
    result: AskNowResult
  ): Promise<Phrase> => {
    if (!user) throw new Error("Niet ingelogd");

    const data: Omit<Phrase, "id"> = {
      categoryId,
      sourceText:     result.sourceText,
      translatedText: result.translatedText,
      romaji:         result.romaji,
      explanation:    result.explanation,
      shortVersion:   result.shortVersion,
      politeVersion:  result.politeVersion,
      tags:           [],
      isFavorite:     false,
    };

    const ref = await addDoc(
      collection(db, "users", user.uid, "phrases"),
      data
    );
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

  const toggleUserFavorite = async (id: string): Promise<void> => {
    if (!user) throw new Error("Niet ingelogd");
    const phrase = userPhrases.find((p) => p.id === id);
    if (!phrase) return;
    await updateDoc(doc(db, "users", user.uid, "phrases", id), {
      isFavorite: !phrase.isFavorite,
    });
  };

  // ── Read helpers ───────────────────────────────────────────────────────────

  const getUserPhraseById = (id: string) =>
    userPhrases.find((p) => p.id === id);

  const getUserPhrasesByCategory = (categoryId: string) =>
    userPhrases.filter((p) => p.categoryId === categoryId);

  return {
    userPhrases,
    userCategories,
    loading,
    addPhrase,
    addCategory,
    deletePhrase,
    toggleUserFavorite,
    getUserPhraseById,
    getUserPhrasesByCategory,
  };
}
