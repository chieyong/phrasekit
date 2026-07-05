"use client";

import { useEffect, useState } from "react";

// Spotlight-rondleiding: licht bestaande UI-elementen één voor één uit met een
// dimlaag + uitsparing, en toont een uitlegkaart ernaast. Een stap verwijst via
// `target` naar een element met een overeenkomstig data-tour-attribuut, bijv.
// <div data-tour="taal">…</div>. Ontbreekt het doelwit, dan valt de stap terug
// op een gecentreerde kaart zonder uitsparing.
export interface TourStep {
  target: string;
  title: string;
  text: string;
  // Optioneel: draait bij het activeren van de stap, bijv. om eerst de juiste
  // tab open te zetten zodat het doelwit bestaat.
  onEnter?: () => void;
}

const PAD = 8;          // ruimte rond het uitgelichte element
const CARD_SPACE = 190; // minimale verticale ruimte die de uitlegkaart nodig heeft

export default function SpotlightTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect,  setRect]  = useState<DOMRect | null>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  // Scroll het doelwit in beeld en meet het continu (volgt zo ook de smooth
  // scroll, resizes en layout-verschuivingen). Alleen een state-update als de
  // positie echt wijzigt, zodat we niet elk frame opnieuw renderen.
  useEffect(() => {
    step.onEnter?.();
    let scrolled = false;
    let raf = 0;
    const tick = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      // Pas scrollen zodra het doelwit bestaat (kan een render na onEnter zijn).
      if (el && !scrolled) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        scrolled = true;
      }
      const r = el ? el.getBoundingClientRect() : null;
      setRect((prev) => {
        if (!r) return prev ? null : prev;
        return prev &&
          Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.left - r.left) < 0.5 &&
          Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
          ? prev : r;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Kaart onder het doelwit als daar ruimte is, anders erboven; bij hele hoge
  // doelwitten (of zonder doelwit) onderaan resp. gecentreerd.
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const placement = !rect ? "center"
    : vh - rect.bottom >= CARD_SPACE ? "below"
    : rect.top >= CARD_SPACE ? "above"
    : "bottom";

  const cardStyle: React.CSSProperties =
    placement === "below"  ? { top: rect!.bottom + PAD * 2 }
  : placement === "above"  ? { top: rect!.top - PAD * 2, transform: "translateY(-100%)" }
  : placement === "bottom" ? { bottom: 24 }
  :                          { top: "50%", transform: "translateY(-50%)" };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Dimlaag met uitsparing rond het doelwit (box-shadow-truc) */}
      {rect ? (
        <div
          className="absolute rounded-2xl pointer-events-none"
          style={{
            left:   rect.left - PAD,
            top:    rect.top - PAD,
            width:  rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      {/* Klikvanger: houdt de app op pauze tijdens de rondleiding */}
      <div className="absolute inset-0" />

      {/* Uitlegkaart */}
      <div
        className="absolute inset-x-4 max-w-sm mx-auto bg-white dark:bg-stone-900 rounded-2xl shadow-2xl px-5 pt-4 pb-3"
        style={cardStyle}
      >
        <div className="flex gap-1 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-5 bg-stone-800 dark:bg-stone-200" : "w-2 bg-stone-200 dark:bg-stone-700"
              }`}
            />
          ))}
        </div>
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">{step.title}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">{step.text}</p>
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors py-2"
          >
            Overslaan
          </button>
          <div className="ml-auto flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="text-xs text-stone-500 dark:text-stone-400 px-3 py-2"
              >
                Vorige
              </button>
            )}
            <button
              onClick={() => (last ? onClose() : setIndex((i) => i + 1))}
              className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl px-4 py-2 text-xs font-medium active:scale-95 transition-all"
            >
              {last ? "Klaar" : "Volgende"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
