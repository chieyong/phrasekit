"use client";

export const dynamic = "force-dynamic";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Header from "@/components/layout/Header";
import PhraseCard from "@/components/cards/PhraseCard";
import { getCategoryById, getPhrasesByCategory } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { Phrase } from "@/types";
import InlineTranslator from "@/components/ui/InlineTranslator";

// ─── Sorteerbare kaart (alleen in bewerkingsmodus) ─────────────────────────────

function SortableCard({ phrase }: { phrase: Phrase }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: phrase.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex items-stretch gap-2"
    >
      <div className="flex-1 min-w-0">
        <PhraseCard phrase={phrase} />
      </div>
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 w-8 flex items-center justify-center text-stone-300 hover:text-stone-500 active:text-stone-700 transition-colors touch-none cursor-grab active:cursor-grabbing"
        aria-label="Versleep om te herordenen"
      >
        <span className="text-base leading-none select-none">⠿</span>
      </button>
    </div>
  );
}

// ─── Pagina ────────────────────────────────────────────────────────────────────

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function CategoriePagina({ params }: CategoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getUserPhrasesByCategory,
    userCategories,
    deleteCategory,
    hideStaticPhrase,
    hiddenStaticPhraseIds,
    updatePhraseSortOrder,
    loading: userLoading,
  } = useUserPhrases();

  const staticCategory = getCategoryById(id);
  const userCategory = userCategories.find((c) => c.id === id);
  const category = staticCategory ?? (userCategory ? { ...userCategory, description: "", color: "", accentColor: "" } : null);
  const isUserCategory = !!userCategory && !staticCategory;

  const staticZinnen = getPhrasesByCategory(id).filter(
    (p) => !hiddenStaticPhraseIds.includes(p.id)
  );
  const userZinnen = getUserPhrasesByCategory(id);
  const alleZinnen = [...staticZinnen, ...userZinnen];

  const [query,    setQuery]    = useState("");
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hiding,   setHiding]   = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = userZinnen.findIndex((p) => p.id === active.id);
    const newIndex = userZinnen.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(userZinnen, oldIndex, newIndex);

    await Promise.all(
      reordered.map((phrase, idx) =>
        updatePhraseSortOrder(phrase.id, (idx + 1) * 1000)
      )
    );
  };

  const handleHideStatic = async (phraseId: string) => {
    setHiding(phraseId);
    try {
      await hideStaticPhrase(phraseId);
    } finally {
      setHiding(null);
    }
  };

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

      {/* ── Inline vertaler ───────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3">
        <InlineTranslator
          defaultCategoryId={id}
          categoryName={category.name}
        />
      </div>

      {/* ── Zoekbalk + Bewerk-knop ────────────────────────────────── */}
      <div className="px-5 pb-2 flex items-center gap-2">
        {!editMode && (
          <div className="flex-1 flex items-center gap-2 bg-stone-100/70 rounded-xl px-3 py-2">
            <span className="text-stone-300 text-xs">○</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Zoek in ${category.name.toLowerCase()}…`}
              className="flex-1 bg-transparent text-xs text-stone-600 placeholder:text-stone-300 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-stone-300 text-xs hover:text-stone-500">✕</button>
            )}
          </div>
        )}
        {alleZinnen.length > 0 && (
          <button
            onClick={() => { setEditMode((v) => !v); setQuery(""); }}
            className={`shrink-0 text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
              editMode
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {editMode ? "Klaar" : "Bewerk"}
          </button>
        )}
      </div>

      {/* ── Zinnenlijst ───────────────────────────────────────────── */}
      <div className="px-5 pt-3 flex flex-col gap-1.5">
        {editMode ? (
          <>
            {/* Statische zinnen met verberg-knop */}
            {staticZinnen.map((phrase) => (
              <div key={phrase.id} className="relative">
                <PhraseCard phrase={phrase} />
                <button
                  onClick={() => handleHideStatic(phrase.id)}
                  disabled={hiding === phrase.id}
                  className="absolute top-3 right-3 text-[10px] text-stone-300 hover:text-red-400 transition-colors disabled:opacity-40 bg-white/80 rounded-lg px-2 py-1"
                >
                  {hiding === phrase.id ? "…" : "Verbergen"}
                </button>
              </div>
            ))}

            {/* Eigen zinnen: drag & drop */}
            {userZinnen.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={userZinnen.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-1.5">
                    {userZinnen.map((phrase) => (
                      <SortableCard key={phrase.id} phrase={phrase} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {alleZinnen.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📂</p>
                <p className="text-stone-500 text-sm mb-1">Deze categorie is leeg.</p>
                <p className="text-stone-400 text-xs">Gebruik de Vraag-knop om een zin toe te voegen.</p>
              </div>
            )}
          </>
        ) : gefilterd.length === 0 ? (
          <div className="text-center py-12">
            {query ? (
              <>
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-stone-500 text-sm">Geen zinnen gevonden voor "{query}"</p>
                <button onClick={() => setQuery("")} className="mt-3 text-sm text-stone-400 underline">
                  Zoekopdracht wissen
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">📂</p>
                <p className="text-stone-500 text-sm mb-1">Deze categorie is leeg.</p>
                <p className="text-stone-400 text-xs">Gebruik de Vraag-knop om een zin toe te voegen.</p>
              </>
            )}
          </div>
        ) : (
          gefilterd.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))
        )}
      </div>

      {/* Verwijder categorie — alleen voor lege gebruikerscategorieën */}
      {isUserCategory && alleZinnen.length === 0 && !query && !editMode && (
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
