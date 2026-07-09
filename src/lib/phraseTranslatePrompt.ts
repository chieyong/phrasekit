// Prompt voor het vertalen van één zin — gedeeld door de API-route
// (/api/translate-phrase) en het voorgeneratie-script
// (scripts/generate-phrase-translations.ts). Relatieve import zodat het
// script dit buiten Next om kan draaien.
import { getLanguage } from "../data/languages";

// Vertaalt één Nederlandse zin naar een doeltaal, opgebouwd uit het taalregister
// zodat elke (ook nieuwe) taal werkt. Levert tekst + lezing + korte uitleg.
export function buildPhraseTranslatePrompt(langCode: string): string | null {
  const l = getLanguage(langCode);
  if (!l) return null;
  // Talen zonder vast romanisatiesysteem: uitspraak "op z'n Nederlands", geen IPA.
  const uitspraakRegel = l.readingLabel === "Uitspraak"
    ? `\n- De uitspraak schrijf je "op z'n Nederlands": benader de klanken met gewone Nederlandse spelling, lettergrepen gescheiden door koppeltekens (bijv. "Was sind deine Hobbys?" → "vas zint dai-ne hob-ies"). GEEN IPA of fonetische tekens.`
    : "";
  return `Je bent een taalassistent voor Nederlandstalige reizigers. Vertaal de gegeven Nederlandse zin naar het ${l.label} (${l.scriptNote}), natuurlijk en geschikt voor dagelijkse reissituaties.

Reageer met ALLEEN geldig JSON:
{
  "text": "<vertaling ${l.scriptNote}>",
  "reading": "<${l.readingLabel}-lezing>",
  "explanation": "<in het Nederlands: wat de zin betekent en wanneer te gebruiken, max 2 zinnen>"
}

Regels:
- Natuurlijke, correcte vertaling — geen letterlijke woord-voor-woord vertaling.
- Geef de ${l.readingLabel}-lezing correct weer.${uitspraakRegel}`;
}
