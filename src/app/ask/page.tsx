"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import ResultCard from "@/components/cards/ResultCard";
import { exampleChips, getCategoryById } from "@/data/mockData";
import { useUserPhrases } from "@/hooks/useUserPhrases";
import { useAuth } from "@/contexts/AuthContext";
import { AskNowResult } from "@/types";

type LoadState = "idle" | "loading" | "result" | "error";

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function VraagInhoud() {
  const searchParams = useSearchParams();
  const vooringevuldeCategorie = searchParams.get("categorie");
  const { userCategories } = useUserPhrases();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

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

  // ── Demo-scherm voor niet-ingelogde gebruikers ──────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="page-content">
        <Header title="Vertaal" subtitle="AI-vertaling" showBack />

        <div className="px-5 pt-5 relative">

          {/* Voorbeeld-resultaat — vaag op achtergrond */}
          <div className="pointer-events-none select-none" aria-hidden>
            <div className="bg-white rounded-2xl overflow-hidden opacity-40 blur-[2px]">
              <div className="px-5 py-5">
                <p className="text-xs text-stone-400 italic mb-3">"Waar is het dichtstbijzijnde station?"</p>
                <p className="text-3xl font-bold text-stone-900 leading-tight mb-2">
                  一番近い駅はどこですか？
                </p>
                <p className="text-base text-stone-400 italic mb-4">
                  Ichiban chikai eki wa doko desu ka?
                </p>
                <p className="text-sm text-stone-500 leading-relaxed border-t border-stone-100 pt-3">
                  Een beleefde manier om naar de dichtstbijzijnde treinhalte te vragen.
                </p>
              </div>
              <div className="px-5 mb-4">
                <div className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-medium text-stone-700">
                  Voeg toe aan categorie ›
                </div>
              </div>
              <div className="flex gap-3 px-5 pb-4 border-t border-stone-50 pt-1">
                <span className="text-xs text-stone-400">🔊 Afspelen</span>
                <span className="text-xs text-stone-400">📖 Uitleggen</span>
              </div>
            </div>
          </div>

          {/* Inlog-kaart — bovenop het voorbeeld */}
          <div className="absolute inset-x-5 top-16 flex flex-col items-center text-center">
            <div className="bg-white rounded-2xl shadow-lg px-6 py-7 w-full">
              <p className="text-2xl mb-3">✦</p>
              <p className="text-base font-semibold text-stone-900 mb-1">
                Vertaal iets in het Japans
              </p>
              <p className="text-sm text-stone-400 mb-6 leading-relaxed">
                Typ in het Nederlands wat je wilt zeggen. PhrasePath vertaalt het direct naar correct Japans — inclusief romaji en uitleg.
              </p>
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2.5 bg-stone-900 text-white rounded-xl px-5 py-3 text-sm font-medium active:opacity-80 transition-opacity"
              >
                <span className="text-base">G</span>
                <span>Inloggen met Google</span>
              </button>
              <p className="text-xs text-stone-300 mt-3">Gratis · Geen creditcard nodig</p>
            </div>
          </div>

          {/* Ruimte voor de kaart */}
          <div className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Header
        title="Vertaal"
        subtitle={catNaam ? `Wordt opgeslagen in ${catNaam}` : "Typ wat je wilt zeggen"}
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

// ─── Page export — wraps inner component in Suspense ─────────────────────────

export default function VraagPagina() {
  return (
    <Suspense fallback={
      <div className="page-content flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
      </div>
    }>
      <VraagInhoud />
    </Suspense>
  );
}
