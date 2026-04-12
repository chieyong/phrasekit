"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import CategoryCard from "@/components/cards/CategoryCard";
import PhraseCard from "@/components/cards/PhraseCard";
import { categories, phrases } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { userCategories, userPhrases, staticFavoriteIds } = useUserPhrases();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const userFavorieten   = userPhrases.filter((p) => p.isFavorite);
  const staticFavorieten = phrases.filter((p) => staticFavoriteIds.includes(p.id));
  const opgeslagenZinnen = [...userFavorieten, ...staticFavorieten].slice(0, 3);

  return (
    <div className="page-content">

      {/* ── Woordmerk + account ───────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
            PhrasePath
          </h1>
          <p className="text-xs text-stone-400 mt-0.5 tracking-wide">
            Japanse reiszinnen
          </p>
        </div>

        {/* Auth button */}
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm active:opacity-70 transition-opacity"
            >
              {user.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? ""}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="text-xs text-stone-500">Uitloggen</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm active:opacity-70 transition-opacity"
            >
              <span className="text-base">G</span>
              <span className="text-xs text-stone-700 font-medium">Inloggen</span>
            </button>
          )
        )}
      </div>

      {/* ── Vraag-knop ────────────────────────────────────────────── */}
      <div className="px-5 mb-8">
        {user ? (
          <Link href="/ask">
            <div className="bg-stone-900 rounded-2xl px-5 py-4 flex items-center gap-4 active:opacity-80 transition-opacity">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  Vraag iets in het Japans
                </p>
                <p className="text-stone-400 text-xs mt-0.5">
                  Typ wat je wilt zeggen
                </p>
              </div>
              <span className="text-stone-500 text-sm shrink-0">→</span>
            </div>
          </Link>
        ) : (
          <button onClick={signInWithGoogle} className="w-full text-left">
            <div className="bg-stone-900 rounded-2xl px-5 py-4 flex items-center gap-4 active:opacity-80 transition-opacity">
              <div className="flex-1">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  Vraag iets in het Japans
                  <span className="text-stone-500 text-xs border border-stone-700 rounded-md px-1.5 py-0.5">
                    🔒 Inloggen vereist
                  </span>
                </p>
                <p className="text-stone-500 text-xs mt-0.5">
                  Log in met Google om AI-vertalingen te gebruiken
                </p>
              </div>
              <span className="text-stone-600 text-sm shrink-0">→</span>
            </div>
          </button>
        )}
      </div>

      {/* ── Situaties ─────────────────────────────────────────────── */}
      <section className="px-5 mb-8">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">
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
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 active:opacity-70 transition-opacity"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium text-stone-800">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Opgeslagen zinnen ─────────────────────────────────────── */}
      {opgeslagenZinnen.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
              Favorieten
            </p>
            <Link
              href="/favorites"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
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
    </div>
  );
}
