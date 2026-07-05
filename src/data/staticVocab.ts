// Vaste woordenschat bij de statische thema's. Twee rollen:
// 1. Demo-modus: zonder inloggen is er geen Firestore, dus de Woorden-tab
//    toont deze lijst rechtstreeks.
// 2. Ingelogd: eerste bezoek aan een thema seedt deze lijst naar Firestore
//    (in plaats van een AI-extractie) — direct resultaat, geen API-kosten.
//
// De basis hieronder bevat per concept de handgeschreven vertalingen voor
// Japans (ja) en Mandarijns (zh). De overige app-talen komen uit het
// voorgegenereerde staticVocabTranslations.json (zie
// scripts/generate-static-vocab.ts) en worden bij het laden gemerged, zodat de
// Woorden-tab in élke taal direct gevuld is. Handgeschreven vertalingen houden
// voorrang; ontbreekt een taal alsnog, dan vertaalt ensureLanguage die lui bij.

import type { VocabConcept } from "@/hooks/useVocabulary";
import generatedTranslations from "./staticVocabTranslations.json";

export const staticVocabBase: Record<string, VocabConcept[]> = {
  // ── Onderweg ────────────────────────────────────────────────────────────────
  station: [
    { dutch: "kaartje",  type: "noun", tr: { ja: { text: "切符",   reading: "kippu" },       zh: { text: "票",   reading: "piào" } } },
    { dutch: "station",  type: "noun", tr: { ja: { text: "駅",     reading: "eki" },         zh: { text: "车站", reading: "chēzhàn" } } },
    { dutch: "trein",    type: "noun", tr: { ja: { text: "電車",   reading: "densha" },      zh: { text: "电车", reading: "diànchē" } } },
    { dutch: "perron",   type: "noun", tr: { ja: { text: "ホーム", reading: "hōmu" },        zh: { text: "站台", reading: "zhàntái" } } },
    { dutch: "uitgang",  type: "noun", tr: { ja: { text: "出口",   reading: "deguchi" },     zh: { text: "出口", reading: "chūkǒu" } } },
    { dutch: "prijs",    type: "noun", tr: { ja: { text: "値段",   reading: "nedan" },       zh: { text: "价格", reading: "jiàgé" } } },
    { dutch: "gaan",     type: "verb", tr: { ja: { text: "行く",   reading: "iku" },         zh: { text: "去",   reading: "qù" } } },
    { dutch: "missen",   type: "verb", tr: { ja: { text: "乗り遅れる", reading: "noriokureru" }, zh: { text: "错过", reading: "cuòguò" } } },
  ],
  restaurant: [
    { dutch: "tafel",     type: "noun",      tr: { ja: { text: "席",       reading: "seki" },        zh: { text: "桌子", reading: "zhuōzi" } } },
    { dutch: "rekening",  type: "noun",      tr: { ja: { text: "会計",     reading: "kaikei" },      zh: { text: "账单", reading: "zhàngdān" } } },
    { dutch: "menu",      type: "noun",      tr: { ja: { text: "メニュー", reading: "menyū" },       zh: { text: "菜单", reading: "càidān" } } },
    { dutch: "allergie",  type: "noun",      tr: { ja: { text: "アレルギー", reading: "arerugī" },   zh: { text: "过敏", reading: "guòmǐn" } } },
    { dutch: "Engels",    type: "noun",      tr: { ja: { text: "英語",     reading: "eigo" },        zh: { text: "英文", reading: "Yīngwén" } } },
    { dutch: "lekker",    type: "adjective", tr: { ja: { text: "おいしい", reading: "oishii" },      zh: { text: "好吃", reading: "hǎochī" } } },
    { dutch: "bestellen", type: "verb",      tr: { ja: { text: "注文する", reading: "chūmon suru" }, zh: { text: "点菜", reading: "diǎncài" } } },
  ],
  hotel: [
    { dutch: "reservering",     type: "noun",      tr: { ja: { text: "予約",           reading: "yoyaku" },      zh: { text: "预订", reading: "yùdìng" } } },
    { dutch: "uitchecken",      type: "noun",      tr: { ja: { text: "チェックアウト", reading: "chekku-auto" }, zh: { text: "退房", reading: "tuìfáng" } } },
    { dutch: "airconditioning", type: "noun",      tr: { ja: { text: "エアコン",       reading: "eakon" },       zh: { text: "空调", reading: "kōngtiáo" } } },
    { dutch: "handdoek",        type: "noun",      tr: { ja: { text: "タオル",         reading: "taoru" },       zh: { text: "毛巾", reading: "máojīn" } } },
    { dutch: "kamer",           type: "noun",      tr: { ja: { text: "部屋",           reading: "heya" },        zh: { text: "房间", reading: "fángjiān" } } },
    { dutch: "kapot",           type: "verb",      tr: { ja: { text: "壊れる",         reading: "kowareru" },    zh: { text: "坏",   reading: "huài" } } },
  ],
  winkels: [
    { dutch: "maat",          type: "noun",      tr: { ja: { text: "サイズ", reading: "saizu" },  zh: { text: "尺码", reading: "chǐmǎ" } } },
    { dutch: "prijs",         type: "noun",      tr: { ja: { text: "値段",   reading: "nedan" },  zh: { text: "价格", reading: "jiàgé" } } },
    { dutch: "kaart",         type: "noun",      tr: { ja: { text: "カード", reading: "kādo" },   zh: { text: "卡",   reading: "kǎ" } } },
    { dutch: "belastingvrij", type: "noun",      tr: { ja: { text: "免税",   reading: "menzei" }, zh: { text: "免税", reading: "miǎnshuì" } } },
    { dutch: "groot",         type: "adjective", tr: { ja: { text: "大きい", reading: "ōkii" },   zh: { text: "大",   reading: "dà" } } },
    { dutch: "betalen",       type: "verb",      tr: { ja: { text: "払う",   reading: "harau" },  zh: { text: "付钱", reading: "fùqián" } } },
  ],
  noodgeval: [
    { dutch: "ambulance", type: "noun",      tr: { ja: { text: "救急車",     reading: "kyūkyūsha" }, zh: { text: "救护车", reading: "jiùhùchē" } } },
    { dutch: "dokter",    type: "noun",      tr: { ja: { text: "医者",       reading: "isha" },      zh: { text: "医生",   reading: "yīshēng" } } },
    { dutch: "politie",   type: "noun",      tr: { ja: { text: "警察",       reading: "keisatsu" },  zh: { text: "警察",   reading: "jǐngchá" } } },
    { dutch: "paspoort",  type: "noun",      tr: { ja: { text: "パスポート", reading: "pasupōto" },  zh: { text: "护照",   reading: "hùzhào" } } },
    { dutch: "borst",     type: "noun",      tr: { ja: { text: "胸",         reading: "mune" },      zh: { text: "胸口",   reading: "xiōngkǒu" } } },
    { dutch: "pijn",      type: "adjective", tr: { ja: { text: "痛い",       reading: "itai" },      zh: { text: "疼",     reading: "téng" } } },
    { dutch: "roepen",    type: "verb",      tr: { ja: { text: "呼ぶ",       reading: "yobu" },      zh: { text: "叫",     reading: "jiào" } } },
  ],

  // ── Dagelijks leven ─────────────────────────────────────────────────────────
  vrijetijd: [
    { dutch: "hobby",       type: "noun", tr: { ja: { text: "趣味",     reading: "shumi" },    zh: { text: "爱好", reading: "àihào" } } },
    { dutch: "sport",       type: "noun", tr: { ja: { text: "スポーツ", reading: "supōtsu" },  zh: { text: "运动", reading: "yùndòng" } } },
    { dutch: "voetbal",     type: "noun", tr: { ja: { text: "サッカー", reading: "sakkā" },    zh: { text: "足球", reading: "zúqiú" } } },
    { dutch: "muziek",      type: "noun", tr: { ja: { text: "音楽",     reading: "ongaku" },   zh: { text: "音乐", reading: "yīnyuè" } } },
    { dutch: "weekend",     type: "noun", tr: { ja: { text: "週末",     reading: "shūmatsu" }, zh: { text: "周末", reading: "zhōumò" } } },
    { dutch: "zwemmen",     type: "verb", tr: { ja: { text: "泳ぐ",     reading: "oyogu" },    zh: { text: "游泳", reading: "yóuyǒng" } } },
    { dutch: "lezen",       type: "verb", tr: { ja: { text: "読む",     reading: "yomu" },     zh: { text: "看书", reading: "kàn shū" } } },
    { dutch: "leuk vinden", type: "verb", tr: { ja: { text: "好き",     reading: "suki" },     zh: { text: "喜欢", reading: "xǐhuan" } } },
  ],
  thuis: [
    { dutch: "woonkamer",  type: "noun", tr: { ja: { text: "リビング", reading: "ribingu" },      zh: { text: "客厅", reading: "kètīng" } } },
    { dutch: "keuken",     type: "noun", tr: { ja: { text: "台所",     reading: "daidokoro" },    zh: { text: "厨房", reading: "chúfáng" } } },
    { dutch: "badkamer",   type: "noun", tr: { ja: { text: "お風呂",   reading: "o-furo" },       zh: { text: "浴室", reading: "yùshì" } } },
    { dutch: "slaapkamer", type: "noun", tr: { ja: { text: "寝室",     reading: "shinshitsu" },   zh: { text: "卧室", reading: "wòshì" } } },
    { dutch: "sleutel",    type: "noun", tr: { ja: { text: "鍵",       reading: "kagi" },         zh: { text: "钥匙", reading: "yàoshi" } } },
    { dutch: "afwassen",   type: "verb", tr: { ja: { text: "皿を洗う", reading: "sara wo arau" }, zh: { text: "洗碗", reading: "xǐ wǎn" } } },
    { dutch: "de was doen", type: "verb", tr: { ja: { text: "洗濯する", reading: "sentaku suru" }, zh: { text: "洗衣服", reading: "xǐ yīfu" } } },
    { dutch: "opruimen",   type: "verb", tr: { ja: { text: "片付ける", reading: "katazukeru" },   zh: { text: "收拾", reading: "shōushi" } } },
  ],
  lichaam: [
    { dutch: "hoofd", type: "noun",      tr: { ja: { text: "頭",   reading: "atama" },  zh: { text: "头",   reading: "tóu" } } },
    { dutch: "oog",   type: "noun",      tr: { ja: { text: "目",   reading: "me" },     zh: { text: "眼睛", reading: "yǎnjing" } } },
    { dutch: "oor",   type: "noun",      tr: { ja: { text: "耳",   reading: "mimi" },   zh: { text: "耳朵", reading: "ěrduo" } } },
    { dutch: "hand",  type: "noun",      tr: { ja: { text: "手",   reading: "te" },     zh: { text: "手",   reading: "shǒu" } } },
    { dutch: "been",  type: "noun",      tr: { ja: { text: "脚",   reading: "ashi" },   zh: { text: "腿",   reading: "tuǐ" } } },
    { dutch: "voet",  type: "noun",      tr: { ja: { text: "足",   reading: "ashi" },   zh: { text: "脚",   reading: "jiǎo" } } },
    { dutch: "buik",  type: "noun",      tr: { ja: { text: "お腹", reading: "onaka" },  zh: { text: "肚子", reading: "dùzi" } } },
    { dutch: "rug",   type: "noun",      tr: { ja: { text: "背中", reading: "senaka" }, zh: { text: "背",   reading: "bèi" } } },
    { dutch: "pijn",  type: "adjective", tr: { ja: { text: "痛い", reading: "itai" },   zh: { text: "疼",   reading: "téng" } } },
    { dutch: "moe",   type: "adjective", tr: { ja: { text: "疲れた", reading: "tsukareta" }, zh: { text: "累", reading: "lèi" } } },
  ],
  tijd: [
    { dutch: "tijd",    type: "noun", tr: { ja: { text: "時間", reading: "jikan" },   zh: { text: "时间", reading: "shíjiān" } } },
    { dutch: "klok",    type: "noun", tr: { ja: { text: "時計", reading: "tokei" },   zh: { text: "钟表", reading: "zhōngbiǎo" } } },
    { dutch: "vandaag", type: "noun", tr: { ja: { text: "今日", reading: "kyō" },     zh: { text: "今天", reading: "jīntiān" } } },
    { dutch: "morgen",  type: "noun", tr: { ja: { text: "明日", reading: "ashita" },  zh: { text: "明天", reading: "míngtiān" } } },
    { dutch: "maand",   type: "noun", tr: { ja: { text: "月",   reading: "tsuki" },   zh: { text: "月",   reading: "yuè" } } },
    { dutch: "seizoen", type: "noun", tr: { ja: { text: "季節", reading: "kisetsu" }, zh: { text: "季节", reading: "jìjié" } } },
    { dutch: "lente",   type: "noun", tr: { ja: { text: "春",   reading: "haru" },    zh: { text: "春天", reading: "chūntiān" } } },
    { dutch: "zomer",   type: "noun", tr: { ja: { text: "夏",   reading: "natsu" },   zh: { text: "夏天", reading: "xiàtiān" } } },
    { dutch: "herfst",  type: "noun", tr: { ja: { text: "秋",   reading: "aki" },     zh: { text: "秋天", reading: "qiūtiān" } } },
    { dutch: "winter",  type: "noun", tr: { ja: { text: "冬",   reading: "fuyu" },    zh: { text: "冬天", reading: "dōngtiān" } } },
  ],
  aantafel: [
    { dutch: "ontbijt",   type: "noun",      tr: { ja: { text: "朝ごはん", reading: "asagohan" }, zh: { text: "早饭", reading: "zǎofàn" } } },
    { dutch: "avondeten", type: "noun",      tr: { ja: { text: "晩ごはん", reading: "bangohan" }, zh: { text: "晚饭", reading: "wǎnfàn" } } },
    { dutch: "rijst",     type: "noun",      tr: { ja: { text: "ご飯",     reading: "gohan" },    zh: { text: "米饭", reading: "mǐfàn" } } },
    { dutch: "zout",      type: "noun",      tr: { ja: { text: "塩",       reading: "shio" },     zh: { text: "盐",   reading: "yán" } } },
    { dutch: "suiker",    type: "noun",      tr: { ja: { text: "砂糖",     reading: "satō" },     zh: { text: "糖",   reading: "táng" } } },
    { dutch: "lekker",    type: "adjective", tr: { ja: { text: "おいしい", reading: "oishii" },   zh: { text: "好吃", reading: "hǎochī" } } },
    { dutch: "eten",      type: "verb",      tr: { ja: { text: "食べる",   reading: "taberu" },   zh: { text: "吃",   reading: "chī" } } },
    { dutch: "drinken",   type: "verb",      tr: { ja: { text: "飲む",     reading: "nomu" },     zh: { text: "喝",   reading: "hē" } } },
  ],
};

// ── Merge met voorgegenereerde vertalingen ────────────────────────────────────

type GeneratedTr = Record<string, Record<string, Record<string, { text: string; reading: string }>>>;
const GEN = generatedTranslations as GeneratedTr;

const ckey = (d: string) => d.trim().toLowerCase();

export const staticVocab: Record<string, VocabConcept[]> = Object.fromEntries(
  Object.entries(staticVocabBase).map(([cat, concepts]) => [
    cat,
    concepts.map((c) => ({
      ...c,
      tr: { ...(GEN[cat]?.[ckey(c.dutch)] ?? {}), ...c.tr } as VocabConcept["tr"],
    })),
  ])
);

// Vult ontbrekende vertalingen in bestaande (Firestore-)concepten aan vanuit de
// statische lijst, op het Nederlandse ankerwoord. Zo krijgen ook gebruikers die
// een thema al eerder openden (en dus alleen ja/zh geseed hebben) alle talen
// direct, zonder vertaal-call.
export function enrichFromStatic(
  categoryId: string,
  concepts: VocabConcept[]
): { concepts: VocabConcept[]; changed: boolean } {
  const stat = staticVocab[categoryId];
  if (!stat) return { concepts, changed: false };
  const byDutch = new Map(stat.map((c) => [ckey(c.dutch), c]));
  let changed = false;
  const merged = concepts.map((c) => {
    const s = byDutch.get(ckey(c.dutch));
    if (!s) return c;
    const add = Object.entries(s.tr).filter(([lang]) => !(lang in c.tr));
    if (!add.length) return c;
    changed = true;
    return { ...c, tr: { ...Object.fromEntries(add), ...c.tr } as VocabConcept["tr"] };
  });
  return { concepts: merged, changed };
}
