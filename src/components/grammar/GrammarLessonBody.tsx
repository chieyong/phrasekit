"use client";

import PhraseCard from "@/components/cards/PhraseCard";
import AudioButton from "@/components/ui/AudioButton";
import { GrammarModuleDetail } from "@/hooks/useGrammarModules";
import { Phrase } from "@/types";

// ─── Extra voorbeeldkaart ───────────────────────────────────────────────────────

function ExtraVoorbeeldCard({ v }: { v: { japanese: string; romaji: string; dutch: string } }) {
  return (
    <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl px-4 py-3.5">
      <p className="text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug">{v.japanese}</p>
      <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">{v.romaji}</p>
      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{v.dutch}</p>
      <div className="mt-2.5">
        <AudioButton text={v.japanese} />
      </div>
    </div>
  );
}

// ─── Gedeelde les-weergave ──────────────────────────────────────────────────────
// Rendert de scrollbare inhoud van een grammaticales. Gebruikt door zowel het
// vaste leerpad (GrammarPath) als de "modules uit jouw zinnen" (GrammarScreen).

interface GrammarLessonBodyProps {
  detail:          GrammarModuleDetail;
  matchingPhrases: Phrase[];
}

export default function GrammarLessonBody({ detail, matchingPhrases }: GrammarLessonBodyProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <div className="px-5 pb-16 space-y-8">

        <div className="bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Kernregel</p>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{detail.kernregel}</p>
          {detail.patroon && (
            <div className="mt-3 bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-2.5">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Patroon</p>
              <p className="text-sm font-mono text-stone-700 dark:text-stone-300">{detail.patroon}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Uitleg</p>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{detail.uitleg}</p>
        </div>

        {detail.opbouw?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Opbouw van het patroon</p>
            <div className="space-y-2">
              {detail.opbouw.map((o, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 rounded-xl px-4 py-3 shadow-sm flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <span className="inline-block bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-mono px-2 py-0.5 rounded-lg">{o.element}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300">{o.rol}</p>
                    {o.voorbeeld && <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{o.voorbeeld}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.tips?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Tips</p>
            <div className="space-y-2">
              {detail.tips.map((tip, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.veelgemaaktefouten?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Veelgemaakte fouten</p>
            <div className="space-y-2">
              {detail.veelgemaaktefouten.map((fout, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="shrink-0 text-red-400 text-sm mt-0.5">⚠</span>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{fout}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchingPhrases.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Jouw zinnen met dit patroon</p>
            <div className="flex flex-col gap-1.5">
              {matchingPhrases.map((p) => (
                <div key={p.id} className="shrink-0"><PhraseCard phrase={p} /></div>
              ))}
            </div>
          </div>
        )}

        {detail.extraVoorbeelden?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Meer voorbeeldzinnen</p>
            <div className="flex flex-col gap-2">
              {detail.extraVoorbeelden.map((v, i) => (
                <ExtraVoorbeeldCard key={i} v={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
