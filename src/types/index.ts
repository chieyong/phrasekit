// ─── Core Data Models ──────────────────────────────────────────────────────

export interface Phrase {
  id: string;
  categoryId: string;
  sourceText: string;       // Dutch
  translatedText: string;   // Japanese (kanji/kana)
  romaji: string;
  explanation: string;
  wordBreakdown?: WordBreakdown[];
  shortVersion?: PhraseVariant;
  politeVersion?: PhraseVariant;
  tags: string[];
  isFavorite: boolean;
  sortOrder?: number;
  grammarExplanation?: GrammarExplanation;
  // Chinese (optional — present when translated after Chinese support was added)
  chineseText?: string;
  pinyin?: string;
  chineseExplanation?: string;
  chineseGrammar?: GrammarExplanation;
}

export interface GrammarExplanation {
  summary: string;
  meaning?: string;   // natuurlijke betekenis-parafrase ("betekent: …")
  parts: { japanese: string; romaji: string; role: string; note?: string }[];
  synthesis?: string; // samenvattende regel onder de opbouw ("Samen geeft ~X aan dat…")
  examples?: { japanese: string; romaji: string; dutch: string }[];
  responses?: { japanese: string; romaji: string; dutch: string }[]; // Mogelijke reactie
  tip: string;
}

export interface PhraseVariant {
  translatedText: string;
  romaji: string;
  label: string; // e.g. "Shorter", "More polite"
}

export interface WordBreakdown {
  word: string;
  reading: string;
  meaning: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;       // Emoji icon
  color: string;      // Tailwind bg class
  accentColor: string; // Tailwind text class
  description: string;
}

// ─── Ask Now ────────────────────────────────────────────────────────────────

export interface AskNowResult {
  sourceText: string;
  translatedText: string;
  romaji: string;
  explanation: string;
  shortVersion?: PhraseVariant;
  politeVersion?: PhraseVariant;
  // Chinese (present when API returns both languages)
  chineseText?: string;
  pinyin?: string;
  chineseExplanation?: string;
}

// ─── Chip suggestions for Ask Now screen ────────────────────────────────────

export interface ExampleChip {
  label: string;
  query: string;
}
