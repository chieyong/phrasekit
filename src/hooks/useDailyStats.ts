"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

// Dagelijkse activiteit voor streak + dagdoel. Eén bounded document per gebruiker:
// users/{uid}/stats/daily — geen groeiende dag-map, alleen de lopende stand.

const DAY = 86_400_000;
export const DAILY_GOAL = 15;   // aantal beoordeelde kaarten voor "doel gehaald"

interface StatsDoc {
  lastDate:   string;  // "YYYY-MM-DD" (lokale tijd) van de laatste activiteit
  streak:     number;  // dagen op rij t/m lastDate
  longest:    number;
  todayCount: number;  // beoordelingen op lastDate
  total:      number;  // beoordelingen ooit
}

const EMPTY: StatsDoc = { lastDate: "", streak: 0, longest: 0, todayCount: 0, total: 0 };

function dateKey(ts = Date.now()): string {
  const d = new Date(ts);
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function useDailyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsDoc>(EMPTY);
  const dataRef = useRef<StatsDoc>(EMPTY);   // live spiegel voor recordReviews

  useEffect(() => {
    if (!user) { dataRef.current = EMPTY; setStats(EMPTY); return; }
    const ref = doc(db, "users", user.uid, "stats", "daily");
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.exists() ? { ...EMPTY, ...(snap.data() as Partial<StatsDoc>) } : EMPTY;
      dataRef.current = d;
      setStats(d);
    });
    return unsub;
  }, [user]);

  // Eén schrijfactie per sessie: verwerkt n beoordelingen en rolt de streak door.
  const recordReviews = useCallback(async (n: number) => {
    if (!user || n <= 0) return;
    const d       = dataRef.current;
    const today   = dateKey();
    const yest    = dateKey(Date.now() - DAY);
    const sameDay = d.lastDate === today;

    const streak     = sameDay ? d.streak : (d.lastDate === yest ? d.streak + 1 : 1);
    const todayCount = sameDay ? d.todayCount + n : n;
    const next: StatsDoc = {
      lastDate:   today,
      streak,
      longest:    Math.max(d.longest, streak),
      todayCount,
      total:      d.total + n,
    };
    await setDoc(doc(db, "users", user.uid, "stats", "daily"), { ...next, updatedAt: Date.now() }, { merge: true });
  }, [user]);

  // "Vandaag"/"gisteren" één keer bij mount bepalen (zuivere render; pas na de
  // volgende interactie voorbij middernacht — voor een streak prima).
  const [today]     = useState(() => dateKey());
  const [yesterday] = useState(() => dateKey(Date.now() - DAY));

  // Afgeleide, "actuele" stand: een streak is verbroken zodra de laatste dag niet
  // vandaag of gisteren is; todayCount telt alleen als de laatste dag vandaag is.
  const streakValid   = stats.lastDate === today || stats.lastDate === yesterday;
  const currentStreak = streakValid ? stats.streak : 0;
  const todayCount    = stats.lastDate === today ? stats.todayCount : 0;
  const goalMet       = todayCount >= DAILY_GOAL;

  return { currentStreak, longest: stats.longest, todayCount, total: stats.total, goalMet, recordReviews };
}
