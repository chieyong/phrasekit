// Centraal taalregister. Eén plek om een taal toe te voegen; de rest van de app
// (kiezer, opslag-keys, prompts in fase 2) leest hieruit.

export type LangCode = "ja" | "zh" | "yue" | "ko" | "id" | "en" | "fr" | "de" | "es";

export interface LanguageDef {
  code: LangCode;
  label: string;        // Nederlandse naam, bijv. "Japans"
  flag: string;         // vlag-emoji
  readingLabel: string; // naam van het lezingssysteem: Romaji / Pinyin / Jyutping
  scriptNote: string;   // instructie voor AI-prompts (fase 2)
  enabled: boolean;     // getoond in de taal-kiezer
}

export const LANGUAGES: LanguageDef[] = [
  { code: "ja",  label: "Japans",      flag: "🇯🇵", readingLabel: "Romaji",      scriptNote: "in kanji/kana",                              enabled: true },
  { code: "zh",  label: "Mandarijns",  flag: "🇨🇳", readingLabel: "Pinyin",      scriptNote: "in Vereenvoudigd Chinees (简体字)",           enabled: true },
  { code: "yue", label: "Kantonees",   flag: "🇭🇰", readingLabel: "Jyutping",    scriptNote: "in traditioneel Chinees schrift (Kantonees)", enabled: true },
  { code: "ko",  label: "Koreaans",    flag: "🇰🇷", readingLabel: "Romanisatie", scriptNote: "in Hangul",                                  enabled: true },
  { code: "id",  label: "Indonesisch", flag: "🇮🇩", readingLabel: "Uitspraak",   scriptNote: "in het Indonesisch",                         enabled: true },
  { code: "en",  label: "Engels",      flag: "🇬🇧", readingLabel: "Uitspraak",   scriptNote: "in het Engels",                              enabled: true },
  { code: "fr",  label: "Frans",       flag: "🇫🇷", readingLabel: "Uitspraak",   scriptNote: "in het Frans",                               enabled: true },
  { code: "de",  label: "Duits",       flag: "🇩🇪", readingLabel: "Uitspraak",   scriptNote: "in het Duits",                               enabled: true },
  { code: "es",  label: "Spaans",      flag: "🇪🇸", readingLabel: "Uitspraak",   scriptNote: "in het Spaans",                              enabled: true },
];

export const ENABLED_LANGUAGES = LANGUAGES.filter((l) => l.enabled);
export const DEFAULT_LANG: LangCode = "ja";

// Talen die zonder inloggen (demo-modus) bruikbaar zijn. De vaste demo-zinnen
// bevatten vertalingen voor precies deze talen; overige talen vereisen inloggen.
export const DEMO_LANGUAGES: LangCode[] = ["ja", "zh"];

export const isDemoLang = (code: string): code is LangCode =>
  (DEMO_LANGUAGES as string[]).includes(code);

export const getLanguage = (code: string): LanguageDef | undefined =>
  LANGUAGES.find((l) => l.code === code);

export const isLangCode = (code: string): code is LangCode =>
  LANGUAGES.some((l) => l.code === code);
