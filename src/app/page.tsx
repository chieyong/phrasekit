"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import CategoryCard from "@/components/cards/CategoryCard";
import PhraseCard from "@/components/cards/PhraseCard";
import InlineTranslator from "@/components/ui/InlineTranslator";
import CategoryPicker from "@/components/ui/CategoryPicker";
import { categories, phrases } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { userCategories, userPhrases, staticFavoriteIds, addCategory } = useUserPhrases();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const userFavorieten   = userPhrases.filter((p) => p.isFavorite);
  const staticFavorieten = phrases.filter((p) => staticFavoriteIds.includes(p.id));
  const opgeslagenZinnen = [...userFavorieten, ...staticFavorieten].slice(0, 3);

  return (
    <div className="page-content">

      {/* ── Woordmerk + account ───────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            PhraseKit <span className="text-stone-400 dark:text-stone-500 font-normal">Japan</span>
          </h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 tracking-wide">
            Japanse reiszinnen
          </p>
        </div>

        {/* Auth button */}
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-xl px-3 py-2 shadow-sm active:opacity-70 transition-opacity"
            >
              {user.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? ""}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="text-xs text-stone-500 dark:text-stone-400">Uitloggen</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-xl px-3 py-2 shadow-sm active:opacity-70 transition-opacity"
            >
              <span className="text-base">G</span>
              <span className="text-xs text-stone-700 dark:text-stone-200 font-medium">Inloggen</span>
            </button>
          )
        )}
      </div>

      {/* ── Inline vertaler ───────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <InlineTranslator />
      </div>

      {/* ── Situaties ─────────────────────────────────────────────── */}
      <section className="px-5 mb-8">
        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
          Situaties
        </p>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
          {userCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 py-3.5 active:opacity-70 transition-opacity"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{cat.name}</span>
            </Link>
          ))}

          {user && (
            <button
              onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-3 bg-white/60 dark:bg-stone-900/60 border border-dashed border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 active:opacity-70 transition-opacity text-left w-full"
            >
              <span className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 text-base shrink-0">+</span>
              <span className="text-sm font-medium text-stone-400 dark:text-stone-500">Nieuwe categorie aanmaken</span>
            </button>
          )}
        </div>
      </section>

      {showNewCategory && (
        <CategoryPicker
          userCategories={userCategories}
          onSelect={() => setShowNewCategory(false)}
          onAddCategory={addCategory}
          onClose={() => setShowNewCategory(false)}
          initialMode="new"
          title="Nieuwe categorie"
          subtitle="Geef je categorie een naam en icoon"
        />
      )}

      {/* ── Opgeslagen zinnen ─────────────────────────────────────── */}
      {opgeslagenZinnen.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Favorieten
            </p>
            <Link
              href="/favorites"
              className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              Bekijk alles
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {opgeslagenZinnen.map((phrase) => (
              <PhraseCard key={phrase.id} phrase={phrase} showCategory />
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="px-5 py-8 mt-4 flex items-center justify-center">
        <p className="text-[10px] text-stone-300 dark:text-stone-700 tracking-widest uppercase">
          Gemaakt door <span className="font-semibold text-stone-400 dark:text-stone-500">VizCraft</span>
        </p>
      </div>
    </div>
  );
}
