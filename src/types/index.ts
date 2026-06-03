// ─── Core Data Models ──────────────────────────────────────────────────────

export interface Phrase {
  id: string;
  categoryId: string;
  sourceText: string;       // English
  translatedText: string;   // Japanese (kanji/kana)
  romaji: string;           // Pronunciation guide
  explanation: string;      // Plain-English meaning note
  wordBreakdown?: WordBreakdown[]; // Word-by-word for detail view
  shortVersion?: PhraseVariant;
  politeVersion?: PhraseVariant;
  tags: string[];
  isFavorite: boolean;
  sortOrder?: number;
  grammarExplanation?: GrammarExplanation;
}

export interface GrammarExplanation {
  summary: string;
  parts: { japanese: string; romaji: string; role: string; note?: string }[];
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
  // Future: grammarExplanation, audioUrl, etc.
}

// ─── Chip suggestions for Ask Now screen ────────────────────────────────────

export interface ExampleChip {
  label: string;
  query: string;
}
