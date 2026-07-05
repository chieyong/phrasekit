/**
 * Genereert alle grammatica-leerpad-lessen vooraf en schrijft ze naar
 * src/data/grammarLessons/{taal}.json (sleutel = topic.id). De app leest die
 * bundel eerst, zodat een les direct opent zonder AI-call per gebruiker.
 *
 * Draaien:   npx tsx scripts/generate-grammar-lessons.ts            # alle talen
 *            npx tsx scripts/generate-grammar-lessons.ts ja zh      # alleen deze talen
 *            npx tsx scripts/generate-grammar-lessons.ts --limit=2  # max 2 lessen per taal (test)
 *
 * Hervatbaar: bestaande lessen in de JSON worden overgeslagen en het bestand
 * wordt na elke batch weggeschreven — bij een onderbreking gewoon opnieuw starten.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGES } from "../src/data/languages";
import { getCurriculum } from "../src/data/grammarCurriculum";
import { buildLessonMessages } from "../src/lib/grammarLessonPrompt";

const ROOT        = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR     = join(ROOT, "src", "data", "grammarLessons");
const CONCURRENCY = 4;

// ── API-key uit env of .env.local ────────────────────────────────────────────
function apiKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = readFileSync(join(ROOT, ".env.local"), "utf8");
  const m = env.match(/^OPENAI_API_KEY=(.*)$/m);
  if (!m?.[1]?.trim()) throw new Error("OPENAI_API_KEY niet gevonden (env of .env.local)");
  return m[1].trim();
}
const KEY = apiKey();

// ── Eén les genereren (zelfde model/parameters als de API-route) ─────────────
async function generateLesson(naam: string, lang: string): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: buildLessonMessages(naam, lang, []),
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });
  if (res.status === 429) throw Object.assign(new Error("rate limit"), { retryAfter: 20_000 });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("leeg antwoord");
  const parsed = JSON.parse(content);
  if (!parsed?.kernregel) throw new Error("onvolledige les (geen kernregel)");
  return parsed;
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

// ── Hoofdlus ──────────────────────────────────────────────────────────────────
async function main() {
  const args     = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit    = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const langArgs = args.filter((a) => !a.startsWith("--"));

  const langs = LANGUAGES
    .map((l) => l.code)
    .filter((c) => getCurriculum(c) && (langArgs.length === 0 || langArgs.includes(c)));

  mkdirSync(OUT_DIR, { recursive: true });
  let okTotal = 0, failTotal = 0;

  for (const lang of langs) {
    const topics  = getCurriculum(lang)!.topics;
    const outFile = join(OUT_DIR, `${lang}.json`);
    const lessons: Record<string, unknown> = existsSync(outFile)
      ? JSON.parse(readFileSync(outFile, "utf8"))
      : {};

    const todo = topics.filter((t) => !lessons[t.id]).slice(0, limit);
    console.log(`\n── ${lang}: ${topics.length} lessen, ${topics.length - todo.length} al klaar, ${todo.length} te gaan`);

    for (let i = 0; i < todo.length; i += CONCURRENCY) {
      const batch   = todo.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((t) => withRetry(() => generateLesson(t.naam, lang)))
      );
      results.forEach((r, j) => {
        const t = batch[j];
        if (r.status === "fulfilled") {
          lessons[t.id] = r.value;
          okTotal++;
          console.log(`  ✓ ${t.id}`);
        } else {
          failTotal++;
          console.log(`  ✗ ${t.id}: ${(r.reason as Error).message}`);
        }
      });
      // Na elke batch wegschrijven → onderbreking kost hooguit één batch.
      writeFileSync(outFile, JSON.stringify(lessons, null, 1) + "\n");
    }
  }

  console.log(`\nKlaar: ${okTotal} gegenereerd, ${failTotal} mislukt.${failTotal ? " Draai opnieuw voor de mislukte lessen." : ""}`);
  if (failTotal) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
