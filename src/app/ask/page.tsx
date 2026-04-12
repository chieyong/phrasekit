"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import ResultCard from "@/components/cards/ResultCard";
import { exampleChips, getCategoryById } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { AskNowResult } from "@/types";

type LoadState = "idle" | "loading" | "result" | "error";

export default function VraagPagina() {
  const searchParams = useSearchParams();
  const vooringevuldeCategorie = searchParams.get("categorie");
  const { userCategories } = useUserPhrases();

  // Resolve category name for the subtitle
  const staticCat = vooringevuldeCategorie ? getCategoryById(vooringevuldeCategorie) : null;
  const userCat   = vooringevuldeCategorie ? userCategories.find(c => c.id === vooringevuldeCategorie) : null;
  const catNaam   = staticCat?.name ?? userCat?.name ?? null;

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AskNowResult | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [foutmelding, setFoutmelding] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoadState("loading");
    setResult(null);
    setFoutmelding("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Verzoek mislukt (${res.status})`);
      }

      const data: AskNowResult = await res.json();
      setResult(data);
      setLoadState("result");
    } catch (err) {
      setFoutmelding(err instanceof Error ? err.message : "Er is iets misgegaan");
      setLoadState("error");
    }
  };

  const handleChip = (chipQuery: string) => {
    setQuery(chipQuery);
    handleSubmit(chipQuery);
    inputRef.current?.blur();
  };

  const handleReset = () => {
    setQuery("");
    setResult(null);
    setLoadState("idle");
    setFoutmelding("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="page-content">
      <Header
        title="Vraag"
        subtitle={catNaam ? `Wordt opgeslagen in ${catNaam}` : "Vertaal iets nu meteen"}
        showBack
      />

      <div className="px-5 pt-5">

        {/* ── Invoerveld ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(query);
              }
            }}
            placeholder="Wat wil je zeggen?"
            rows={3}
            className="w-full px-5 pt-4 pb-2 text-stone-900 placeholder:text-stone-300 text-base leading-relaxed resize-none outline-none bg-transparent"
          />
          <div className="flex items-center justify-between px-4 pb-4">
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="text-xs text-stone-300 hover:text-stone-500 transition"
              >
                Wis
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={() => handleSubmit(query)}
              disabled={!query.trim() || loadState === "loading"}
              className="bg-stone-900 text-white rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-30 active:scale-95 transition-all"
            >
              {loadState === "loading" ? "Vertalen…" : "Vertaal →"}
            </button>
          </div>
        </div>

        {/* ── Voorbeeldchips ─────────────────────────────────────── */}
        {loadState === "idle" && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
              Probeer een voorbeeld
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChip(chip.query)}
                  className="bg-white rounded-full px-3.5 py-1.5 text-sm text-stone-600 hover:text-stone-900 active:scale-95 transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Laadskelet ─────────────────────────────────────────── */}
        {loadState === "loading" && (
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-2.5 bg-stone-100 rounded-full w-1/4 mb-5" />
            <div className="h-8 bg-stone-100 rounded-full w-4/5 mb-3" />
            <div className="h-5 bg-stone-100 rounded-full w-3/5 mb-6" />
            <div className="h-12 bg-stone-50 rounded-xl" />
          </div>
        )}

        {/* ── Fout ───────────────────────────────────────────────── */}
        {loadState === "error" && (
          <div className="bg-white rounded-2xl px-5 py-5">
            <p className="text-sm text-stone-500 mb-1">Kon dit niet vertalen.</p>
            <p className="text-xs text-stone-400 mb-4">{foutmelding}</p>
            <button
              onClick={handleReset}
              className="text-xs text-stone-400 hover:text-stone-600 transition"
            >
              ← Probeer opnieuw
            </button>
          </div>
        )}

        {/* ── Resultaat ──────────────────────────────────────────── */}
        {loadState === "result" && result && (
          <div>
            <ResultCard
              result={result}
              defaultCategoryId={vooringevuldeCategorie ?? undefined}
            />
            <button
              onClick={handleReset}
              className="w-full mt-4 py-3 text-xs text-stone-400 hover:text-stone-600 transition"
            >
              ← Vraag iets anders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
