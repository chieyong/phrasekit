"use client";

export const dynamic = "force-dynamic";

import { use, useState, useEffect, useRef } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Header from "@/components/layout/Header";
import PhraseCard from "@/components/cards/PhraseCard";
import { getCategoryById, getPhrasesByCategory } from "@/data/mockData";
import { useUserPhrases, UserCategory } from "@/hooks/useUserPhrases";
import CategoryPicker from "@/components/ui/CategoryPicker";
import { useAudio } from "@/hooks/useAudio";
import { useVocabulary, VocabWord, VocabConcept, VocabLang, wordForLang } from "@/hooks/useVocabulary";
import { useAuth } from "@/contexts/AuthContext";
import { staticVocab } from "@/data/staticVocab";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPhraseTranslation } from "@/utils/phrase";
import { getLanguage } from "@/data/languages";
import { Phrase } from "@/types";
import InlineTranslator from "@/components/ui/InlineTranslator";
import SpotlightTour, { TourStep } from "@/components/ui/SpotlightTour";
import AudioButton from "@/components/ui/AudioButton";
import SpeedButton from "@/components/ui/SpeedButton";
import ReviewSession from "@/components/practice/ReviewSession";

// ─── Vocabulary list (inline) ─────────────────────────────────────────────────

const LIST_PRESETS: { label: string; theme: string }[] = [
  { label: "Cijfers 1–10", theme: "de cijfers 1 tot en met 10" },
  { label: "Cijfers 1–20", theme: "de cijfers 1 tot en met 20" },
  { label: "Maanden",      theme: "alle maanden van het jaar" },
  { label: "Dagen",        theme: "alle dagen van de week" },
  { label: "Kleuren",      theme: "de meest voorkomende kleuren" },
  { label: "Tijd",         theme: "tijdsaanduidingen en de uren van de klok" },
  { label: "Familie",      theme: "familieleden" },
];

function VocabList({ phrases, categoryId, categoryName, userCategories, onAddCategory }: {
  phrases: Phrase[];
  categoryId: string;
  categoryName: string;
  userCategories: UserCategory[];
  onAddCategory: (name: string, icon: string) => Promise<UserCategory>;
}) {
  const { getConcepts, saveConcepts } = useVocabulary();
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = language as VocabLang;
  // Demo-modus (niet ingelogd): geen Firestore, dus vaste demo-woorden tonen en
  // de acties die opslaan/genereren/oefenen vereisen verbergen.
  const demo = !user;
  const [concepts,  setConcepts]  = useState<VocabConcept[]>([]);
  const [status,    setStatus]    = useState<"loading" | "done" | "error">("loading");
  const [expanding, setExpanding] = useState(false);
  const [showList,       setShowList]       = useState(false);
  const [listTheme,      setListTheme]      = useState("");
  const [generatingList, setGeneratingList] = useState(false);
  const [regenerating,   setRegenerating]   = useState(false);
  const [msg,            setMsg]            = useState<string | null>(null);
  const [selectMode,     setSelectMode]     = useState(false);
  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [showMove,       setShowMove]       = useState(false);
  const [newWord,        setNewWord]        = useState("");
  const [addingWord,     setAddingWord]     = useState(false);
  const [showPractice,   setShowPractice]   = useState(false);

  const ckey = (d: string) => d.trim().toLowerCase();

  // Vertaalt een mislukt verzoek naar een begrijpelijke melding (incl. serverreden).
  const errorMsg = (status?: number, reason?: string) =>
    status === 429
      ? "Te veel verzoeken — wacht even en probeer opnieuw."
      : `Genereren mislukt${reason ? `: ${reason}` : status ? ` (${status})` : ""}.`;

  // Extractie kan alleen uit talen die de zinnen zelf bevatten (ja/zh). Voor
  // overige talen komt vocab via vertaling van bestaande concepten.
  const apiPhrasesForLang = () => phrases
    .map((p) => {
      if (lang === "ja") return { translatedText: p.translatedText, romaji: p.romaji, sourceText: p.sourceText };
      if (lang === "zh") return p.chineseText ? { translatedText: p.chineseText, romaji: p.pinyin ?? "", sourceText: p.sourceText } : null;
      return null;
    })
    .filter(Boolean) as { translatedText: string; romaji: string; sourceText: string }[];

  // API-woorden (in de actieve taal) → concepten; behoudt vertalingen in andere
  // talen als het concept (op Nederlands) al bestond.
  const wordsToConcepts = (ws: VocabWord[], prev: VocabConcept[], asAi: boolean): VocabConcept[] => {
    const byDutch = new Map(prev.map((c) => [ckey(c.dutch), c]));
    return ws.filter((w) => w.dutch && w.japanese).map((w) => {
      const ex = byDutch.get(ckey(w.dutch));
      return {
        dutch: w.dutch,
        type: w.type ?? ex?.type,
        source: asAi ? ("ai" as const) : ex?.source,
        tr: { ...(ex?.tr ?? {}), [lang]: { text: w.japanese, reading: w.romaji } },
      };
    });
  };

  // Vul ontbrekende vertalingen voor de actieve taal aan via het vertaal-endpoint.
  const ensureLanguage = async (cs: VocabConcept[]): Promise<VocabConcept[]> => {
    const missing = cs.filter((c) => !c.tr[lang]);
    if (!missing.length) return cs;
    const res = await fetch("/api/vocabulary-translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words: missing.map((c) => ({ dutch: c.dutch, type: c.type })), language: lang }),
    });
    if (!res.ok) return cs; // niet nu te vertalen — toon wat er is
    const data = await res.json();
    const translations: { dutch: string; text: string; reading: string }[] = data.translations ?? [];
    const byDutch = new Map(translations.map((t) => [ckey(t.dutch), t]));
    const updated = cs.map((c) => {
      if (c.tr[lang]) return c;
      const t = byDutch.get(ckey(c.dutch));
      return t && t.text ? { ...c, tr: { ...c.tr, [lang]: { text: t.text, reading: t.reading ?? "" } } } : c;
    });
    await saveConcepts(categoryId, updated);
    return updated;
  };

  // Eerste keer: genereer sleutelwoorden uit de zinnen in de actieve taal.
  const generateFromSentences = async (): Promise<VocabConcept[]> => {
    const apiPhrases = apiPhrasesForLang();
    if (!apiPhrases.length) {
      if (lang !== "ja") setMsg("Nog geen woorden voor deze taal — genereer ze eerst in 🇯🇵 of 🇨🇳, dan worden ze automatisch bijvertaald.");
      return [];
    }
    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrases: apiPhrases, language: lang }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `serverfout ${res.status}`);
    const cs = wordsToConcepts(data?.words ?? [], [], false);
    if (cs.length) await saveConcepts(categoryId, cs);
    return cs;
  };

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setMsg(null);
    // Demo: toon de vaste woorden bij deze categorie (bevatten al ja én zh).
    if (demo) {
      setConcepts(staticVocab[categoryId] ?? []);
      setStatus("done");
      return;
    }
    (async () => {
      try {
        let cs = await getConcepts(categoryId);
        // Eerste bezoek aan een statisch thema: seed met de vaste woordenlijst
        // (direct resultaat, geen AI-extractie nodig).
        if (!cs && staticVocab[categoryId]) {
          cs = staticVocab[categoryId];
          await saveConcepts(categoryId, cs);
        }
        cs = cs ? await ensureLanguage(cs) : await generateFromSentences();
        if (cancelled) return;
        setConcepts(cs ?? []);
        setStatus("done");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMsg(`Kon woordenlijst niet laden: ${(err as Error).message}`);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, demo]);

  const persist = (next: VocabConcept[]) => { setConcepts(next); saveConcepts(categoryId, next); };

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    setMsg(null);
    try {
      const apiPhrases = apiPhrasesForLang();
      if (!apiPhrases.length) return;
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases: apiPhrases, language: lang }),
      });
      if (!res.ok) { const e = await res.json().catch(() => null); setMsg(errorMsg(res.status, e?.error)); return; }
      const data = await res.json();
      const extracted: VocabWord[] = data.words ?? [];
      if (!extracted.length) { setMsg("Geen woorden uit de zinnen kunnen halen."); return; }
      // Ververst de geëxtraheerde set (behoudt andere-taal-vertalingen per concept)
      // en houdt AI-aanvullingen die niet opnieuw geëxtraheerd zijn.
      const fresh  = wordsToConcepts(extracted, concepts, false);
      const have   = new Set(fresh.map((c) => ckey(c.dutch)));
      const keptAi = concepts.filter((c) => c.source === "ai" && !have.has(ckey(c.dutch)));
      persist([...fresh, ...keptAi]);
      setMsg(`✓ Lijst vernieuwd (${extracted.length} woorden uit de zinnen)`);
    } catch {
      setMsg("Geen verbinding — probeer het opnieuw.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleRemove = (c: VocabConcept) =>
    persist(concepts.filter((x) => ckey(x.dutch) !== ckey(c.dutch)));

  const toggleSelect = (key: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); };

  // Verplaatst de geselecteerde concepten (mét al hun vertalingen) naar een
  // andere/nieuwe categorie en haalt ze uit de huidige lijst.
  const handleMove = async (targetId: string) => {
    setShowMove(false);
    if (targetId === categoryId || selected.size === 0) return;
    const moving = concepts.filter((c) => selected.has(ckey(c.dutch)));
    try {
      const targetConcepts = (await getConcepts(targetId).catch(() => null)) ?? [];
      const have  = new Set(targetConcepts.map((c) => ckey(c.dutch)));
      const toAdd = moving.filter((c) => !have.has(ckey(c.dutch))).map((c) => ({ ...c, source: "ai" as const }));
      await saveConcepts(targetId, [...targetConcepts, ...toAdd]);
      persist(concepts.filter((c) => !selected.has(ckey(c.dutch))));
      exitSelect();
      setMsg(`✓ ${moving.length} ${moving.length === 1 ? "woord" : "woorden"} verplaatst`);
    } catch {
      setMsg("Verplaatsen mislukt — probeer het opnieuw.");
    }
  };

  // Voegt gegenereerde woorden (in de actieve taal) toe als AI-concepten,
  // gededupliceerd op Nederlands.
  const addGenerated = (generated: VocabWord[], okMsg: (n: number) => string, emptyMsg: string): number => {
    const have  = new Set(concepts.map((c) => ckey(c.dutch)));
    const fresh = wordsToConcepts(generated, concepts, true).filter((c) => !have.has(ckey(c.dutch)));
    if (fresh.length) { persist([...concepts, ...fresh]); setMsg(okMsg(fresh.length)); return fresh.length; }
    setMsg(emptyMsg); return 0;
  };

  const handleExpand = async () => {
    if (expanding) return;
    setExpanding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/vocabulary-expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          existing: concepts.map((c) => ({ japanese: c.tr[lang]?.text ?? c.dutch, dutch: c.dutch })),
          language: lang,
          count: 10,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => null); setMsg(errorMsg(res.status, e?.error)); return; }
      const data = await res.json();
      addGenerated(data.words ?? [], (n) => `✓ ${n} woorden toegevoegd`, "Geen nieuwe woorden gevonden — die staan er al.");
    } catch {
      setMsg("Geen verbinding — probeer het opnieuw.");
    } finally {
      setExpanding(false);
    }
  };

  const handleGenerateList = async (theme: string) => {
    const t = theme.trim();
    if (!t || generatingList) return;
    setGeneratingList(true);
    setMsg(null);
    try {
      const res = await fetch("/api/vocabulary-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: t,
          existing: concepts.map((c) => ({ japanese: c.tr[lang]?.text ?? c.dutch, dutch: c.dutch })),
          language: lang,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => null); setMsg(errorMsg(res.status, e?.error)); return; }
      const data = await res.json();
      const added = addGenerated(data.words ?? [], (n) => `✓ ${n} woorden toegevoegd`, "Geen nieuwe woorden voor dit thema — staan er mogelijk al.");
      if (added) { setShowList(false); setListTheme(""); }
    } catch {
      setMsg("Geen verbinding — probeer het opnieuw.");
    } finally {
      setGeneratingList(false);
    }
  };

  // Voegt één zelf ingetypt Nederlands woord toe en vertaalt het naar de
  // actieve taal (andere talen worden lui bijgevuld).
  const handleAddWord = async (raw: string) => {
    const d = raw.trim();
    if (!d || addingWord) return;
    if (concepts.some((c) => ckey(c.dutch) === ckey(d))) { setMsg(`"${d}" staat er al.`); return; }
    setAddingWord(true);
    setMsg(null);
    try {
      const res = await fetch("/api/vocabulary-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: [{ dutch: d }], language: lang }),
      });
      if (!res.ok) { const e = await res.json().catch(() => null); setMsg(errorMsg(res.status, e?.error)); return; }
      const data = await res.json();
      const t = (data.translations ?? [])[0] as { text?: string; reading?: string } | undefined;
      const concept: VocabConcept = {
        dutch: d,
        source: "ai",
        tr: t?.text ? { [lang]: { text: t.text, reading: t.reading ?? "" } } : {},
      };
      persist([...concepts, concept]);
      setMsg(`✓ "${d}" toegevoegd`);
      setNewWord("");
      setShowList(false);
    } catch {
      setMsg("Toevoegen mislukt — probeer het opnieuw.");
    } finally {
      setAddingWord(false);
    }
  };

  return (
    <div className="px-5 pt-4 pb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Sleutelwoorden uit de zinnen in deze categorie
        </p>
        {status === "done" && !demo && (
          <div className="flex items-center gap-3 shrink-0">
            {!selectMode && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors disabled:opacity-50"
              >
                {regenerating ? "…" : "↻ Opnieuw"}
              </button>
            )}
            {concepts.length > 0 && (
              <button
                onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
                className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                {selectMode ? "Klaar" : "Selecteer"}
              </button>
            )}
          </div>
        )}
      </div>

      {status === "loading" && (
        <div className="space-y-3 pt-2 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-6 bg-stone-100 dark:bg-stone-800 rounded-lg w-24" />
              <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded-lg w-16" />
              <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded-lg flex-1" />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">
          Kon woordenlijst niet laden.
        </p>
      )}

      {status === "done" && concepts.length === 0 && (
        <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">
          Geen woorden gevonden.
        </p>
      )}

      {status === "done" && concepts.length > 0 && (() => {
        const rows = concepts.map((c) => ({ c, w: wordForLang(c, lang) }));
        const nonVerbs = rows.filter((r) => r.c.type !== "verb");
        const verbs    = rows.filter((r) => r.c.type === "verb");
        const renderRow = ({ c, w }: { c: VocabConcept; w: VocabWord | null }, i: number) => {
          const key = ckey(c.dutch);
          const sel = selected.has(key);
          return (
            <div
              key={`${key}-${i}`}
              onClick={selectMode ? () => toggleSelect(key) : undefined}
              className={`group flex items-center gap-4 py-3 ${selectMode ? "cursor-pointer select-none" : ""}`}
            >
              {selectMode && (
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  sel ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100" : "border-stone-300 dark:border-stone-600"
                }`}>
                  {sel && <span className="text-white dark:text-stone-900 text-[10px] leading-none">✓</span>}
                </span>
              )}
              <div className="shrink-0 min-w-[80px]">
                <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  {w ? w.japanese : "—"}
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">{w?.romaji ?? ""}</p>
              </div>
              <p className="flex-1 text-sm text-stone-500 dark:text-stone-400">{c.dutch}</p>
              {w?.japanese && <AudioButton text={w.japanese} iconOnly />}
              {!selectMode && !demo && (
                <button
                  onClick={() => handleRemove(c)}
                  aria-label={`Verwijder ${c.dutch}`}
                  className="shrink-0 w-7 h-7 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-red-400 transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          );
        };
        return (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {nonVerbs.map(renderRow)}
            {verbs.length > 0 && (
              <>
                <div className="pt-3 pb-1">
                  <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Werkwoorden</p>
                </div>
                {verbs.map(renderRow)}
              </>
            )}
          </div>
        );
      })()}

      {msg && (
        <p className={`text-xs mt-4 text-center ${msg.startsWith("✓") ? "text-green-500" : "text-stone-400 dark:text-stone-500"}`}>
          {msg}
        </p>
      )}

      {selectMode && concepts.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => setSelected(new Set(concepts.map((c) => ckey(c.dutch))))} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">Alles</button>
          <button onClick={() => setSelected(new Set())} disabled={selected.size === 0} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors disabled:opacity-40">Wissen</button>
          <button
            onClick={() => setShowMove(true)}
            disabled={selected.size === 0}
            className="ml-auto px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium disabled:opacity-30 active:scale-95 transition-all"
          >
            Verplaatsen ({selected.size})
          </button>
        </div>
      )}

      {demo && status === "done" && concepts.length > 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 text-center mt-5">
          🔒 Log in om woorden toe te voegen en te oefenen.
        </p>
      )}

      {!demo && status === "done" && !selectMode && concepts.length > 0 && (
        <button
          onClick={() => setShowPractice(true)}
          className="w-full mt-5 py-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl text-sm font-medium active:opacity-80 transition-opacity flex items-center justify-center gap-2"
        >
          <span>🎯</span><span>Oefen deze woorden</span>
        </button>
      )}

      {!demo && status === "done" && !selectMode && (
        <button
          onClick={handleExpand}
          disabled={expanding}
          className="w-full mt-2 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-2xl text-sm font-medium active:opacity-80 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {expanding
            ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-600 dark:border-t-stone-300 animate-spin" /><span>Woorden zoeken…</span></>
            : <><span>✨</span><span>Aanvullen met AI (+10)</span></>}
        </button>
      )}

      {!demo && status === "done" && !selectMode && (
        <div className="mt-2">
          <button
            onClick={() => setShowList((v) => !v)}
            className="w-full py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-2xl text-sm font-medium active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <span>{showList ? "▲" : "➕"}</span><span>Toevoegen</span>
          </button>

          {showList && (
            <div className="mt-2 bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-3">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Los woord (Nederlands)</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWord(newWord)}
                  placeholder="bijv. paraplu, links, duur…"
                  disabled={addingWord}
                  className="flex-1 bg-white dark:bg-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-700 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => handleAddWord(newWord)}
                  disabled={addingWord || !newWord.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm disabled:opacity-30 active:scale-95 transition-all shrink-0"
                  aria-label="Woord toevoegen"
                >
                  {addingWord ? "…" : "→"}
                </button>
              </div>
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Kant-en-klaar</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {LIST_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleGenerateList(p.theme)}
                    disabled={generatingList}
                    className="px-2.5 py-1.5 rounded-full bg-white dark:bg-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Eigen thema</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={listTheme}
                  onChange={(e) => setListTheme(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateList(listTheme)}
                  placeholder="bijv. lichaamsdelen, in het restaurant…"
                  disabled={generatingList}
                  className="flex-1 bg-white dark:bg-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-700 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => handleGenerateList(listTheme)}
                  disabled={generatingList || !listTheme.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm disabled:opacity-30 active:scale-95 transition-all shrink-0"
                  aria-label="Genereer lijst"
                >
                  {generatingList ? "…" : "→"}
                </button>
              </div>
              {generatingList && (
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 text-center">Lijst genereren…</p>
              )}
            </div>
          )}
        </div>
      )}

      {showMove && (
        <CategoryPicker
          userCategories={userCategories}
          onSelect={handleMove}
          onAddCategory={onAddCategory}
          onClose={() => setShowMove(false)}
          title="Verplaatsen naar"
          subtitle={`${selected.size} ${selected.size === 1 ? "woord" : "woorden"} naar een andere categorie`}
        />
      )}

      {showPractice && (
        <ReviewSession
          allCategories={[]}
          scopeCategoryIds={[categoryId]}
          onClose={() => setShowPractice(false)}
        />
      )}
    </div>
  );
}

// ─── Flashcard module ─────────────────────────────────────────────────────────

function FlashcardModal({ phrases, onClose }: { phrases: Phrase[]; onClose: () => void }) {
  const { language } = useLanguage();
  const { play } = useAudio();
  const [index,     setIndex]     = useState(0);
  const [flipped,   setFlipped]   = useState(false);
  const [dir,       setDir]       = useState(1);
  const [audioFirst, setAudioFirst] = useState(false);
  const [order,     setOrder]     = useState(() => phrases.map((_, i) => i).sort(() => Math.random() - 0.5));

  const phrase = phrases[order[index]];
  const tr = phrase ? getPhraseTranslation(phrase, language) : undefined;

  // Luister-eerst: speel de doeltaal automatisch af zodra een kaart verschijnt.
  useEffect(() => {
    if (audioFirst && tr?.text) play(tr.text);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, audioFirst]);

  const go = (delta: number) => {
    setDir(delta >= 0 ? 1 : -1);
    setFlipped(false);
    // kleine delay zodat de kaart eerst omslaat voor die verdwijnt
    setTimeout(() => setIndex((i) => Math.min(Math.max(i + delta, 0), order.length - 1)), 50);
  };

  const shuffle = () => {
    setOrder((prev) => [...prev].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
  };

  // Swipe links = volgende, rechts = vorige. Een swipe onderdrukt de tik-flip.
  const touchStartX = useRef<number | null>(null);
  const didSwipe    = useRef(false);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; didSwipe.current = false; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) { didSwipe.current = true; if (dx < 0) go(1); else go(-1); }
  };
  const onCardClick = () => { if (didSwipe.current) { didSwipe.current = false; return; } setFlipped((v) => !v); };

  if (!phrase) return null;

  const langLabel = getLanguage(language)?.label ?? "";
  const targetNode = (
    <>
      <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-6">{langLabel}</p>
      <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight mb-3">{tr?.text ?? "…"}</p>
      <p className="text-base text-stone-400 dark:text-stone-500 italic">{tr?.reading ?? ""}</p>
      <div className="mt-6"><AudioButton text={tr?.text ?? ""} /></div>
    </>
  );
  const dutchNode = (
    <>
      <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-6">Nederlands</p>
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">{phrase.sourceText}</p>
      <p className="text-xs text-stone-300 dark:text-stone-600 mt-8">Tik om te draaien</p>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm text-lg"
          aria-label="Sluiten"
        >
          ✕
        </button>

        <p className="text-sm font-medium text-stone-400 dark:text-stone-500 tabular-nums">
          {index + 1} <span className="text-stone-300 dark:text-stone-600">/</span> {order.length}
        </p>

        <div className="flex items-center gap-2">
          <SpeedButton />
          <button
            onClick={() => setAudioFirst((v) => !v)}
            className={`w-9 h-9 flex items-center justify-center rounded-full shadow-sm transition-colors text-sm ${
              audioFirst
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                : "bg-white dark:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            }`}
            aria-label="Luister eerst"
            title="Luister-eerst: hoor de zin, draai om voor het Nederlands"
          >
            🔊
          </button>
          <button
            onClick={shuffle}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shadow-sm"
            aria-label="Schudden"
          >
            ⇄
          </button>
        </div>
      </div>

      {/* ── Flashcard ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div key={index} className="w-full max-w-sm card-slide-in" style={{ perspective: "1200px", "--slide-from": `${dir * 44}px` } as React.CSSProperties}>
          <div
            onClick={onCardClick}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{
              transformStyle:  "preserve-3d",
              transform:       flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition:      "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
              position:        "relative",
              height:          "300px",
              cursor:          "pointer",
            }}
          >
            {/* Voorkant */}
            <div
              style={{ backfaceVisibility: "hidden" }}
              className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none"
            >
              {audioFirst ? targetNode : dutchNode}
            </div>

            {/* Achterkant */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform:          "rotateY(180deg)",
              }}
              className="absolute inset-0 bg-white dark:bg-stone-900 rounded-3xl shadow-sm flex flex-col items-center justify-center px-8 text-center select-none"
            >
              {audioFirst ? dutchNode : targetNode}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigatie ────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 px-5 pb-14">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all"
          aria-label="Vorige"
        >
          ←
        </button>

        {/* Voortgangsbollen */}
        <div className="flex gap-1.5">
          {order.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === index
                  ? "w-4 h-2 bg-stone-700 dark:bg-stone-300"
                  : "w-2 h-2 bg-stone-200 dark:bg-stone-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={index === order.length - 1}
          className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xl flex items-center justify-center shadow-sm disabled:opacity-20 active:scale-95 transition-all"
          aria-label="Volgende"
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── Sorteerbare kaart (alleen in bewerkingsmodus) ─────────────────────────────

function SortableCard({ phrase }: { phrase: Phrase }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: phrase.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex items-stretch gap-2"
    >
      <div className="flex-1 min-w-0">
        <PhraseCard phrase={phrase} />
      </div>
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 w-8 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 active:text-stone-700 dark:active:text-stone-200 transition-colors touch-none cursor-grab active:cursor-grabbing"
        aria-label="Versleep om te herordenen"
      >
        <span className="text-base leading-none select-none">⠿</span>
      </button>
    </div>
  );
}

// ─── Pagina ────────────────────────────────────────────────────────────────────

// Mini-rondleiding bij het eerste bezoek aan een categoriepagina: wijst de
// functies aan die gebruikers anders makkelijk missen.
const CAT_TOUR_STEPS: TourStep[] = [
  {
    target: "cat-toggle",
    title:  "Zinnen én woorden",
    text:   "Elk thema heeft twee lijsten: hele zinnen en de belangrijkste losse woorden — allebei met audio.",
  },
  {
    target: "cat-flashcards",
    title:  "Flashcards",
    text:   "Overhoor jezelf: Nederlands op de voorkant, tik om de vertaling te zien.",
  },
  {
    target: "cat-grammatica",
    title:  "Groepeer op grammatica",
    text:   "Sorteer de zinnen op grammaticaal patroon, zodat je structuren leert herkennen.",
  },
];

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function CategoriePagina({ params }: CategoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { language } = useLanguage();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const {
    getUserPhrasesByCategory,
    userCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    hideStaticPhrase,
    hiddenStaticPhraseIds,
    updatePhraseSortOrder,
    loading: userLoading,
  } = useUserPhrases();

  const staticCategory = getCategoryById(id);
  const userCategory   = userCategories.find((c) => c.id === id);
  const category       = staticCategory ?? (userCategory ? { ...userCategory, description: "", color: "", accentColor: "" } : null);
  const isUserCategory = !!userCategory && !staticCategory;

  const staticZinnen = getPhrasesByCategory(id).filter(
    (p) => !hiddenStaticPhraseIds.includes(p.id)
  );
  const userZinnen = getUserPhrasesByCategory(id);
  const alleZinnen = [...staticZinnen, ...userZinnen];

  const [query,         setQuery]         = useState("");
  const [deleting,      setDeleting]      = useState(false);
  const [editMode,      setEditMode]      = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [hiding,        setHiding]        = useState<string | null>(null);
  const [oefenModus,    setOefenModus]    = useState(false);
  const [view,          setView]          = useState<"zinnen" | "woorden">("zinnen");
  const [grammarGroups, setGrammarGroups] = useState<{ groep: string; zinIds: string[] }[] | null>(null);
  const [activeGroep,   setActiveGroep]   = useState<string | null>(null);
  const [groupLoading,  setGroupLoading]  = useState(false);
  const [showTour,      setShowTour]      = useState(false);

  // Mini-rondleiding: eenmalig, zodra er zinnen staan (doelwitten bestaan dan).
  const hasPhrases = alleZinnen.length > 0;
  useEffect(() => {
    if (userLoading || !hasPhrases) return;
    if (localStorage.getItem("phrasekit-tour-cat-done")) return;
    const t = setTimeout(() => setShowTour(true), 600);
    return () => clearTimeout(t);
  }, [userLoading, hasPhrases]);
  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem("phrasekit-tour-cat-done", "1");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = userZinnen.findIndex((p) => p.id === active.id);
    const newIndex = userZinnen.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(userZinnen, oldIndex, newIndex);
    await Promise.all(
      reordered.map((phrase, idx) => updatePhraseSortOrder(phrase.id, (idx + 1) * 1000))
    );
  };

  const handleHideStatic = async (phraseId: string) => {
    setHiding(phraseId);
    try { await hideStaticPhrase(phraseId); }
    finally { setHiding(null); }
  };

  const handleDeleteCategory = async () => {
    if (!confirm(`Categorie "${category?.name}" verwijderen?`)) return;
    setDeleting(true);
    try { await deleteCategory(id); router.back(); }
    finally { setDeleting(false); }
  };

  const handleGroepeerGrammatica = async () => {
    if (grammarGroups) { setGrammarGroups(null); setActiveGroep(null); return; }
    setGroupLoading(true);
    try {
      const res = await fetch("/api/group-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          phrases: alleZinnen.map((p) => ({
            id:             p.id,
            translatedText: getPhraseTranslation(p, language)?.text ?? "",
            sourceText:     p.sourceText,
          })),
        }),
      });
      const data = await res.json();
      const groups: { groep: string; zinIds: string[] }[] = data.groups ?? [];
      if (groups.length > 0) {
        setGrammarGroups(groups);
        setActiveGroep(groups[0].groep);
      }
    } catch {
      // silently fail — user stays in normal view
    } finally {
      setGroupLoading(false);
    }
  };

  if (!category && userLoading) {
    return (
      <div className="page-content flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
      </div>
    );
  }

  if (!category) notFound();

  // Demo kent alleen de Onderweg-thema's; "Dagelijks leven" vereist inloggen.
  if (!authLoading && !user && staticCategory && staticCategory.group !== "onderweg") {
    return (
      <div className="page-content">
        <Header title={`${category.icon} ${category.name}`} subtitle={category.description} showBack />
        <div className="text-center py-16 px-8">
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Log in voor dit thema</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
            In de demo kun je de Onderweg-thema&apos;s proberen; de thema&apos;s over het dagelijks leven komen vrij na inloggen.
          </p>
          <button onClick={signInWithGoogle} className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-xl px-4 py-2.5 shadow-sm active:opacity-70 transition-opacity mx-auto">
            <span className="text-base">G</span>
            <span className="text-xs text-stone-700 dark:text-stone-200 font-medium">Inloggen met Google</span>
          </button>
        </div>
      </div>
    );
  }

  const basisLijst = grammarGroups && activeGroep
    ? alleZinnen.filter((p) => {
        const groep = grammarGroups.find((g) => g.groep === activeGroep);
        return groep?.zinIds.includes(p.id) ?? false;
      })
    : alleZinnen;

  const gefilterd = query.trim()
    ? basisLijst.filter(
        (p) =>
          p.sourceText.toLowerCase().includes(query.toLowerCase()) ||
          (p.translatedText ?? "").includes(query) ||
          (p.romaji ?? "").toLowerCase().includes(query.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : basisLijst;

  return (
    <div className="page-content">
      <Header
        title={`${category.icon} ${category.name}`}
        subtitle={category.description}
        showBack
        rightElement={isUserCategory ? (
          <button
            onClick={() => setShowEdit(true)}
            aria-label="Categorie bewerken"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            ✏️
          </button>
        ) : undefined}
      />

      {/* ── Inline vertaler ───────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3">
        <InlineTranslator defaultCategoryId={id} categoryName={category.name} />
      </div>

      {/* ── Zinnen / Woorden toggle + afspeelsnelheid ─────────────── */}
      {alleZinnen.length > 0 && !editMode && (
        <div className="px-5 pb-1 flex items-center gap-2">
          <div data-tour="cat-toggle" className="flex-1 flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
            {(["zinnen", "woorden"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  view === v
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-400 dark:text-stone-500"
                }`}
              >
                {v === "zinnen" ? "Zinnen" : "Woorden"}
              </button>
            ))}
          </div>
          <SpeedButton />
        </div>
      )}

      {view === "woorden" && alleZinnen.length > 0 ? (
        <VocabList phrases={alleZinnen} categoryId={id} categoryName={category.name} userCategories={userCategories} onAddCategory={addCategory} />
      ) : (
      <>

      {/* ── Zoekbalk + Bewerk-knop ────────────────────────────────── */}
      <div className="px-5 pb-2 flex items-center gap-2">
        {!editMode && (
          <div className="flex-1 flex items-center gap-2 bg-stone-100/70 dark:bg-stone-800/70 rounded-xl px-3 py-2">
            <span className="text-stone-300 dark:text-stone-600 text-xs">○</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Zoek in ${category.name.toLowerCase()}…`}
              className="flex-1 bg-transparent text-xs text-stone-600 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-stone-300 dark:text-stone-600 text-xs hover:text-stone-500 dark:hover:text-stone-400">✕</button>
            )}
          </div>
        )}
        {alleZinnen.length > 0 && (
          <button
            onClick={() => { setEditMode((v) => !v); setQuery(""); }}
            className={`shrink-0 text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
              editMode ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900" : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            {editMode ? "Klaar" : "Bewerk"}
          </button>
        )}
      </div>

      {/* ── Grammaticagroepen tabs ────────────────────────────────── */}
      {grammarGroups && !editMode && (
        <div className="px-5 pb-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {grammarGroups.map((g) => (
              <button
                key={g.groep}
                onClick={() => setActiveGroep(g.groep)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeGroep === g.groep
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {g.groep}
                <span className="ml-1.5 opacity-50">{g.zinIds.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Zinnenlijst ───────────────────────────────────────────── */}
      <div className="px-5 pt-3 flex flex-col gap-1.5">
        {editMode ? (
          <>
            {staticZinnen.map((phrase) => (
              <div key={phrase.id} className="relative">
                <PhraseCard phrase={phrase} />
                <button
                  onClick={() => handleHideStatic(phrase.id)}
                  disabled={hiding === phrase.id}
                  className="absolute top-3 right-3 text-[10px] text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 transition-colors disabled:opacity-40 bg-white/80 dark:bg-stone-800/80 rounded-lg px-2 py-1"
                >
                  {hiding === phrase.id ? "…" : "Verbergen"}
                </button>
              </div>
            ))}

            {userZinnen.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={userZinnen.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-1.5">
                    {userZinnen.map((phrase) => (
                      <SortableCard key={phrase.id} phrase={phrase} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {alleZinnen.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📂</p>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-1">Deze categorie is leeg.</p>
                <p className="text-stone-400 dark:text-stone-500 text-xs">Gebruik de Vraag-knop om een zin toe te voegen.</p>
              </div>
            )}
          </>
        ) : gefilterd.length === 0 ? (
          <div className="text-center py-12">
            {query ? (
              <>
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-stone-500 dark:text-stone-400 text-sm">Geen zinnen gevonden voor "{query}"</p>
                <button onClick={() => setQuery("")} className="mt-3 text-sm text-stone-400 dark:text-stone-500 underline">
                  Zoekopdracht wissen
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">📂</p>
                <p className="text-stone-500 dark:text-stone-400 text-sm mb-1">Deze categorie is leeg.</p>
                <p className="text-stone-400 dark:text-stone-500 text-xs">Gebruik de Vraag-knop om een zin toe te voegen.</p>
              </>
            )}
          </div>
        ) : (
          gefilterd.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))
        )}
      </div>

      {/* ── Oefenen + Woordenlijst + Groeperen ──────────────────── */}
      {alleZinnen.length > 0 && !editMode && (
        <div className="px-5 pt-6 pb-4 flex flex-col gap-2">
          <button
            onClick={() => setOefenModus(true)}
            data-tour="cat-flashcards"
            className="w-full py-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl text-sm font-medium active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <span>🃏</span>
            <span>Oefenen met flashcards</span>
          </button>
          <button
            onClick={handleGroepeerGrammatica}
            data-tour="cat-grammatica"
            disabled={groupLoading}
            className={`w-full py-3.5 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              grammarGroups
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 active:opacity-80"
                : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 active:opacity-80 disabled:opacity-50"
            }`}
          >
            <span>{groupLoading ? "⏳" : grammarGroups ? "✕" : "🔤"}</span>
            <span>
              {groupLoading ? "Groepen bepalen…" : grammarGroups ? "Groepering sluiten" : "Groepeer op grammatica"}
            </span>
          </button>
        </div>
      )}

      </>
      )}

      {/* Verwijder categorie */}
      {isUserCategory && alleZinnen.length === 0 && !query && !editMode && (
        <div className="px-5 pb-8 pt-4">
          <button
            onClick={handleDeleteCategory}
            disabled={deleting}
            className="w-full py-3 text-xs text-red-400 hover:text-red-600 transition-colors text-center border border-red-100 dark:border-red-900/30 rounded-2xl disabled:opacity-40"
          >
            {deleting ? "Verwijderen…" : "🗑 Categorie verwijderen"}
          </button>
        </div>
      )}

      {/* ── Categorie bewerken (naam + icoon) ─────────────────────── */}
      {showEdit && isUserCategory && (
        <CategoryPicker
          userCategories={userCategories}
          onSelect={() => {}}
          onAddCategory={addCategory}
          onUpdateCategory={(cid, name, icon) => updateCategory(cid, { name, icon })}
          editCategory={{ id, name: category.name, icon: category.icon }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* ── Flashcard overlay ─────────────────────────────────────── */}
      {oefenModus && (
        <FlashcardModal
          phrases={alleZinnen}
          onClose={() => setOefenModus(false)}
        />
      )}

      {/* Mini-rondleiding bij het eerste bezoek */}
      {showTour && <SpotlightTour steps={CAT_TOUR_STEPS} onClose={closeTour} />}
    </div>
  );
}
