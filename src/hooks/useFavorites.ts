"use client";

/**
 * useFavorites — lightweight client-side favorites store using React state + localStorage.
 *
 * Future: replace localStorage with a backend user profile / database,
 * e.g. Supabase, Firebase, or a custom API endpoint.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "phrasepath_favorites";
const RESULT_STORAGE_KEY = "phrasepath_saved_results";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedResults, setSavedResults] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));

      const storedResults = localStorage.getItem(RESULT_STORAGE_KEY);
      if (storedResults) setSavedResults(JSON.parse(storedResults));
    } catch {
      // Silent fail — use empty state
    }
  }, []);

  const isFavorite = useCallback(
    (phraseId: string) => favorites.includes(phraseId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (phraseId: string) => {
      setFavorites((prev) => {
        const next = prev.includes(phraseId)
          ? prev.filter((id) => id !== phraseId)
          : [...prev, phraseId];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const addFavoriteResult = useCallback((sourceText: string) => {
    setSavedResults((prev) => {
      if (prev.includes(sourceText)) return prev;
      const next = [...prev, sourceText];
      try {
        localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, savedResults, addFavoriteResult };
}
