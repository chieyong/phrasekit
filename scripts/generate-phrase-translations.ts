/**
 * Genereert vooraf de vertalingen van alle statische reiszinnen (mockData.ts)
 * voor de talen die daar nog niet in staan (alles behalve ja/zh, die zijn
 * handgeschreven) en schrijft ze naar src/data/staticPhraseTranslations.json:
 *   { [phraseId]: { [lang]: { text, reading, explanation } } }
 *
 * mockData.ts merget dit bestand bij het laden (zie `phrases` export), zodat
 * elke zin in élke taal direct tekst + audio heeft — geen on-demand AI-call
 * meer nodig (die bestond toch alleen voor eigen zinnen van gebruikers, niet
 * voor de statische zinnen).
 *
 * Draaien:   npx tsx scripts/generate-phrase-translations.ts
 * Hervatbaar: bestaande vertalingen worden overgeslagen; na elke call wordt
 * het bestand weggeschreven.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGES } from "../src/data/languages";
import { phrasesBase } from "../src/data/mockData";
import { buildPhraseTranslatePrompt } from "../src/lib/phraseTranslatePrompt";

const ROOT     = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src", "data", "staticPhraseTranslations.json");
const SKIP_LANGS = new Set(["ja", "zh"]); // handgeschreven in mockData.ts

function apiKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = readFileSync(join(ROOT, ".env.local"), "utf8");
  const m = env.match(/^OPENAI_API_KEY=(.*)$/m);
  if (!m?.[1]?.trim()) throw new Error("OPENAI_API_KEY niet gevonden (env of .env.local)");
  return m[1].trim();
}
const KEY = apiKey();

interface Translated { text: string; reading: string; explanation: string }

async function translate(sourceText: string, lang: string): Promise<Translated> {
  const systemPrompt = buildPhraseTranslatePrompt(lang);
  if (!systemPrompt) throw new Error(`onbekende taal: ${lang}`);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: sourceText },
      ],
      temperature: 0.3,
      max_tokens: 400,
    }),
  });
  if (res.status === 429) throw Object.assign(new Error("rate limit"), { retryAfter: 15_000 });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("leeg antwoord");
  const parsed = JSON.parse(content);
  if (!parsed?.text) throw new Error("geen tekst in antwoord");
  return { text: parsed.text, reading: parsed.reading ?? "", explanation: parsed.explanation ?? "" };
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (err) {
      if (i >= tries) throw err;
      const wait = (err as { retryAfter?: number }).retryAfter ?? i * 5_000;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

const CONCURRENCY = 4;

async function main() {
  const out: Record<string, Record<string, Translated>> = existsSync(OUT_FILE)
    ? JSON.parse(readFileSync(OUT_FILE, "utf8"))
    : {};

  const langs = LANGUAGES.map((l) => l.code).filter((c) => !SKIP_LANGS.has(c));

  const todo: { id: string; sourceText: string; lang: string }[] = [];
  for (const p of phrasesBase) {
    out[p.id] ??= {};
    for (const lang of langs) {
      if (!out[p.id][lang]) todo.push({ id: p.id, sourceText: p.sourceText, lang });
    }
  }

  console.log(`${phrasesBase.length} zinnen × ${langs.length} talen — ${todo.length} te vertalen (${phrasesBase.length * langs.length - todo.length} al klaar)`);

  let ok = 0, fail = 0;
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch   = todo.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((t) => withRetry(() => translate(t.sourceText, t.lang)))
    );
    results.forEach((r, j) => {
      const t = batch[j];
      if (r.status === "fulfilled") {
        out[t.id][t.lang] = r.value;
        ok++;
        console.log(`  ✓ ${t.id} × ${t.lang}`);
      } else {
        fail++;
        console.log(`  ✗ ${t.id} × ${t.lang}: ${(r.reason as Error).message}`);
      }
    });
    writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + "\n");
  }

  console.log(`\nKlaar: ${ok} gegenereerd, ${fail} mislukt.${fail ? " Draai opnieuw voor de mislukte combinaties." : ""}`);
  if (fail) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
