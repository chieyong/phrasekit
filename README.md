# PhrasePath 🗾

A calm, practical travel phrase companion for Japan. Situation-based, mobile-first, and built for speed in stressful moments.

---

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & run

```bash
cd phrasepath
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For the best experience, open DevTools → Toggle device toolbar and select a mobile viewport (e.g. iPhone 14).

### Build for production

```bash
npm run build
npm start
```

---

## Project structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root layout + bottom nav
│   ├── page.tsx             # Home screen
│   ├── category/[id]/       # Category phrase list
│   ├── phrase/[id]/         # Phrase detail view
│   ├── favorites/           # Saved phrases
│   └── ask/                 # Ask Now (live input)
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx    # Fixed bottom navigation
│   │   └── Header.tsx       # Sticky page header with back button
│   ├── cards/
│   │   ├── CategoryCard.tsx # Home category grid tile
│   │   ├── PhraseCard.tsx   # Compact phrase card with actions
│   │   └── ResultCard.tsx   # Ask Now result card
│   └── ui/
│       ├── Badge.tsx        # Tag/label badge
│       ├── Button.tsx       # Shared button component
│       └── SearchBar.tsx    # Search input with clear
├── data/
│   └── mockData.ts          # Categories, phrases, Ask Now mock responses
├── hooks/
│   └── useFavorites.ts      # Client-side favorites (localStorage)
└── types/
    └── index.ts             # Shared TypeScript types
```

---

## Current state (prototype)

All data is mocked locally — no backend required. The app is fully navigable:

| Feature | Status |
|---|---|
| Home with category grid | ✅ |
| Category phrase list + search | ✅ |
| Phrase detail with word breakdown | ✅ |
| Favorites with category filter | ✅ |
| Ask Now with example chips | ✅ |
| Favorite toggling (persisted) | ✅ |
| Audio playback | 🔜 Wired up, awaiting TTS |
| Grammar explanation | 🔜 Wired up, awaiting AI |
| Real AI translation | 🔜 Wired up, awaiting API |

---

## Future integrations

### AI-powered Ask Now

Replace `getMockAskNowResult()` in `src/app/ask/page.tsx` with a real API route:

```ts
// src/app/api/ask/route.ts
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  const { query } = await req.json();
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Translate the following into natural Japanese for a traveler.
Return JSON with keys: translatedText, romaji, explanation, shortVersion { translatedText, romaji, label }, politeVersion { translatedText, romaji, label }.

Input: "${query}"`
    }]
  });

  return Response.json(JSON.parse(message.content[0].text));
}
```

### Audio playback

**Option A — Web Speech API (free, works offline):**
```ts
const utterance = new SpeechSynthesisUtterance(phrase.translatedText);
utterance.lang = "ja-JP";
utterance.rate = 0.85;
speechSynthesis.speak(utterance);
```

**Option B — Google Cloud TTS or ElevenLabs (higher quality):**
```ts
const res = await fetch("/api/tts", {
  method: "POST",
  body: JSON.stringify({ text: phrase.translatedText })
});
const { audioUrl } = await res.json();
new Audio(audioUrl).play();
```

Look for `// TODO: integrate text-to-speech` comments throughout the codebase.

### User accounts + cloud sync

Replace the `localStorage` store in `useFavorites.ts` with Supabase or Firebase:

```ts
await supabase.from("favorites").upsert({ user_id, phrase_id });
```

### Grammar explanations

Add a `/api/explain` endpoint. Display results in a modal/bottom-sheet on the phrase detail screen.

---

## Design principles

- **One primary action per screen** — reduce cognitive load in stressful moments
- **Large tap targets (min 44px)** — comfortable one-handed use
- **Warm off-white base (#faf9f7)** — calm, not sterile
- **Rounded corners everywhere** — approachable and soft
- **Mobile-first, max-width: 448px** — phone-sized even on desktop

---

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- No external UI library — all custom components
