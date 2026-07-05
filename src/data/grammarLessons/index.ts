import type { GrammarModuleDetail } from "@/hooks/useGrammarModules";

// Statisch voorgegenereerde leerpad-lessen (zie scripts/generate-grammar-lessons.ts):
// per taal een JSON met topic.id → les. Dynamische import zodat een taalbestand
// pas laadt bij gebruik — en gerust mag ontbreken (dan valt de app terug op de
// bestaande Firestore/AI-route).
const cache = new Map<string, Record<string, GrammarModuleDetail> | null>();

export async function getStaticLesson(lang: string, topicId: string): Promise<GrammarModuleDetail | null> {
  if (!cache.has(lang)) {
    try {
      const mod = await import(`./${lang}.json`);
      cache.set(lang, mod.default as Record<string, GrammarModuleDetail>);
    } catch {
      cache.set(lang, null);
    }
  }
  return cache.get(lang)?.[topicId] ?? null;
}
