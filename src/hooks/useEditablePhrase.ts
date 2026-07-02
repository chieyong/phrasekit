"use client";

import { useState, useCallback, useMemo } from "react";
import { Phrase, PhraseVariant } from "@/types";
import {
  detectDigitsInText,
  replaceDigitInText,
  replaceDigitInRomaji,
} from "@/utils/japaneseNumbers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditedPhraseState {
  translatedText: string;
  romaji: string;
  shortVersion?: PhraseVariant;
  politeVersion?: PhraseVariant;
}

export interface UseEditablePhraseReturn {
  /** The phrase with current number edits applied */
  edited: EditedPhraseState;
  /**
   * Map of originalDigitValue → currentValue.
   * Use this to look up what a number chip should currently display.
   */
  numberMap: Map<number, number>;
  /** Whether any numbers have been changed from their originals */
  hasChanges: boolean;
  /** Change an original digit value to a new one */
  updateNumber: (originalValue: number, newValue: number) => void;
  /** Reset all edits back to the original phrase values */
  reset: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyMap(
  text: string,
  romaji: string,
  map: Map<number, number>
): { text: string; romaji: string } {
  let t = text;
  let r = romaji;
  for (const [orig, curr] of map) {
    if (orig !== curr) {
      t = replaceDigitInText(t, orig, curr);
      r = replaceDigitInRomaji(r, orig, curr);
    }
  }
  return { text: t, romaji: r };
}

function applyMapToVariant(
  variant: PhraseVariant,
  map: Map<number, number>
): PhraseVariant {
  const result = applyMap(variant.translatedText, variant.romaji, map);
  return { ...variant, translatedText: result.text, romaji: result.romaji };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages editable number state for a phrase.
 *
 * Scans the translated Japanese text for Arabic numerals and makes them
 * independently editable. All variants (short, polite) update in sync.
 *
 * Render the Japanese text using parseTextSegments() from japaneseNumbers.ts
 * together with the returned numberMap to display NumberChip components inline.
 */
export function useEditablePhrase(phrase: Phrase): UseEditablePhraseReturn {
  // Detect original digit values in the translated text once
  const originalDigits = useMemo(
    () => detectDigitsInText(phrase.translatedText ?? ""),
    [phrase.translatedText]
  );

  // numberMap: originalValue → currentValue (identity initially)
  const [numberMap, setNumberMap] = useState<Map<number, number>>(
    () => new Map(originalDigits.map((n) => [n, n]))
  );

  const edited = useMemo((): EditedPhraseState => {
    const main = applyMap(phrase.translatedText ?? "", phrase.romaji ?? "", numberMap);

    return {
      translatedText: main.text,
      romaji: main.romaji,
      shortVersion: phrase.shortVersion
        ? applyMapToVariant(phrase.shortVersion, numberMap)
        : undefined,
      politeVersion: phrase.politeVersion
        ? applyMapToVariant(phrase.politeVersion, numberMap)
        : undefined,
    };
  }, [phrase, numberMap]);

  const updateNumber = useCallback(
    (originalValue: number, newValue: number) => {
      setNumberMap((prev) => {
        const next = new Map(prev);
        next.set(originalValue, newValue);
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    setNumberMap(new Map(originalDigits.map((n) => [n, n])));
  }, [originalDigits]);

  const hasChanges = useMemo(
    () => [...numberMap.entries()].some(([orig, curr]) => orig !== curr),
    [numberMap]
  );

  return { edited, numberMap, hasChanges, updateNumber, reset };
}
