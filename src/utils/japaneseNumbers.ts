// ─── Japanese Number Utilities ────────────────────────────────────────────────
//
// Handles counter-aware number replacement in Japanese travel phrases.
// Supports the most common travel counters: 枚 (flat/tickets), 名 (people polite),
// 人 (people casual), 泊 (nights).

// Counter kanji → romaji reading per number value
const COUNTER_READINGS: Record<string, Record<number, string>> = {
  枚: {
    1: "ichi-mai", 2: "ni-mai", 3: "san-mai", 4: "yon-mai", 5: "go-mai",
    6: "roku-mai", 7: "nana-mai", 8: "hachi-mai", 9: "kyuu-mai", 10: "juu-mai",
  },
  名: {
    1: "ichi-mei", 2: "ni-mei", 3: "san-mei", 4: "yon-mei", 5: "go-mei",
    6: "roku-mei", 7: "nana-mei", 8: "hachi-mei", 9: "kyuu-mei", 10: "juu-mei",
  },
  人: {
    1: "hitori", 2: "futari", 3: "san-nin", 4: "yo-nin", 5: "go-nin",
    6: "roku-nin", 7: "nana-nin", 8: "hachi-nin", 9: "kyuu-nin", 10: "juu-nin",
  },
  泊: {
    1: "ippaku", 2: "ni-haku", 3: "san-paku", 4: "yon-haku", 5: "go-haku",
    6: "roppaku", 7: "nana-haku", 8: "happaku", 9: "kyuu-haku", 10: "juppaku",
  },
};

// Plain number readings with no counter
const PLAIN_READINGS: Record<number, string> = {
  1: "ichi", 2: "ni", 3: "san", 4: "yon", 5: "go",
  6: "roku", 7: "nana", 8: "hachi", 9: "kyuu", 10: "juu",
};

// ── Detection ─────────────────────────────────────────────────────────────────

/** Return all unique digit values found in a Japanese text string. */
export function detectDigitsInText(text: string): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(/(\d+)/g)) {
    const n = parseInt(match[1], 10);
    if (n >= 1) found.add(n);
  }
  return [...found];
}

// ── Replacement ───────────────────────────────────────────────────────────────

/**
 * Replace a standalone digit value in Japanese text.
 * Uses a negative look-ahead/behind to avoid replacing "2" inside "12".
 */
export function replaceDigitInText(
  text: string,
  oldValue: number,
  newValue: number
): string {
  return text.replace(
    new RegExp(`(?<!\\d)${oldValue}(?!\\d)`, "g"),
    String(newValue)
  );
}

/**
 * Replace a number reading in romaji, counter-aware when possible.
 * Falls back to plain reading, then digit replacement.
 */
export function replaceDigitInRomaji(
  romaji: string,
  oldValue: number,
  newValue: number
): string {
  if (oldValue < 1 || oldValue > 10 || newValue < 1 || newValue > 10) {
    return replaceDigitInText(romaji, oldValue, newValue);
  }

  // Try each counter's reading first
  for (const readings of Object.values(COUNTER_READINGS)) {
    const oldReading = readings[oldValue];
    const newReading = readings[newValue];
    if (!oldReading || !newReading) continue;
    // Allow optional hyphen/space variation (e.g. "ni mai" vs "ni-mai")
    const pattern = new RegExp(oldReading.replace("-", "[- ]?"), "gi");
    if (pattern.test(romaji)) {
      return romaji.replace(pattern, newReading);
    }
  }

  // Fallback: plain reading
  const oldPlain = PLAIN_READINGS[oldValue];
  const newPlain = PLAIN_READINGS[newValue];
  if (oldPlain && newPlain) {
    const pattern = new RegExp(`\\b${oldPlain}\\b`, "gi");
    if (pattern.test(romaji)) {
      return romaji.replace(pattern, newPlain);
    }
  }

  // Last resort: digit replacement
  return replaceDigitInText(romaji, oldValue, newValue);
}

// ── Segment Parsing ───────────────────────────────────────────────────────────

export type TextSegment =
  | { type: "text"; content: string }
  | { type: "number"; value: number };

/**
 * Split a text string into alternating text and number segments.
 * Used to render editable NumberChips inline within Japanese text.
 */
export function parseTextSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(/(\d+)/g)) {
    const start = match.index!;
    if (start > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, start) });
    }
    segments.push({ type: "number", value: parseInt(match[1], 10) });
    lastIndex = start + match[1].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", content: text }];
}
