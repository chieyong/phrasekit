"use client";

import { useState, useCallback } from "react";
import { Phrase, PhraseVariant } from "@/types";
import { AskNowResult } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserCategory {
  id: string;
  name: string;
  icon: string;
  isUserAdded: true;
}

// User phrases are fully compatible with the Phrase type
// We tag them with isUserAdded so we can distinguish them later if needed

const PHRASES_KEY = "phrasepath:user-phrases";
const CATEGORIES_KEY = "phrasepath:user-categories";

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadPhrases(): Phrase[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PHRASES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function loadCategories(): UserCategory[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CATEGORIES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function savePhrases(phrases: Phrase[]) {
  localStorage.setItem(PHRASES_KEY, JSON.stringify(phrases));
}

function saveCategories(categories: UserCategory[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserPhrases() {
  const [userPhrases, setUserPhrases] = useState<Phrase[]>(loadPhrases);
  const [userCategories, setUserCategories] = useState<UserCategory[]>(loadCategories);

  /** Save an AskNowResult into a given category */
  const addPhrase = useCallback(
    (categoryId: string, result: AskNowResult): Phrase => {
      const newPhrase: Phrase = {
        id: generateId("u"),
        categoryId,
        sourceText: result.sourceText,
        translatedText: result.translatedText,
        romaji: result.romaji,
        explanation: result.explanation,
        shortVersion: result.shortVersion as PhraseVariant | undefined,
        politeVersion: result.politeVersion as PhraseVariant | undefined,
        tags: [],
        isFavorite: false,
      };

      setUserPhrases((prev) => {
        const updated = [...prev, newPhrase];
        savePhrases(updated);
        return updated;
      });

      return newPhrase;
    },
    []
  );

  /** Remove a user-added phrase by ID */
  const removePhrase = useCallback((id: string) => {
    setUserPhrases((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePhrases(updated);
      return updated;
    });
  }, []);

  /** Create a new user-defined category */
  const addCategory = useCallback(
    (name: string, icon: string): UserCategory => {
      const newCat: UserCategory = {
        id: slugify(name) || generateId("cat"),
        name,
        icon,
        isUserAdded: true,
      };

      setUserCategories((prev) => {
        // Avoid duplicate IDs
        const id = prev.some((c) => c.id === newCat.id)
          ? generateId("cat")
          : newCat.id;
        const cat = { ...newCat, id };
        const updated = [...prev, cat];
        saveCategories(updated);
        return updated;
      });

      return newCat;
    },
    []
  );

  /** Find a user phrase by ID */
  const getUserPhraseById = useCallback(
    (id: string): Phrase | undefined => userPhrases.find((p) => p.id === id),
    [userPhrases]
  );

  /** All user phrases for a given category */
  const getUserPhrasesByCategory = useCallback(
    (categoryId: string): Phrase[] =>
      userPhrases.filter((p) => p.categoryId === categoryId),
    [userPhrases]
  );

  return {
    userPhrases,
    userCategories,
    addPhrase,
    removePhrase,
    addCategory,
    getUserPhraseById,
    getUserPhrasesByCategory,
  };
}
