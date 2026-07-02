"use client";

import { useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { LangCode } from "@/data/languages";

export type VocabLang = LangCode;

// Display-/API-vorm: één woord in de actieve taal.
export interface VocabWord {
  japanese: string; // tekst in de actieve taal (kanji/kana of Chinees)
  romaji: string;   // lezing (romaji of pinyin)
  dutch: string;
  type?: "noun" | "verb" | "adjective";
  source?: "ai";
}

// Opslagvorm: één concept per categorie, met vertalingen per taal.
// Het Nederlandse woord is het taalonafhankelijke ankerpunt.
export interface VocabConcept {
  dutch: string;
  type?: "noun" | "verb" | "adjective";
  source?: "ai";
  tr: Partial<Record<VocabLang, { text: string; reading: string }>>;
}

// Concept → weergave-woord voor een taal (null als de vertaling nog ontbreekt).
export function wordForLang(c: VocabConcept, lang: VocabLang): VocabWord | null {
  const t = c.tr[lang];
  if (!t) return null;
  return { japanese: t.text, romaji: t.reading, dutch: c.dutch, type: c.type, source: c.source };
}

const conceptKey = (dutch: string) => dutch.trim().toLowerCase();

export function useVocabulary() {
  const { user } = useAuth();

  const saveConcepts = useCallback(async (categoryId: string, concepts: VocabConcept[]): Promise<void> => {
    if (!user) return;
    // Firestore accepteert geen undefined-velden → optionele velden weglaten.
    const clean = concepts.map((c) => {
      const o: VocabConcept = { dutch: c.dutch, tr: c.tr };
      if (c.type)   o.type   = c.type;
      if (c.source) o.source = c.source;
      return o;
    });
    await setDoc(doc(db, "users", user.uid, "vocab", `${categoryId}_all`), {
      concepts: clean,
      v: 2,
      generatedAt: Date.now(),
    });
  }, [user]);

  // Leest de gedeelde conceptenlijst; migreert eenmalig de oude per-taal-lijsten
  // (`{cat}_ja` / legacy `{cat}` en `{cat}_zh`) door ze op Nederlands samen te voegen.
  const getConcepts = useCallback(async (categoryId: string): Promise<VocabConcept[] | null> => {
    if (!user) return null;

    const allSnap = await getDoc(doc(db, "users", user.uid, "vocab", `${categoryId}_all`));
    if (allSnap.exists()) return (allSnap.data().concepts as VocabConcept[]) ?? [];

    // ── Migratie vanuit oude per-taal-documenten ──────────────────────────────
    const byDutch = new Map<string, VocabConcept>();

    const merge = async (docId: string, lang: VocabLang) => {
      const snap = await getDoc(doc(db, "users", user.uid, "vocab", docId));
      if (!snap.exists()) return;
      const words = (snap.data().words as VocabWord[]) ?? [];
      for (const w of words) {
        if (!w?.dutch) continue;
        const k = conceptKey(w.dutch);
        const c = byDutch.get(k) ?? { dutch: w.dutch, type: w.type, source: w.source, tr: {} };
        if (!c.tr[lang] && w.japanese) c.tr[lang] = { text: w.japanese, reading: w.romaji ?? "" };
        if (!c.type && w.type) c.type = w.type;
        if (!c.source && w.source) c.source = w.source;
        byDutch.set(k, c);
      }
    };

    // Japans: `{cat}_ja`, anders de legacy sleutel zonder suffix.
    const jaSnap = await getDoc(doc(db, "users", user.uid, "vocab", `${categoryId}_ja`));
    await merge(jaSnap.exists() ? `${categoryId}_ja` : categoryId, "ja");
    await merge(`${categoryId}_zh`, "zh");

    const concepts = [...byDutch.values()];
    if (!concepts.length) return null;
    await saveConcepts(categoryId, concepts);
    return concepts;
  }, [user, saveConcepts]);

  // Zoals getConcepts, maar vult ontbrekende vertalingen voor `lang` aan via het
  // vertaal-endpoint (en slaat ze op). Gebruikt door zowel de categoriepagina als
  // de oefenmodules, zodat een nieuwe taal overal automatisch bijvertaalt.
  const getConceptsForLang = useCallback(async (categoryId: string, lang: VocabLang): Promise<VocabConcept[]> => {
    const cs = await getConcepts(categoryId);
    if (!cs || !cs.length) return cs ?? [];
    const missing = cs.filter((c) => !c.tr[lang]);
    if (!missing.length) return cs;
    try {
      const res = await fetch("/api/vocabulary-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: missing.map((c) => ({ dutch: c.dutch, type: c.type })), language: lang }),
      });
      if (!res.ok) return cs;
      const data = await res.json();
      const translations: { dutch: string; text: string; reading: string }[] = data.translations ?? [];
      const byDutch = new Map(translations.map((t) => [conceptKey(t.dutch), t]));
      const updated = cs.map((c) => {
        if (c.tr[lang]) return c;
        const t = byDutch.get(conceptKey(c.dutch));
        return t && t.text ? { ...c, tr: { ...c.tr, [lang]: { text: t.text, reading: t.reading ?? "" } } } : c;
      });
      await saveConcepts(categoryId, updated);
      return updated;
    } catch {
      return cs;
    }
  }, [getConcepts, saveConcepts]);

  return { getConcepts, getConceptsForLang, saveConcepts };
}
