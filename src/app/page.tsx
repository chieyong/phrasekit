import Link from "next/link";
import CategoryCard from "@/components/cards/CategoryCard";
import PhraseCard from "@/components/cards/PhraseCard";
import { categories, phrases } from "@/data/mockData";

export default function HomePage() {
  const opgeslagenZinnen = phrases.filter((p) => p.isFavorite).slice(0, 2);

  return (
    <div className="page-content">

      {/* ── Woordmerk ─────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6">
        <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
          PhrasePath
        </h1>
        <p className="text-xs text-stone-400 mt-0.5 tracking-wide">
          Japanse reiszinnen
        </p>
      </div>

      {/* ── Vraag-knop ────────────────────────────────────────────── */}
      <div className="px-5 mb-8">
        <Link href="/ask">
          <div className="bg-stone-900 rounded-2xl px-5 py-4 flex items-center gap-4 active:opacity-80 transition-opacity">
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                Vraag iets in het Japans
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                Typ wat je wilt zeggen
              </p>
            </div>
            <span className="text-stone-500 text-sm shrink-0">→</span>
          </div>
        </Link>
      </div>

      {/* ── Situaties ─────────────────────────────────────────────── */}
      <section className="px-5 mb-8">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Situaties
        </p>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* ── Opgeslagen zinnen ─────────────────────────────────────── */}
      {opgeslagenZinnen.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
              Opgeslagen
            </p>
            <Link
              href="/favorites"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Bekijk alles
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {opgeslagenZinnen.map((phrase) => (
              <PhraseCard key={phrase.id} phrase={phrase} showCategory />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
