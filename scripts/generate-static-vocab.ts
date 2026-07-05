/**
 * Genereert vooraf de vertalingen van de statische woordenlijsten (staticVocab)
 * voor alle app-talen en schrijft ze naar src/data/staticVocabTranslations.json:
 *   { [categoryId]: { [nederlands ankerwoord, lowercase]: { [lang]: { text, reading } } } }
 *
 * staticVocab.ts merget dit bestand bij het laden, zodat de Woorden-tab in elke
 * taal direct gevuld is (geen vertaal-call per gebruiker meer). Handgeschreven
 * ja/zh-vertalingen in staticVocab houden voorrang.
 *
 * Draaien:   npx tsx scripts/generate-static-vocab.ts
 * Hervatbaar: bestaande vertalingen worden overgeslagen; na elke call wordt
 * het bestand weggeschreven.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGES } from "../src/data/languages";
import { staticVocabBase } from "../src/data/staticVocab";
import { vocabTranslateSystemPrompt } from "../src/lib/vocabTranslatePrompt";

const ROOT     = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src", "data", "staticVocabTranslations.json");

function apiKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = readFileSync(join(ROOT, ".env.local"), "utf8");
  const m = env.match(/^OPENAI_API_KEY=(.*)$/m);
  if (!m?.[1]?.trim()) throw new Error("OPENAI_API_KEY niet gevonden (env of .env.local)");
  return m[1].trim();
}
const KEY = apiKey();

const ckey = (d: string) => d.trim().toLowerCase();

// Eén taal × één categorie vertalen (zelfde model/prompt als de API-route).
async function translate(words: { dutch: string; type?: string }[], lang: string) {
  const list = words.map((w, i) => `${i + 1}. ${w.dutch}${w.type ? ` (${w.type})` : ""}`).join("\n");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: vocabTranslateSystemPrompt(lang) },
        { role: "user",   content: list },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("leeg antwoord");
  const parsed = JSON.parse(content);
  return (parsed.translations ?? []) as { dutch: string; text: string; reading: string }[];
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, i * 5_000));
    }
  }
}

type TrMap = Record<string, Record<string, Record<string, { text: string; reading: string }>>>;

async function main() {
  const out: TrMap = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : {};
  const langs = LANGUAGES.map((l) => l.code);
  let calls = 0, fails = 0;

  for (const [cat, concepts] of Object.entries(staticVocabBase)) {
    out[cat] ??= {};
    for (const lang of langs) {
      // Alleen woorden zonder handgeschreven én zonder eerder gegenereerde vertaling.
      const missing = concepts.filter((c) => !c.tr[lang] && !out[cat][ckey(c.dutch)]?.[lang]);
      if (!missing.length) continue;
      try {
        const translations = await withRetry(() =>
          translate(missing.map((c) => ({ dutch: c.dutch, type: c.type })), lang)
        );
        const byDutch = new Map(translations.map((t) => [ckey(t.dutch), t]));
        for (const c of missing) {
          const t = byDutch.get(ckey(c.dutch));
          if (t?.text) {
            out[cat][ckey(c.dutch)] ??= {};
            out[cat][ckey(c.dutch)][lang] = { text: t.text, reading: t.reading ?? "" };
          }
        }
        calls++;
        console.log(`✓ ${cat} × ${lang} (${missing.length} woorden)`);
        writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + "\n");
      } catch (err) {
        fails++;
        console.log(`✗ ${cat} × ${lang}: ${(err as Error).message}`);
      }
    }
  }

  console.log(`\nKlaar: ${calls} calls, ${fails} mislukt.${fails ? " Draai opnieuw voor de mislukte combinaties." : ""}`);
  if (fails) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
