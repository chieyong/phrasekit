import { Phrase, PhraseTranslation } from "@/types";

// Legacy-velden (ja/zh) → PhraseTranslation, of undefined.
function legacyTranslation(phrase: Phrase, lang: string): PhraseTranslation | undefined {
  if (lang === "ja" && phrase.translatedText) {
    return {
      text:          phrase.translatedText,
      reading:       phrase.romaji ?? "",
      explanation:   phrase.explanation,
      grammar:       phrase.grammarExplanation,
      shortVersion:  phrase.shortVersion,
      politeVersion: phrase.politeVersion,
      wordBreakdown: phrase.wordBreakdown,
    };
  }
  if (lang === "zh" && phrase.chineseText) {
    return {
      text:        phrase.chineseText,
      reading:     phrase.pinyin ?? "",
      explanation: phrase.chineseExplanation,
      grammar:     phrase.chineseGrammar,
    };
  }
  return undefined;
}

// Leest de vertaling van een zin voor een taalcode. `translations` heeft
// voorrang, maar legacy-velden vullen ontbrekende stukken aan (zo kan bijv.
// grammatica in `translations.ja.grammar` staan terwijl de tekst nog legacy is).
export function getPhraseTranslation(phrase: Phrase, lang: string): PhraseTranslation | undefined {
  const legacy = legacyTranslation(phrase, lang);
  const t = phrase.translations?.[lang];
  if (!t && !legacy) return undefined;

  const merged: PhraseTranslation = { text: "", reading: "", ...(legacy ?? {}) };
  if (t) {
    if (t.text          !== undefined) merged.text          = t.text;
    if (t.reading       !== undefined) merged.reading       = t.reading;
    if (t.explanation   !== undefined) merged.explanation   = t.explanation;
    if (t.grammar       !== undefined) merged.grammar       = t.grammar;
    if (t.shortVersion  !== undefined) merged.shortVersion  = t.shortVersion;
    if (t.politeVersion !== undefined) merged.politeVersion = t.politeVersion;
    if (t.wordBreakdown !== undefined) merged.wordBreakdown = t.wordBreakdown;
  }

  return merged.text ? merged : legacy;
}
