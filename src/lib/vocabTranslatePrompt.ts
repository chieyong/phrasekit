// Systeem-prompt voor woordvertalingen — gedeeld door de API-route
// (/api/vocabulary-translate) en het voorgeneratie-script
// (scripts/generate-static-vocab.ts). Relatieve import zodat het script dit
// buiten Next om kan draaien.
import { getLanguage } from "../data/languages";

const JA_PROMPT = `Je bent een Japanse woordenschatleraar voor Nederlandstalige reizigers. Vertaal elk gegeven Nederlands woord naar het Japans.

Regels:
- Geef per woord het Japans (kanji/kana) en de romaji-lezing.
- Werkwoorden: woordenboek-vorm (辞書形).
- Behoud de exacte Nederlandse invoer in het veld "dutch" en de VOLGORDE.

Reageer met ALLEEN geldig JSON:
{ "translations": [ { "dutch": "<Nederlands, exact zoals gegeven>", "text": "<kanji/kana>", "reading": "<romaji>" } ] }`;

const ZH_PROMPT = `Je bent een Chinese woordenschatleraar voor Nederlandstalige reizigers. Vertaal elk gegeven Nederlands woord naar het Vereenvoudigd Chinees.

Regels:
- Geef per woord het Vereenvoudigd Chinees en de pinyin (met toonmarkeringen).
- Werkwoorden: basisvorm.
- Behoud de exacte Nederlandse invoer in het veld "dutch" en de VOLGORDE.

Reageer met ALLEEN geldig JSON:
{ "translations": [ { "dutch": "<Nederlands, exact zoals gegeven>", "text": "<Chinese karakters>", "reading": "<pinyin met toonmarkeringen>" } ] }`;

// Generieke vertaal-prompt voor talen zonder eigen prompt (bijv. Kantonees).
function buildGenericPrompt(langCode: string): string {
  const l = getLanguage(langCode);
  const name    = l?.label ?? "de doeltaal";
  const reading = l?.readingLabel ?? "lezing";
  const script  = l?.scriptNote ?? "";
  // Talen zonder vast romanisatiesysteem: uitspraak "op z'n Nederlands", geen IPA.
  const uitspraakRegel = reading === "Uitspraak"
    ? `\n- De uitspraak schrijf je "op z'n Nederlands": benader de klanken met gewone Nederlandse spelling, lettergrepen gescheiden door koppeltekens (bijv. printemps → "prèn-tan", Wohnzimmer → "voon-tsim-mer"). GEEN IPA of fonetische tekens.`
    : "";
  return `Je bent een woordenschatleraar ${name} voor Nederlandstalige reizigers. Vertaal elk gegeven Nederlands woord naar het ${name}.

Regels:
- Geef per woord de tekst ${script} en de ${reading}.${uitspraakRegel}
- Werkwoorden: basisvorm.
- Behoud de exacte Nederlandse invoer in het veld "dutch" en de VOLGORDE.

Reageer met ALLEEN geldig JSON:
{ "translations": [ { "dutch": "<Nederlands, exact zoals gegeven>", "text": "<tekst ${script}>", "reading": "<${reading}>" } ] }`;
}

export function vocabTranslateSystemPrompt(language: string): string {
  return language === "zh" ? ZH_PROMPT : language === "ja" ? JA_PROMPT : buildGenericPrompt(language);
}
