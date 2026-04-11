"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import PhraseCard from "@/components/cards/PhraseCard";
import SearchBar from "@/components/ui/SearchBar";
import { getCategoryById, getPhrasesByCategory } from "@/data/mockData";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function CategoriePagina({ params }: CategoryPageProps) {
  const { id } = use(params);
  const category = getCategoryById(id);
  const alleZinnen = getPhrasesByCategory(id);

  const [query, setQuery] = useState("");

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

      <div className="px-5 pt-4 pb-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={`Zoek in ${category.name.toLowerCase()}…`}
        />
      </div>

      <div className="px-5 pt-3 flex flex-col gap-1.5">
        {gefilterd.length === 0 ? (
          <div className="text-center py-12">
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
          </div>
        ) : (
          gefilterd.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))
        )}
      </div>
    </div>
  );
}
