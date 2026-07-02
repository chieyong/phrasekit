"use client";

import { useSpeed } from "@/contexts/SpeedContext";

// Compacte knop die door de afspeelsnelheden fietst (1× / 0.75× / 0.5×).
export default function SpeedButton() {
  const { speed, cycleSpeed } = useSpeed();
  const label = speed === 1 ? "1×" : `${speed}×`;
  return (
    <button
      onClick={cycleSpeed}
      aria-label={`Afspeelsnelheid ${label}`}
      title="Afspeelsnelheid (tik om te wisselen)"
      className="h-9 min-w-[2.5rem] px-2 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-xs font-semibold tabular-nums"
    >
      {label}
    </button>
  );
}
