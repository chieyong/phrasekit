"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ResultCard from "@/components/cards/ResultCard";
import { AskNowResult } from "@/types";

interface InlineTranslatorProps {
  defaultCategoryId?: string;
  categoryName?: string;
}

type LoadState = "idle" | "loading" | "result" | "error";

export default function InlineTranslator({
  defaultCategoryId,
  categoryName,
}: InlineTranslatorProps) {
  const { user, signInWithGoogle } = useAuth();
  const [query,      setQuery]      = useState("");
  const [result,     setResult]     = useState<AskNowResult | null>(null);
  const [loadState,  setLoadState]  = useState<LoadState>("idle");
  const [error,      setError]      = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loadState === "loading") return;

    setLoadState("loading");
    setResult(null);
    setError("");

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
      setError(err instanceof Error ? err.message : "Er is iets misgegaan");
      setLoadState("error");
    }
  };

  const handleReset = () => {
    setQuery("");
    setResult(null);
    setLoadState("idle");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Niet ingelogd ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <button onClick={signInWithGoogle} className="w-full text-left">
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-stone-100 shadow-sm active:opacity-80 transition-opacity">
          <div className="flex-1">
            <p className="text-stone-400 text-sm">Typ wat je wilt zeggen…</p>
          </div>
          <div className="flex items-center gap-1.5 text-stone-400">
            <span className="text-xs">🔒</span>
            <span className="text-xs">Inloggen</span>
          </div>
        </div>
      </button>
    );
  }

  // ── Resultaat ────────────────────────────────────────────────────────────────
  if (loadState === "result" && result) {
    return (
      <div>
        <ResultCard result={result} defaultCategoryId={defaultCategoryId} />
        <button
          onClick={handleReset}
          className="w-full mt-2 py-2.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Vertaal iets anders
        </button>
      </div>
    );
  }

  // ── Fout ─────────────────────────────────────────────────────────────────────
  if (loadState === "error") {
    return (
      <div className="bg-white rounded-2xl px-4 py-3 border border-stone-100">
        <p className="text-xs text-stone-400 mb-2">{error}</p>
        <button onClick={handleReset} className="text-xs text-stone-500 underline">
          ← Probeer opnieuw
        </button>
      </div>
    );
  }

  // ── Invoer ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(query)}
          placeholder={
            categoryName
              ? `Vertaal voor ${categoryName}…`
              : "Typ wat je wilt zeggen…"
          }
          className="flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-300 outline-none"
          autoComplete="off"
        />

        {loadState === "loading" ? (
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
            <div className="w-3 h-3 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin" />
          </div>
        ) : (
          <button
            onClick={() => handleSubmit(query)}
            disabled={!query.trim()}
            className="w-7 h-7 rounded-lg bg-stone-900 disabled:bg-stone-200 flex items-center justify-center text-white text-xs shrink-0 transition-colors active:scale-95"
          >
            →
          </button>
        )}
      </div>

      {defaultCategoryId && (
        <p className="text-[10px] text-stone-300 px-4 pb-2.5">
          Wordt opgeslagen in {categoryName ?? "deze categorie"}
        </p>
      )}
    </div>
  );
}
