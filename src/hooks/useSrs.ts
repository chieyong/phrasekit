"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SrsCardType = "word" | "sentence";

// De minimale inhoud die nodig is om een kaart te tonen én te scoren. De
// oefenmodules leveren dit aan; de SRS-laag voegt de plannings­velden toe.
export interface SrsSeed {
  type:    SrsCardType;
  lang:    string;   // taalcode — SRS is per taal (de doeltekst verschilt)
  dutch:   string;   // taalonafhankelijk ankerpunt
  target:  string;   // zin/woord in de doeltaal
  reading: string;   // romaji / pinyin
}

export interface SrsCard extends SrsSeed {
  id:           string;
  box:          number;  // Leitner-box 1..MAX_BOX
  due:          number;  // ms-timestamp: klaar om te herhalen wanneer due <= now
  reps:         number;  // totaal aantal beurten
  correct:      number;  // totaal aantal goed
  lastReviewed: number;
  createdAt:    number;
}

// ─── Leitner-schema ──────────────────────────────────────────────────────────

const DAY = 86_400_000;
const MAX_BOX = 5;
// Interval (dagen) per box; index = box. Box 1 = morgen weer, box 5 = ~5 weken.
const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
// Vanaf deze box telt een woord als "beheerst" (interval ≥ 16 dagen).
export const MASTERED_BOX = 4;

// Goed → één box omhoog (langer interval). Fout → terug naar box 1.
// Een nieuwe kaart (nog geen box) telt als box 1, dus "goed" brengt 'm op box 2.
function nextBox(prevBox: number | undefined, known: boolean): number {
  if (!known) return 1;
  return Math.min((prevBox ?? 1) + 1, MAX_BOX);
}

function dueFromBox(box: number, now: number): number {
  return now + BOX_INTERVAL_DAYS[box] * DAY;
}

// ─── Stabiele, Firestore-veilige kaart-ID ────────────────────────────────────

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function srsCardId(type: SrsCardType, lang: string, dutch: string): string {
  return `${type[0]}_${lang}_${djb2(dutch.trim().toLowerCase())}`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useSrs() {
  const { user } = useAuth();
  const [cards,   setCards]   = useState<SrsCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCards([]); setLoading(false); return; }
    const unsub = onSnapshot(collection(db, "users", user.uid, "srs"), (snap) => {
      setCards(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SrsCard)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  // Aantal kaarten dat nu klaarstaat om te herhalen, voor de actieve taal.
  const dueCount = useCallback((lang: string, now = Date.now()) =>
    cards.filter((c) => c.lang === lang && c.due <= now).length,
  [cards]);

  // De due-kaarten zelf (oudste eerst), voor het opbouwen van een sessie.
  const dueCards = useCallback((lang: string, now = Date.now()): SrsCard[] =>
    cards
      .filter((c) => c.lang === lang && c.due <= now)
      .sort((a, b) => a.due - b.due),
  [cards]);

  // Beheersing voor de voortgangsweergave: box >= MASTERED_BOX telt als "beheerst".
  const masteryStats = useCallback((lang: string) => {
    const forLang = cards.filter((c) => c.lang === lang);
    return { total: forLang.length, mastered: forLang.filter((c) => c.box >= MASTERED_BOX).length };
  }, [cards]);

  // Scoort één kaart en werkt de planning bij (upsert). `known` = "Wist ik".
  const rate = useCallback(async (seed: SrsSeed, known: boolean): Promise<void> => {
    if (!user) return;
    const id   = srsCardId(seed.type, seed.lang, seed.dutch);
    const prev = byId.get(id);
    const now  = Date.now();
    const box  = nextBox(prev?.box, known);

    const card: Omit<SrsCard, "id"> = {
      type:         seed.type,
      lang:         seed.lang,
      dutch:        seed.dutch,
      target:       seed.target,
      reading:      seed.reading,
      box,
      due:          dueFromBox(box, now),
      reps:         (prev?.reps ?? 0) + 1,
      correct:      (prev?.correct ?? 0) + (known ? 1 : 0),
      lastReviewed: now,
      createdAt:    prev?.createdAt ?? now,
    };
    await setDoc(doc(db, "users", user.uid, "srs", id), card, { merge: true });
  }, [user, byId]);

  return { cards, byId, loading, dueCount, dueCards, masteryStats, rate };
}
