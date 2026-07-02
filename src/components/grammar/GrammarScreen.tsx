"use client";

import { useState, useEffect, useCallback } from "react";
import PhraseCard from "@/components/cards/PhraseCard";
import { useGrammarModules, GrammarModule, GrammarModuleDetail } from "@/hooks/useGrammarModules";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPhraseTranslation } from "@/utils/phrase";
import { getLanguage } from "@/data/languages";
import AudioButton from "@/components/ui/AudioButton";
import { Phrase } from "@/types";

const NIVEAU_COLORS: Record<string, string> = {
  basis:     "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  gemiddeld: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  gevorderd: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

// ─── Extra example card ────────────────────────────────────────────────────────

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

// ─── Module detail screen ──────────────────────────────────────────────────────

interface ModuleDetailProps {
  module: GrammarModule;
  userPhrases: Phrase[];
  language: string;
  onBack: () => void;
}

function ModuleDetailScreen({ module, userPhrases, language, onBack }: ModuleDetailProps) {
  const { getModuleDetail, saveModuleDetail } = useGrammarModules();
  const [detail,  setDetail]  = useState<GrammarModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const matchingPhrases = userPhrases.filter((p) => module.zinIds.includes(p.id));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cached = await getModuleDetail(module.naam, language).catch(() => null);
      if (cached && !cancelled) { setDetail(cached); setLoading(false); return; }

      try {
        const res = await fetch("/api/grammar-module-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleName: module.naam,
            language,
            phrases: matchingPhrases.map((p) => ({
              translatedText: getPhraseTranslation(p, language)?.text ?? "",
              romaji:         getPhraseTranslation(p, language)?.reading ?? "",
              sourceText:     p.sourceText,
            })),
          }),
        });
        const data: GrammarModuleDetail = await res.json();
        if (!cancelled) {
          setDetail(data);
          saveModuleDetail(data, language).catch(() => {});
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.naam, language]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm" aria-label="Terug">←</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 truncate">{module.naam}</h2>
            {module.romaji && <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">{module.romaji}</span>}
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{module.tagline}</p>
        </div>
        {module.niveau && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${NIVEAU_COLORS[module.niveau] ?? ""}`}>
            {module.niveau}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
          <p className="text-sm text-stone-400 dark:text-stone-500">Grammaticales laden…</p>
          <p className="text-xs text-stone-300 dark:text-stone-600">Dit kan even duren bij de eerste keer</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
          <p className="text-3xl">⚠️</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">Kon de les niet laden.</p>
          <button onClick={onBack} className="text-sm text-stone-400 underline">Terug</button>
        </div>
      )}

      {detail && !loading && (
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
      )}
    </div>
  );
}

// ─── Module list screen ────────────────────────────────────────────────────────

interface GrammarScreenProps {
  allPhrases: Phrase[];
  onClose: () => void;
}

export default function GrammarScreen({ allPhrases, onClose }: GrammarScreenProps) {
  const { language }                        = useLanguage();
  const { getModules, saveModules }         = useGrammarModules();
  const [modules,      setModules]          = useState<GrammarModule[] | null>(null);
  const [cachedCount,  setCachedCount]      = useState<number | null>(null);
  const [loading,      setLoading]          = useState(true);
  const [refreshing,   setRefreshing]       = useState(false);
  const [error,        setError]            = useState(false);
  const [activeModule, setActiveModule]     = useState<GrammarModule | null>(null);

  // For Chinese: only phrases that have Chinese text
  const effectivePhrases = language !== "ja"
    ? allPhrases.filter((p) => !!getPhraseTranslation(p, language))
    : allPhrases;

  const phraseCount = effectivePhrases.length;
  const isStale     = cachedCount !== null && cachedCount !== phraseCount;

  const fetchModules = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/grammar-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          phrases: effectivePhrases.map((p) => ({
            id:             p.id,
            translatedText: getPhraseTranslation(p, language)?.text ?? "",
            romaji:         getPhraseTranslation(p, language)?.reading ?? "",
            sourceText:     p.sourceText,
          })),
        }),
      });
      const data = await res.json();
      const fetched: GrammarModule[] = data.modules ?? [];
      setModules(fetched);
      setCachedCount(phraseCount);
      saveModules(fetched, phraseCount, language).catch(() => {});
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, phraseCount]);

  useEffect(() => {
    let cancelled = false;
    setModules(null);
    setLoading(true);
    setActiveModule(null);

    const load = async () => {
      const cached = await getModules(language).catch(() => null);
      if (cancelled) return;
      if (cached) {
        setModules(cached.modules);
        setCachedCount(cached.phraseCount);
        setLoading(false);
      } else {
        fetchModules(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  if (activeModule) {
    return (
      <ModuleDetailScreen
        module={activeModule}
        userPhrases={effectivePhrases}
        language={language}
        onBack={() => setActiveModule(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg" aria-label="Sluiten">✕</button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">Grammatica uitleg</h2>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {`${getLanguage(language)?.label ?? ""} grammatica · gebaseerd op jouw zinnen`}
          </p>
        </div>
        {modules && !loading && (
          <button
            onClick={() => fetchModules(true)}
            disabled={refreshing}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors shadow-sm disabled:opacity-40 text-base"
            aria-label="Vernieuwen"
          >
            {refreshing ? <span className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin inline-block" /> : "↺"}
          </button>
        )}
      </div>

      {isStale && !loading && modules && (
        <div className="mx-5 mb-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">Je hebt nieuwe zinnen — modules zijn mogelijk verouderd</p>
          <button onClick={() => fetchModules(true)} disabled={refreshing} className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0 underline disabled:opacity-40">Vernieuwen</button>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
          <p className="text-sm text-stone-400 dark:text-stone-500">Grammaticamodules bepalen…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
          <p className="text-3xl">⚠️</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">Kon de modules niet laden.</p>
          <button onClick={() => fetchModules(false)} className="text-sm text-stone-500 dark:text-stone-400 underline">Opnieuw proberen</button>
        </div>
      )}

      {modules && !loading && (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-12">
          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-3xl">📖</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {language === "ja"
                  ? "Voeg meer zinnen toe om grammaticamodules te genereren."
                  : `Open eerst wat zinnen in het ${getLanguage(language)?.label ?? ""} (ze worden dan vertaald), of voeg zinnen toe.`}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
                {modules.length} modules · {phraseCount} zinnen
              </p>
              <div className="flex flex-col gap-2">
                {modules.map((m) => (
                  <button
                    key={m.naam}
                    onClick={() => setActiveModule(m)}
                    className="w-full text-left bg-white dark:bg-stone-900 rounded-2xl px-5 py-4 shadow-sm active:opacity-70 transition-opacity flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{m.naam}</p>
                        {m.niveau && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${NIVEAU_COLORS[m.niveau] ?? ""}`}>
                            {m.niveau}
                          </span>
                        )}
                      </div>
                      {m.romaji && <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">{m.romaji}</p>}
                      <p className="text-xs text-stone-400 dark:text-stone-500 leading-snug">{m.tagline}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 mt-0.5">
                      <span className="text-stone-300 dark:text-stone-600 text-sm">›</span>
                      <span className="text-[10px] text-stone-300 dark:text-stone-600">{m.zinIds.length} zinnen</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
