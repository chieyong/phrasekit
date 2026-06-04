"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Header from "@/components/layout/Header";
import PhraseCard from "@/components/cards/PhraseCard";
import { phrases, categories } from "@/data/mockData";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import Link from "next/link";

export default function OpgeslagenPagina() {
  const { favorites } = useFavorites();
  const { userPhrases, userCategories, hiddenStaticPhraseIds } = useUserPhrases();
  const [geselecteerdeCategorie, setGeselecteerdeCategorie] = useState<string | null>(null);

  // Static phrases saved via useFavorites (localStorage), minus hidden ones
  const staticFavorites = phrases.filter(
    (p) => (favorites.includes(p.id) || p.isFavorite) && !hiddenStaticPhraseIds.includes(p.id)
  );

  // User phrases saved via Firestore isFavorite field
  const userFavorites = userPhrases.filter((p) => p.isFavorite);

  const opgeslagenZinnen = [...staticFavorites, ...userFavorites];

  const gefilterd = geselecteerdeCategorie
    ? opgeslagenZinnen.filter((p) => p.categoryId === geselecteerdeCategorie)
    : opgeslagenZinnen;

  // Merge static + user categories that have saved phrases
  const allCategories = [...categories, ...userCategories];
  const actieveCategorieen = allCategories.filter((cat) =>
    opgeslagenZinnen.some((p) => p.categoryId === cat.id)
  );

  return (
    <div className="page-content">
      <Header
        title="★ Opgeslagen zinnen"
        subtitle={`${opgeslagenZinnen.length} opgeslagen`}
      />

      {opgeslagenZinnen.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <span className="text-5xl mb-4">☆</span>
          <h2 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">
            Nog geen opgeslagen zinnen
          </h2>
          <p className="text-sm text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
            Tik op de ster bij een zin om deze hier bij de hand te houden.
          </p>
          <Link
            href="/"
            className="bg-stone-900 text-white rounded-2xl px-5 py-3 text-sm font-medium active:scale-95 transition-transform"
          >
            Bekijk situaties
          </Link>
        </div>
      ) : (
        <>
          {/* ── Categoriefilter ───────────────────────────────────── */}
          {actieveCategorieen.length > 1 && (
            <div className="flex gap-2 px-5 pt-4 pb-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setGeselecteerdeCategorie(null)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  geselecteerdeCategorie === null
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                Alles
              </button>
              {actieveCategorieen.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setGeselecteerdeCategorie(
                      geselecteerdeCategorie === cat.id ? null : cat.id
                    )
                  }
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    geselecteerdeCategorie === cat.id
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Zinnenlijst ───────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5 px-5 pt-4">
            {gefilterd.length === 0 ? (
              <p className="text-center text-stone-400 dark:text-stone-500 text-sm py-8">
                Geen opgeslagen zinnen in deze categorie.
              </p>
            ) : (
              gefilterd.map((phrase) => (
                <PhraseCard key={phrase.id} phrase={phrase} showCategory />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
