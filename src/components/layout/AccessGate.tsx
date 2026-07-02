"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

export default function AccessGate({ children }: { children: ReactNode }) {
  const { accessDenied, signInWithGoogle } = useAuth();

  if (!accessDenied) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <p className="text-4xl mb-4">🔒</p>
      <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
        Geen toegang
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
        Dit account heeft geen toegang tot PhraseKit. Vraag de beheerder om je e-mailadres toe te voegen.
      </p>
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-600 dark:text-stone-300 transition-colors"
      >
        <span>G</span>
        <span>Probeer een ander account</span>
      </button>
    </div>
  );
}
