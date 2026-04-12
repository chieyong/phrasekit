"use client";

export const dynamic = "force-dynamic";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import PhraseCard from "@/components/cards/PhraseCard";
import SearchBar from "@/components/ui/SearchBar";
import { getCategoryById, getPhrasesByCategory } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function CategoriePagina({ params }: CategoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { getUserPhrasesByCategory, userCategories, deleteCategory, loading: userLoading } = useUserPhrases();

  const staticCategory = getCategoryById(id);
  const userCategory = userCategories.find((c) => c.id === id);
  const category = staticCategory ?? (userCategory ? { ...userCategory, description: "", color: "", accentColor: "" } : null);
  const isUserCategory = !!userCategory && !staticCategory;

  const alleZinnen = [
    ...getPhrasesByCategory(id),
    ...getUserPhrasesByCategory(id),
  ];

  const [query,    setQuery]    = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteCategory = async () => {
    if (!confirm(`Categorie "${category?.name}" verwijderen?`)) return;
    setDeleting(true);
    try {
      await deleteCategory(id);
      router.back();
    } finally {
      setDeleting(false);
    }
  };

  // Wait for Firestore to load before deciding the category doesn't exist
  if (!category && userLoading) {
    return (
      <div className="page-content flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
      </div>
    );
  }

  if (!category) notFound();

  const gefilterd = query.trim()
    ? alleZinnen.filter(
        (p) =>
          p.sourceText.toLowerCase().includes(query.toLowerCase()) ||
          p.translatedText.includes(query) ||
          p.romaji.toLowerCase().includes(query.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : alleZinnen;

  return (
    <div className="page-content">
      <Header
        title={`${category.icon} ${category.name}`}
        subtitle={category.description}
        showBack
      />

      <div className="px-5 pt-4 pb-2 flex gap-2">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={`Zoek in ${category.name.toLowerCase()}…`}
          />
        </div>
        <Link
          href={`/ask?categorie=${id}`}
          className="shrink-0 flex items-center gap-1.5 bg-stone-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium active:opacity-80 transition-opacity"
        >
          <span>✦</span>
          <span>Vraag</span>
        </Link>
      </div>

      <div className="px-5 pt-3 flex flex-col gap-1.5">
        {gefilterd.length === 0 ? (
          <div className="text-center py-12">
            {query ? (
              <>
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-stone-500 text-sm">
                  Geen zinnen gevonden voor "{query}"
                </p>
                <button
                  onClick={() => setQuery("")}
                  className="mt-3 text-sm text-stone-400 underline"
                >
                  Zoekopdracht wissen
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">📂</p>
                <p className="text-stone-500 text-sm mb-1">
                  Deze categorie is leeg.
                </p>
                <p className="text-stone-400 text-xs">
                  Gebruik de Vraag-knop om een zin toe te voegen.
                </p>
              </>
            )}
          </div>
        ) : (
          gefilterd.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))
        )}
      </div>

      {/* Verwijder categorie — alleen zichtbaar voor lege gebruikerscategorieën */}
      {isUserCategory && alleZinnen.length === 0 && !query && (
        <div className="px-5 pb-8 pt-4">
          <button
            onClick={handleDeleteCategory}
            disabled={deleting}
            className="w-full py-3 text-xs text-red-400 hover:text-red-600 transition-colors text-center border border-red-100 rounded-2xl disabled:opacity-40"
          >
            {deleting ? "Verwijderen…" : "🗑 Categorie verwijderen"}
          </button>
        </div>
      )}
    </div>
  );
}
