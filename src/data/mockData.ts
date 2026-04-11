import { Category, Phrase, ExampleChip, AskNowResult } from "@/types";

// ─── Categorieën ──────────────────────────────────────────────────────────────

export const categories: Category[] = [
  {
    id: "station",
    name: "Station",
    icon: "🚃",
    color: "bg-blue-50",
    accentColor: "text-blue-600",
    description: "Treinen, kaartjes, perrons en richtingen",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    icon: "🍜",
    color: "bg-orange-50",
    accentColor: "text-orange-600",
    description: "Bestellen, allergieën en de rekening",
  },
  {
    id: "hotel",
    name: "Hotel",
    icon: "🏨",
    color: "bg-purple-50",
    accentColor: "text-purple-600",
    description: "Inchecken, verzoeken en kamerbehoeften",
  },
  {
    id: "winkels",
    name: "Winkels",
    icon: "🛍️",
    color: "bg-pink-50",
    accentColor: "text-pink-600",
    description: "Winkelen, prijzen en artikelen vinden",
  },
  {
    id: "noodgeval",
    name: "Noodgeval",
    icon: "🆘",
    color: "bg-red-50",
    accentColor: "text-red-600",
    description: "Medisch, politie en dringende hulp",
  },
];

// ─── Zinnen ───────────────────────────────────────────────────────────────────

export const phrases: Phrase[] = [
  // STATION
  {
    id: "s1",
    categoryId: "station",
    sourceText: "Twee kaartjes naar Shibuya, alstublieft.",
    translatedText: "渋谷まで2枚お願いします。",
    romaji: "Shibuya made ni-mai onegai shimasu.",
    explanation:
      "Een beleefde manier om twee kaartjes naar Shibuya te kopen bij een loket of automaat.",
    wordBreakdown: [
      { word: "渋谷まで", reading: "Shibuya made", meaning: "naar Shibuya" },
      { word: "2枚", reading: "ni-mai", meaning: "twee (platte dingen)" },
      { word: "お願いします", reading: "onegai shimasu", meaning: "alstublieft" },
    ],
    shortVersion: {
      translatedText: "渋谷、2枚。",
      romaji: "Shibuya, ni-mai.",
      label: "Kort",
    },
    politeVersion: {
      translatedText: "渋谷まで2枚いただけますか？",
      romaji: "Shibuya made ni-mai itadakemasu ka?",
      label: "Beleefder",
    },
    tags: ["kaartjes", "vervoer"],
    isFavorite: false,
  },
  {
    id: "s2",
    categoryId: "station",
    sourceText: "Gaat deze trein naar Shinjuku?",
    translatedText: "この電車は新宿に行きますか？",
    romaji: "Kono densha wa Shinjuku ni ikimasu ka?",
    explanation: "Vraag of de huidige trein stopt in of rijdt naar Shinjuku.",
    wordBreakdown: [
      { word: "この電車は", reading: "kono densha wa", meaning: "deze trein" },
      { word: "新宿に", reading: "Shinjuku ni", meaning: "naar Shinjuku" },
      { word: "行きますか", reading: "ikimasu ka", meaning: "gaat hij?" },
    ],
    shortVersion: {
      translatedText: "この電車、新宿？",
      romaji: "Kono densha, Shinjuku?",
      label: "Kort",
    },
    tags: ["treinen", "richting"],
    isFavorite: true,
  },
  {
    id: "s3",
    categoryId: "station",
    sourceText: "Welk perron voor Kyoto?",
    translatedText: "京都行きは何番線ですか？",
    romaji: "Kyōto yuki wa nan-ban-sen desu ka?",
    explanation: "Vraag het perron nummer voor de trein naar Kyoto.",
    wordBreakdown: [
      { word: "京都行きは", reading: "Kyōto yuki wa", meaning: "richting Kyoto" },
      { word: "何番線", reading: "nan-ban-sen", meaning: "welk perron" },
      { word: "ですか", reading: "desu ka", meaning: "is het?" },
    ],
    tags: ["perron", "richting"],
    isFavorite: false,
  },
  {
    id: "s4",
    categoryId: "station",
    sourceText: "Hoeveel kost een kaartje naar Osaka?",
    translatedText: "大阪までいくらですか？",
    romaji: "Ōsaka made ikura desu ka?",
    explanation: "Vraag naar de kaartjesprijs naar Osaka.",
    tags: ["prijs", "kaartjes"],
    isFavorite: false,
  },
  {
    id: "s5",
    categoryId: "station",
    sourceText: "Ik heb mijn trein gemist. Wat moet ik doen?",
    translatedText: "電車に乗り遅れました。どうすればいいですか？",
    romaji: "Densha ni noriokuremashita. Dō sureba ii desu ka?",
    explanation:
      "Vertel het personeel dat je je trein hebt gemist en vraag wat je nu moet doen.",
    tags: ["gemiste trein", "hulp"],
    isFavorite: false,
  },
  {
    id: "s6",
    categoryId: "station",
    sourceText: "Waar is de uitgang?",
    translatedText: "出口はどこですか？",
    romaji: "Deguchi wa doko desu ka?",
    explanation: "Vraag waar de uitgang is — handig op grote stations.",
    shortVersion: {
      translatedText: "出口は？",
      romaji: "Deguchi wa?",
      label: "Kort",
    },
    tags: ["uitgang", "richting"],
    isFavorite: false,
  },

  // RESTAURANT
  {
    id: "r1",
    categoryId: "restaurant",
    sourceText: "Een tafel voor twee, alstublieft.",
    translatedText: "2名でお願いします。",
    romaji: "Ni-mei de onegai shimasu.",
    explanation: "Vraag om een tafel voor twee personen bij het binnenkomen.",
    shortVersion: {
      translatedText: "2名です。",
      romaji: "Ni-mei desu.",
      label: "Kort",
    },
    politeVersion: {
      translatedText: "2名で席をお願いできますか？",
      romaji: "Ni-mei de seki wo onegai dekimasu ka?",
      label: "Beleefder",
    },
    tags: ["zitten"],
    isFavorite: true,
  },
  {
    id: "r2",
    categoryId: "restaurant",
    sourceText: "Ik ben allergisch voor schaaldieren.",
    translatedText: "甲殻類アレルギーがあります。",
    romaji: "Kōkakurui arerugī ga arimasu.",
    explanation:
      "Vertel het restaurant dat je een allergie hebt voor schaaldieren. Belangrijk voor je veiligheid.",
    tags: ["allergie", "gezondheid"],
    isFavorite: false,
  },
  {
    id: "r3",
    categoryId: "restaurant",
    sourceText: "Ik neem hetzelfde als zij.",
    translatedText: "あの人と同じものをください。",
    romaji: "Ano hito to onaji mono wo kudasai.",
    explanation:
      "Wijs naar het gerecht van een andere gast en vraag hetzelfde — altijd handig!",
    shortVersion: {
      translatedText: "同じものを。",
      romaji: "Onaji mono wo.",
      label: "Kort",
    },
    tags: ["bestellen"],
    isFavorite: false,
  },
  {
    id: "r4",
    categoryId: "restaurant",
    sourceText: "De rekening, alstublieft.",
    translatedText: "お会計をお願いします。",
    romaji: "O-kaikei wo onegai shimasu.",
    explanation:
      "Vraag om de rekening. Je kunt ook de bediening aankijken en schrijfbewegingen maken.",
    shortVersion: {
      translatedText: "お会計！",
      romaji: "O-kaikei!",
      label: "Kort",
    },
    tags: ["rekening", "betalen"],
    isFavorite: true,
  },
  {
    id: "r5",
    categoryId: "restaurant",
    sourceText: "Heeft u een Engelstalig menu?",
    translatedText: "英語のメニューはありますか？",
    romaji: "Eigo no menyū wa arimasu ka?",
    explanation: "Vraag of er een menu in het Engels beschikbaar is.",
    tags: ["menu", "engels"],
    isFavorite: false,
  },
  {
    id: "r6",
    categoryId: "restaurant",
    sourceText: "Dit is heerlijk!",
    translatedText: "おいしい！",
    romaji: "Oishii!",
    explanation:
      "Geef aan dat het eten erg lekker is. Wordt altijd gewaardeerd door kok of personeel.",
    tags: ["compliment"],
    isFavorite: false,
  },

  // HOTEL
  {
    id: "h1",
    categoryId: "hotel",
    sourceText: "Ik heb een reservering onder de naam Jansen.",
    translatedText: "ヤンセンで予約しています。",
    romaji: "Yansen de yoyaku shite imasu.",
    explanation:
      "Geef bij de receptie je achternaam en vertel dat je een reservering hebt.",
    tags: ["inchecken", "reservering"],
    isFavorite: false,
  },
  {
    id: "h2",
    categoryId: "hotel",
    sourceText: "Kan ik laat uitchecken?",
    translatedText: "レイトチェックアウトはできますか？",
    romaji: "Reito chekku-auto wa dekimasu ka?",
    explanation: "Vraag om een later uitcheckmoment dan de standaardtijd.",
    politeVersion: {
      translatedText: "レイトチェックアウトをお願いできますでしょうか？",
      romaji: "Reito chekku-auto wo onegai dekimasu deshō ka?",
      label: "Beleefder",
    },
    tags: ["uitchecken"],
    isFavorite: false,
  },
  {
    id: "h3",
    categoryId: "hotel",
    sourceText: "De airconditioning werkt niet.",
    translatedText: "エアコンが壊れています。",
    romaji: "Eakon ga kowarete imasu.",
    explanation: "Meld een kapotte airconditioning bij de receptie.",
    tags: ["onderhoud", "kamer"],
    isFavorite: false,
  },
  {
    id: "h4",
    categoryId: "hotel",
    sourceText: "Kan ik extra handdoeken krijgen?",
    translatedText: "タオルを追加でいただけますか？",
    romaji: "Taoru wo tsuika de itadakemasu ka?",
    explanation: "Vraag om extra handdoeken bij de receptie of het schoonmaakpersoneel.",
    shortVersion: {
      translatedText: "タオルを追加で。",
      romaji: "Taoru wo tsuika de.",
      label: "Kort",
    },
    tags: ["kamer", "faciliteiten"],
    isFavorite: false,
  },

  // WINKELS
  {
    id: "sh1",
    categoryId: "winkels",
    sourceText: "Heeft u dit in een grotere maat?",
    translatedText: "もっと大きいサイズはありますか？",
    romaji: "Motto ōkii saizu wa arimasu ka?",
    explanation: "Vraag of een kledingstuk in een grotere maat beschikbaar is.",
    shortVersion: {
      translatedText: "大きいサイズは？",
      romaji: "Ōkii saizu wa?",
      label: "Kort",
    },
    tags: ["kleding", "maat"],
    isFavorite: false,
  },
  {
    id: "sh2",
    categoryId: "winkels",
    sourceText: "Hoeveel kost dit?",
    translatedText: "これはいくらですか？",
    romaji: "Kore wa ikura desu ka?",
    explanation: "Vraag de prijs van een artikel dat je vasthoudt of aanwijst.",
    shortVersion: {
      translatedText: "いくらですか？",
      romaji: "Ikura desu ka?",
      label: "Kort",
    },
    tags: ["prijs"],
    isFavorite: false,
  },
  {
    id: "sh3",
    categoryId: "winkels",
    sourceText: "Kan ik met kaart betalen?",
    translatedText: "カードで払えますか？",
    romaji: "Kādo de haraemasu ka?",
    explanation:
      "Controleer of pinpas of creditcard geaccepteerd wordt voordat je aan de kassa staat.",
    tags: ["betalen", "kaart"],
    isFavorite: false,
  },
  {
    id: "sh4",
    categoryId: "winkels",
    sourceText: "Heeft u een belastingvrije service?",
    translatedText: "免税サービスはありますか？",
    romaji: "Menzei sābisu wa arimasu ka?",
    explanation:
      "Vraag naar belastingteruggave (gebruikelijk voor toeristen die meer dan ¥5.000 uitgeven).",
    tags: ["belastingvrij", "winkelen"],
    isFavorite: false,
  },

  // NOODGEVAL
  {
    id: "e1",
    categoryId: "noodgeval",
    sourceText: "Bel alstublieft een ambulance.",
    translatedText: "救急車を呼んでください。",
    romaji: "Kyūkyūsha wo yonde kudasai.",
    explanation:
      "Dringend: vraag iemand een ambulance te bellen. Spreek dit duidelijk en vastberaden uit.",
    tags: ["medisch", "dringend"],
    isFavorite: false,
  },
  {
    id: "e2",
    categoryId: "noodgeval",
    sourceText: "Ik heb een dokter nodig.",
    translatedText: "医者が必要です。",
    romaji: "Isha ga hitsuyō desu.",
    explanation:
      "Geef aan dat je een dokter nodig hebt — gebruik dit in hotels, stations of winkels.",
    tags: ["medisch"],
    isFavorite: false,
  },
  {
    id: "e3",
    categoryId: "noodgeval",
    sourceText: "Ik ben mijn paspoort kwijt.",
    translatedText: "パスポートをなくしました。",
    romaji: "Pasupōto wo nakushimashita.",
    explanation:
      "Meld een verloren paspoort bij de politie of je ambassade. Blijf kalm.",
    tags: ["verloren", "documenten"],
    isFavorite: false,
  },
  {
    id: "e4",
    categoryId: "noodgeval",
    sourceText: "Bel alstublieft de politie.",
    translatedText: "警察を呼んでください。",
    romaji: "Keisatsu wo yonde kudasai.",
    explanation: "Vraag iemand in de buurt contact op te nemen met de politie.",
    tags: ["politie", "dringend"],
    isFavorite: false,
  },
  {
    id: "e5",
    categoryId: "noodgeval",
    sourceText: "Ik heb pijn op de borst.",
    translatedText: "胸が痛いです。",
    romaji: "Mune ga itai desu.",
    explanation: "Meld pijn op de borst aan een omstander of medisch personeel.",
    tags: ["medisch", "dringend"],
    isFavorite: false,
  },
];

// ─── Voorbeeldchips voor de Vraag-pagina ──────────────────────────────────────

export const exampleChips: ExampleChip[] = [
  { label: "4 kaartjes graag", query: "4 kaartjes naar Kyoto graag" },
  { label: "Gaat deze trein naar Shibuya?", query: "Gaat deze trein naar Shibuya?" },
  { label: "2 volwassenen + 2 kinderen", query: "2 volwassenen en 2 kinderen graag" },
  { label: "Waar is perron 3?", query: "Waar is perron 3?" },
  { label: "Ik ben vegetarisch", query: "Ik ben vegetarisch" },
  { label: "Niet te pittig", query: "Niet te pittig maken alstublieft" },
];

// ─── Mock Vraag-reacties (fallback) ───────────────────────────────────────────

export const mockAskNowResponses: Record<string, AskNowResult> = {
  default: {
    sourceText: "4 kaartjes naar Kyoto graag",
    translatedText: "京都まで4枚お願いします。",
    romaji: "Kyōto made yon-mai onegai shimasu.",
    explanation: "Een beleefde vraag om 4 kaartjes naar Kyoto bij het loket.",
    shortVersion: {
      translatedText: "京都、4枚。",
      romaji: "Kyōto, yon-mai.",
      label: "Kort",
    },
    politeVersion: {
      translatedText: "京都まで4枚いただけますか？",
      romaji: "Kyōto made yon-mai itadakemasu ka?",
      label: "Beleefder",
    },
  },
};

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getPhrasesByCategory(categoryId: string): Phrase[] {
  return phrases.filter((p) => p.categoryId === categoryId);
}

export function getPhraseById(id: string): Phrase | undefined {
  return phrases.find((p) => p.id === id);
}

export function getFavoritePhrases(): Phrase[] {
  return phrases.filter((p) => p.isFavorite);
}

export function getMockAskNowResult(query: string): AskNowResult {
  const key = Object.keys(mockAskNowResponses).find(
    (k) => k.toLowerCase() === query.toLowerCase()
  );
  return key
    ? mockAskNowResponses[key]
    : { ...mockAskNowResponses["default"], sourceText: query };
}
