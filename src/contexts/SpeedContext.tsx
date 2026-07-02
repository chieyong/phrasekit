"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Globale afspeelsnelheid voor de uitspraak (OpenAI-TTS + browser-spraak).
export const SPEEDS = [1, 0.75, 0.5] as const;
type Speed = (typeof SPEEDS)[number];

interface SpeedContextValue {
  speed: number;
  cycleSpeed: () => void;
}

const SpeedContext = createContext<SpeedContextValue>({ speed: 1, cycleSpeed: () => {} });

export function SpeedProvider({ children }: { children: React.ReactNode }) {
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const saved = parseFloat(localStorage.getItem("phrasekit-speed") ?? "");
    if ((SPEEDS as readonly number[]).includes(saved)) setSpeed(saved);
  }, []);

  const cycleSpeed = () => {
    setSpeed((s) => {
      const i = SPEEDS.indexOf(s as Speed);
      const next = SPEEDS[(i + 1) % SPEEDS.length];
      localStorage.setItem("phrasekit-speed", String(next));
      return next;
    });
  };

  return (
    <SpeedContext.Provider value={{ speed, cycleSpeed }}>
      {children}
    </SpeedContext.Provider>
  );
}

export const useSpeed = () => useContext(SpeedContext);
