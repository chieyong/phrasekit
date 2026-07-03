import { LangCode } from "@/data/languages";

// Een vast, geordend grammatica-leerpad per taal. Elk onderwerp is een `naam`
// die rechtstreeks als lesonderwerp naar /api/grammar-module-detail gaat; de les
// wordt lui gegenereerd en gecacht via useGrammarModules (net als de "modules
// uit jouw zinnen"). De volgorde vormt de ruggengraat: basis → complex.
//
// Het niveaukader verschilt per taal (JLPT, HSK, CEFR…), dus de niveaus leven in
// de curriculum-data zelf — een taal toevoegen is daardoor puur data.

export interface CurriculumLevel {
  id:    string;   // moet overeenkomen met topic.niveau
  label: string;   // weergave op de badge, bijv. "N5", "HSK 1", "A1"
  color: string;   // Tailwind-klassen voor de badge
}

export interface CurriculumTopic {
  id:      string;   // stabiele slug (per-taal uniek; sleutel voor afvink-status)
  naam:    string;   // lesonderwerp (→ API moduleName + cache-sleutel)
  romaji:  string;   // lezing/uitspraak of kort voorbeeld
  tagline: string;   // één zin over doel/gebruik
  niveau:  string;   // verwijst naar CurriculumLevel.id
}

export interface Curriculum {
  framework: string;            // ondertitel, bijv. "JLPT N5 → N4"
  levels:    CurriculumLevel[]; // oplopend in moeilijkheid
  topics:    CurriculumTopic[];
}

// Badge-kleuren, oplopend in moeilijkheid.
const C = {
  green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  rose:  "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
} as const;

// ─── Japans (JLPT N5 → N4) ──────────────────────────────────────────────────────

const JA: Curriculum = {
  framework: "JLPT N5 → N4",
  levels: [
    { id: "N5", label: "N5", color: C.green },
    { id: "N4", label: "N4", color: C.amber },
  ],
  topics: [
    { id: "ja-n5-desu",         naam: "です・だ",                 romaji: "desu / da",            tagline: "De koppelwerkwoorden: 'X is Y'",                niveau: "N5" },
    { id: "ja-n5-wa",           naam: "は (onderwerp)",           romaji: "wa",                   tagline: "Het onderwerp van de zin markeren",             niveau: "N5" },
    { id: "ja-n5-mo",           naam: "も (ook)",                 romaji: "mo",                   tagline: "'Ook' — iets toevoegen aan het onderwerp",      niveau: "N5" },
    { id: "ja-n5-wo",           naam: "を (lijdend voorwerp)",    romaji: "o",                    tagline: "Wie of wat de handeling ondergaat",             niveau: "N5" },
    { id: "ja-n5-ni-e",         naam: "に・へ (richting)",        romaji: "ni / e",               tagline: "Bestemming, tijdstip en ontvanger",             niveau: "N5" },
    { id: "ja-n5-de",           naam: "で (plaats・middel)",      romaji: "de",                   tagline: "Waar iets gebeurt of waarmee",                  niveau: "N5" },
    { id: "ja-n5-no",           naam: "の (bezit)",               romaji: "no",                   tagline: "Bezit en zelfstandige naamwoorden verbinden",   niveau: "N5" },
    { id: "ja-n5-ka",           naam: "か (vraag)",               romaji: "ka",                   tagline: "Een zin tot vraag maken",                       niveau: "N5" },
    { id: "ja-n5-masu",         naam: "ます-vorm",                romaji: "masu-vorm",            tagline: "Beleefde tegenwoordige/toekomende tijd",        niveau: "N5" },
    { id: "ja-n5-masen",        naam: "ません・ました",           romaji: "masen / mashita",      tagline: "Beleefd ontkennen en verleden tijd",            niveau: "N5" },
    { id: "ja-n5-i-adj",        naam: "い-bijvoeglijk naamwoord", romaji: "i-adjectief",          tagline: "Bijvoeglijke naamwoorden op -i",                niveau: "N5" },
    { id: "ja-n5-na-adj",       naam: "な-bijvoeglijk naamwoord", romaji: "na-adjectief",         tagline: "Bijvoeglijke naamwoorden met na",               niveau: "N5" },
    { id: "ja-n5-te-vorm",      naam: "て-vorm",                  romaji: "te-vorm",              tagline: "De verbindingsvorm — basis voor veel patronen", niveau: "N5" },
    { id: "ja-n5-te-imasu",     naam: "〜ています",               romaji: "~te imasu",            tagline: "Bezig zijn met / voortdurende toestand",        niveau: "N5" },
    { id: "ja-n5-nai-vorm",     naam: "ない-vorm",                romaji: "nai-vorm",             tagline: "Informeel ontkennen",                           niveau: "N5" },
    { id: "ja-n5-tai",          naam: "たい-vorm",                romaji: "~tai",                 tagline: "Willen / liever iets doen",                     niveau: "N5" },
    { id: "ja-n5-hoshii",       naam: "〜がほしい",               romaji: "~ga hoshii",           tagline: "Iets willen hebben",                            niveau: "N5" },
    { id: "ja-n5-te-kudasai",   naam: "〜てください",             romaji: "~te kudasai",          tagline: "Beleefd om iets vragen",                        niveau: "N5" },
    { id: "ja-n5-te-mo-ii",     naam: "〜てもいいですか",         romaji: "~te mo ii desu ka",    tagline: "Toestemming vragen: 'mag ik…?'",                niveau: "N5" },
    { id: "ja-n5-te-wa-ikemasen", naam: "〜てはいけません",       romaji: "~te wa ikemasen",      tagline: "Verbod: 'dat mag niet'",                        niveau: "N5" },
    { id: "ja-n5-kara",         naam: "から・ので (reden)",       romaji: "kara / node",          tagline: "Reden en oorzaak: 'omdat'",                     niveau: "N5" },
    { id: "ja-n5-counters",     naam: "数え方 (telwoorden)",      romaji: "kazoekata",            tagline: "Tellen met de juiste telwoorden",               niveau: "N5" },

    { id: "ja-n4-nakereba",     naam: "〜なければならない",       romaji: "~nakereba naranai",    tagline: "Iets moeten doen",                              niveau: "N4" },
    { id: "ja-n4-nakutemo",     naam: "〜なくてもいい",           romaji: "~nakutemo ii",         tagline: "Iets niet hoeven doen",                         niveau: "N4" },
    { id: "ja-n4-potential",    naam: "kunnen-vorm (可能形)",     romaji: "kanoukei",             tagline: "Kunnen: '~られる / ~える'",                      niveau: "N4" },
    { id: "ja-n4-ta-koto",      naam: "〜たことがある",           romaji: "~ta koto ga aru",      tagline: "Ervaring: 'ooit gedaan hebben'",                niveau: "N4" },
    { id: "ja-n4-tari",         naam: "〜たり〜たり",             romaji: "~tari ~tari",          tagline: "Een greep uit handelingen opsommen",            niveau: "N4" },
    { id: "ja-n4-to-omou",      naam: "〜と思う",                 romaji: "~to omou",             tagline: "'Ik denk dat…' — een mening geven",             niveau: "N4" },
    { id: "ja-n4-to-itteita",   naam: "〜と言っていた",           romaji: "~to itte ita",         tagline: "Weergeven wat iemand zei",                      niveau: "N4" },
    { id: "ja-n4-volitional",   naam: "wilsvorm 〜よう",          romaji: "~you / ~mashou",       tagline: "'Zullen we…' en voornemens",                    niveau: "N4" },
    { id: "ja-n4-tsumori",      naam: "〜つもり",                 romaji: "~tsumori",             tagline: "Van plan zijn",                                 niveau: "N4" },
    { id: "ja-n4-conditionals", naam: "voorwaarden 〜ば・たら・と", romaji: "~ba / ~tara / ~to",   tagline: "De verschillende manieren van 'als'",           niveau: "N4" },
    { id: "ja-n4-nagara",       naam: "〜ながら",                 romaji: "~nagara",              tagline: "Twee dingen tegelijk: 'terwijl'",               niveau: "N4" },
    { id: "ja-n4-you-ni-naru",  naam: "〜ようになる",             romaji: "~you ni naru",         tagline: "Een verandering: 'gaan doen'",                  niveau: "N4" },
    { id: "ja-n4-sugiru",       naam: "〜すぎる",                 romaji: "~sugiru",              tagline: "'Te veel' / overdreven",                        niveau: "N4" },
    { id: "ja-n4-kata",         naam: "〜方 (manier)",            romaji: "~kata",                tagline: "'Hoe je iets doet'",                            niveau: "N4" },
    { id: "ja-n4-plain",        naam: "informele vorm (常体)",    romaji: "joutai",               tagline: "De casual spreektaal",                          niveau: "N4" },
    { id: "ja-n4-giving",       naam: "あげる・くれる・もらう",   romaji: "ageru / kureru / morau", tagline: "Geven en ontvangen",                          niveau: "N4" },
    { id: "ja-n4-passive",      naam: "lijdende vorm 〜られる",   romaji: "ukemi",                tagline: "De passief: 'er wordt…'",                       niveau: "N4" },
    { id: "ja-n4-causative",    naam: "aanzetvorm 〜させる",      romaji: "shieki",               tagline: "Iemand iets laten of doen",                     niveau: "N4" },
  ],
};

// ─── Mandarijns (HSK 1 → 3) ─────────────────────────────────────────────────────

const ZH: Curriculum = {
  framework: "HSK 1 → 3",
  levels: [
    { id: "HSK1", label: "HSK 1", color: C.green },
    { id: "HSK2", label: "HSK 2", color: C.amber },
    { id: "HSK3", label: "HSK 3", color: C.rose },
  ],
  topics: [
    { id: "zh-h1-shi",       naam: "是 (zijn)",              romaji: "shì",              tagline: "X 是 Y: iets is iets",                        niveau: "HSK1" },
    { id: "zh-h1-de",        naam: "的 (bezit)",             romaji: "de",               tagline: "Bezit en woorden aan elkaar koppelen",       niveau: "HSK1" },
    { id: "zh-h1-bu",        naam: "不 (niet)",              romaji: "bù",               tagline: "Ontkennen in de tegenwoordige tijd",         niveau: "HSK1" },
    { id: "zh-h1-mei",       naam: "没(有) (niet/geen)",     romaji: "méi(yǒu)",         tagline: "有 ontkennen en het verleden",               niveau: "HSK1" },
    { id: "zh-h1-ma",        naam: "吗 (vraag)",             romaji: "ma",               tagline: "Een ja/nee-vraag maken",                     niveau: "HSK1" },
    { id: "zh-h1-ne",        naam: "呢 (en jij?)",           romaji: "ne",               tagline: "Vervolgvraag: 'en …?'",                      niveau: "HSK1" },
    { id: "zh-h1-jige",      naam: "几・多少 (hoeveel)",     romaji: "jǐ / duōshao",     tagline: "Naar aantallen vragen",                      niveau: "HSK1" },
    { id: "zh-h1-zai",       naam: "在 (locatie)",           romaji: "zài",              tagline: "Ergens zijn / ergens mee bezig",             niveau: "HSK1" },
    { id: "zh-h1-le",        naam: "了 (voltooid)",          romaji: "le",               tagline: "Voltooiing en verandering",                  niveau: "HSK1" },
    { id: "zh-h1-you",       naam: "有 (hebben)",            romaji: "yǒu",              tagline: "'Hebben' en 'er is'",                        niveau: "HSK1" },
    { id: "zh-h1-liangci",   naam: "量词 (telwoorden)",      romaji: "liàngcí",          tagline: "Het juiste maatwoord (个 enz.)",             niveau: "HSK1" },
    { id: "zh-h1-xiang-yao", naam: "想・要 (willen)",        romaji: "xiǎng / yào",      tagline: "Willen en van plan zijn",                    niveau: "HSK1" },
    { id: "zh-h1-hui-neng",  naam: "会・能 (kunnen)",        romaji: "huì / néng",       tagline: "Kunnen: aangeleerd vs. in staat zijn",       niveau: "HSK1" },
    { id: "zh-h1-xihuan",    naam: "喜欢 (leuk vinden)",     romaji: "xǐhuan",           tagline: "Voorkeuren uitdrukken",                      niveau: "HSK1" },
    { id: "zh-h1-zhe-na",    naam: "这・那 (dit/dat)",       romaji: "zhè / nà",         tagline: "Aanwijzen",                                  niveau: "HSK1" },
    { id: "zh-h1-he",        naam: "和 (en)",                romaji: "hé",               tagline: "Zelfstandige naamwoorden verbinden",         niveau: "HSK1" },
    { id: "zh-h1-cixu",      naam: "语序 (woordvolgorde)",   romaji: "yǔxù",             tagline: "Onderwerp–tijd–plaats–werkwoord",            niveau: "HSK1" },

    { id: "zh-h2-ba",        naam: "把 (把-constructie)",    romaji: "bǎ",               tagline: "Het object naar voren halen",                niveau: "HSK2" },
    { id: "zh-h2-de-graad",  naam: "得 (graadcomplement)",   romaji: "de",               tagline: "Hoe goed/snel iets gebeurt (说得好)",         niveau: "HSK2" },
    { id: "zh-h2-guo",       naam: "过 (ervaring)",          romaji: "guo",              tagline: "Ooit iets gedaan hebben",                    niveau: "HSK2" },
    { id: "zh-h2-zhe",       naam: "正在・着 (bezig)",       romaji: "zhèngzài / zhe",   tagline: "Voortdurende handeling en toestand",         niveau: "HSK2" },
    { id: "zh-h2-bi",        naam: "比 (vergelijking)",      romaji: "bǐ",               tagline: "A is …-er dan B",                            niveau: "HSK2" },
    { id: "zh-h2-yinwei",    naam: "因为…所以 (omdat)",      romaji: "yīnwèi…suǒyǐ",     tagline: "Reden en gevolg",                            niveau: "HSK2" },
    { id: "zh-h2-suiran",    naam: "虽然…但是 (hoewel)",     romaji: "suīrán…dànshì",    tagline: "Tegenstelling",                              niveau: "HSK2" },
    { id: "zh-h2-yaole",     naam: "要…了 (bijna)",          romaji: "yào…le",           tagline: "Iets staat op het punt te gebeuren",         niveau: "HSK2" },
    { id: "zh-h2-yibian",    naam: "一边…一边 (tegelijk)",   romaji: "yìbiān…yìbiān",    tagline: "Twee dingen tegelijk doen",                  niveau: "HSK2" },
    { id: "zh-h2-jieguo",    naam: "结果补语 (resultaat)",   romaji: "jiéguǒ bǔyǔ",      tagline: "Resultaat van een handeling (吃完)",          niveau: "HSK2" },
    { id: "zh-h2-gei",       naam: "给 (geven/voor)",        romaji: "gěi",              tagline: "Aan of voor iemand",                         niveau: "HSK2" },
    { id: "zh-h2-congdao",   naam: "从…到 (van…tot)",        romaji: "cóng…dào",         tagline: "Traject in tijd of ruimte",                  niveau: "HSK2" },

    { id: "zh-h3-shide",     naam: "是…的 (nadruk)",         romaji: "shì…de",           tagline: "Nadruk op wanneer, hoe of waar",             niveau: "HSK3" },
    { id: "zh-h3-quxiang",   naam: "趋向补语 (richting)",    romaji: "qūxiàng bǔyǔ",     tagline: "Beweging: 进来, 出去",                         niveau: "HSK3" },
    { id: "zh-h3-yuelaiyue", naam: "越来越 (steeds meer)",   romaji: "yuèláiyuè",        tagline: "Toenemende mate",                            niveau: "HSK3" },
    { id: "zh-h3-youyou",    naam: "又…又 (zowel…als)",      romaji: "yòu…yòu",          tagline: "Twee eigenschappen tegelijk",                niveau: "HSK3" },
    { id: "zh-h3-yijiu",     naam: "一…就 (zodra)",          romaji: "yī…jiù",           tagline: "Zodra A, meteen B",                          niveau: "HSK3" },
    { id: "zh-h3-chule",     naam: "除了…以外 (behalve)",    romaji: "chúle…yǐwài",      tagline: "Uitzondering of toevoeging",                 niveau: "HSK3" },
    { id: "zh-h3-budan",     naam: "不但…而且 (niet alleen)", romaji: "búdàn…érqiě",     tagline: "Opklimmende opsomming",                      niveau: "HSK3" },
    { id: "zh-h3-bei",       naam: "被 (passief)",           romaji: "bèi",              tagline: "'Er wordt … door …'",                        niveau: "HSK3" },
    { id: "zh-h3-rang",      naam: "让・叫 (laten)",         romaji: "ràng / jiào",      tagline: "Iemand iets laten doen",                     niveau: "HSK3" },
    { id: "zh-h3-yinggai",   naam: "应该・必须 (moeten)",    romaji: "yīnggāi / bìxū",   tagline: "Behoren en verplicht zijn",                  niveau: "HSK3" },
    { id: "zh-h3-ruguo",     naam: "如果…就 (als)",          romaji: "rúguǒ…jiù",        tagline: "Voorwaarde: als…dan",                        niveau: "HSK3" },
    { id: "zh-h3-keneng",    naam: "可能补语 (potentieel)",  romaji: "kěnéng bǔyǔ",      tagline: "Wel/niet kunnen (听得懂)",                     niveau: "HSK3" },
  ],
};

// ─── Kantonees (Basis → Gevorderd) ──────────────────────────────────────────────

const YUE: Curriculum = {
  framework: "Basis → Gevorderd",
  levels: [
    { id: "basis",     label: "Basis",     color: C.green },
    { id: "gemiddeld", label: "Gemiddeld", color: C.amber },
    { id: "gevorderd", label: "Gevorderd", color: C.rose },
  ],
  topics: [
    { id: "yue-b-hai",     naam: "係 (zijn)",            romaji: "hai6",              tagline: "X 係 Y: iets is iets",                 niveau: "basis" },
    { id: "yue-b-m",       naam: "唔 (niet)",            romaji: "m4",                tagline: "Ontkennen",                            niveau: "basis" },
    { id: "yue-b-ge",      naam: "嘅 (bezit)",           romaji: "ge3",               tagline: "Bezit en woorden koppelen (= 的)",     niveau: "basis" },
    { id: "yue-b-me",      naam: "咩・嗎 (vraag)",       romaji: "me1 / maa3",        tagline: "Een ja/nee-vraag maken",               niveau: "basis" },
    { id: "yue-b-ne",      naam: "呢 (en jij?)",         romaji: "ne1",               tagline: "Vervolgvraag: 'en …?'",                niveau: "basis" },
    { id: "yue-b-geido",   naam: "幾多 (hoeveel)",       romaji: "gei2 do1",          tagline: "Naar aantallen vragen",                niveau: "basis" },
    { id: "yue-b-hai2",    naam: "喺 (locatie)",         romaji: "hai2",              tagline: "Ergens zijn",                          niveau: "basis" },
    { id: "yue-b-jau",     naam: "有・冇 (hebben)",      romaji: "jau5 / mou5",       tagline: "Hebben en niet hebben",                niveau: "basis" },
    { id: "yue-b-loengci", naam: "量詞 (telwoorden)",    romaji: "loeng6 ci4",        tagline: "Het juiste maatwoord",                 niveau: "basis" },
    { id: "yue-b-soeng",   naam: "想・要 (willen)",      romaji: "soeng2 / jiu3",     tagline: "Willen en van plan zijn",              niveau: "basis" },
    { id: "yue-b-sik",     naam: "識・可以 (kunnen)",    romaji: "sik1 / ho2 ji5",    tagline: "Kunnen: geleerd vs. mogen",            niveau: "basis" },
    { id: "yue-b-zungji",  naam: "鍾意 (leuk vinden)",   romaji: "zung1 ji3",         tagline: "Voorkeuren uitdrukken",                niveau: "basis" },
    { id: "yue-b-nigo",    naam: "呢・嗰 (dit/dat)",     romaji: "ni1 / go2",         tagline: "Aanwijzen",                            niveau: "basis" },
    { id: "yue-b-tung",    naam: "同 (en/met)",          romaji: "tung4",             tagline: "Verbinden en 'samen met'",             niveau: "basis" },

    { id: "yue-m-zo",      naam: "咗 (voltooid)",        romaji: "zo2",               tagline: "Voltooiing (= 了)",                    niveau: "gemiddeld" },
    { id: "yue-m-gan",     naam: "緊 (bezig)",           romaji: "gan2",              tagline: "Nu bezig met",                         niveau: "gemiddeld" },
    { id: "yue-m-gwo",     naam: "過 (ervaring)",        romaji: "gwo3",              tagline: "Ooit gedaan hebben",                   niveau: "gemiddeld" },
    { id: "yue-m-dak",     naam: "得 (graad/kunnen)",    romaji: "dak1",              tagline: "Graadcomplement en 'kunnen'",          niveau: "gemiddeld" },
    { id: "yue-m-maai",    naam: "埋 (erbij)",           romaji: "maai4",             tagline: "'Erbij / af' — afronden of toevoegen", niveau: "gemiddeld" },
    { id: "yue-m-saai",    naam: "晒 (allemaal)",        romaji: "saai3",             tagline: "'Helemaal / allemaal'",                niveau: "gemiddeld" },
    { id: "yue-m-jyuhei",  naam: "語氣詞 (toonpartikels)", romaji: "jyu5 hei3 ci4",   tagline: "呀・喎・㗎・啦: houding en toon",         niveau: "gemiddeld" },
    { id: "yue-m-bei",     naam: "畀 (geven/door)",      romaji: "bei2",              tagline: "Aan iemand geven (= 给)",              niveau: "gemiddeld" },
    { id: "yue-m-janwai",  naam: "因為…所以 (omdat)",    romaji: "jan1 wai6…so2 ji5", tagline: "Reden en gevolg",                      niveau: "gemiddeld" },
    { id: "yue-m-jatzau",  naam: "一…就 (zodra)",        romaji: "jat1…zau6",         tagline: "Zodra A, meteen B",                    niveau: "gemiddeld" },

    { id: "yue-g-bei6",    naam: "被・畀 (passief)",     romaji: "bei6 / bei2",       tagline: "'Er wordt … door …'",                  niveau: "gevorderd" },
    { id: "yue-g-sai",     naam: "使・令 (laten)",       romaji: "sai2 / ling6",      tagline: "Iemand iets laten doen",               niveau: "gevorderd" },
    { id: "yue-g-jinggoi", naam: "應該・要 (moeten)",    romaji: "jing1 goi1 / jiu3", tagline: "Behoren en moeten",                    niveau: "gevorderd" },
    { id: "yue-g-jyugwo",  naam: "如果…就 (als)",        romaji: "jyu4 gwo2…zau6",    tagline: "Voorwaarde: als…dan",                  niveau: "gevorderd" },
    { id: "yue-g-seoijin", naam: "雖然…但係 (hoewel)",   romaji: "seoi1 jin4…daan6 hai6", tagline: "Tegenstelling",                    niveau: "gevorderd" },
    { id: "yue-g-jyutlai", naam: "越嚟越 (steeds meer)", romaji: "jyut6 lai4 jyut6",  tagline: "Toenemende mate",                      niveau: "gevorderd" },
    { id: "yue-g-ceoihoeng", naam: "趨向補語 (richting)", romaji: "ceoi1 hoeng3",     tagline: "Beweging: 入嚟, 出去",                   niveau: "gevorderd" },
    { id: "yue-g-ceoizo",  naam: "除咗…之外 (behalve)",  romaji: "ceoi4 zo2…zi1 ngoi6", tagline: "Uitzondering of toevoeging",         niveau: "gevorderd" },
    { id: "yue-g-honang",  naam: "可能補語 (potentieel)", romaji: "ho2 nang4",        tagline: "Wel/niet kunnen (聽得明)",               niveau: "gevorderd" },
  ],
};

// ─── Engels (CEFR A1 → B1) ──────────────────────────────────────────────────────

const EN: Curriculum = {
  framework: "CEFR A1 → B1",
  levels: [
    { id: "A1", label: "A1", color: C.green },
    { id: "A2", label: "A2", color: C.amber },
    { id: "B1", label: "B1", color: C.rose },
  ],
  topics: [
    { id: "en-a1-tobe",      naam: "to be",                       romaji: "I am / she is",        tagline: "Het werkwoord 'zijn'",                            niveau: "A1" },
    { id: "en-a1-articles",  naam: "articles",                    romaji: "a / an / the",         tagline: "Lidwoorden: bepaald en onbepaald",                niveau: "A1" },
    { id: "en-a1-plural",    naam: "plural nouns",                romaji: "cat → cats",           tagline: "Meervoud van zelfstandige naamwoorden",           niveau: "A1" },
    { id: "en-a1-this",      naam: "this / that / these / those", romaji: "this book",            tagline: "Aanwijzende voornaamwoorden",                     niveau: "A1" },
    { id: "en-a1-havegot",   naam: "have got",                    romaji: "I've got a car",       tagline: "Bezit uitdrukken",                                niveau: "A1" },
    { id: "en-a1-pressimple", naam: "present simple",             romaji: "I work",               tagline: "De tegenwoordige tijd",                           niveau: "A1" },
    { id: "en-a1-dodoes",    naam: "do / does (vragen & ontkenning)", romaji: "Do you…? / I don't…", tagline: "Vragen en ontkennen in de tegenwoordige tijd", niveau: "A1" },
    { id: "en-a1-can",       naam: "can",                         romaji: "I can swim",           tagline: "Kunnen en mogen",                                 niveau: "A1" },
    { id: "en-a1-thereis",   naam: "there is / there are",        romaji: "there is a shop",      tagline: "'Er is / er zijn'",                               niveau: "A1" },
    { id: "en-a1-possess",   naam: "possessives",                 romaji: "my / your / John's",   tagline: "Bezit: mijn, jouw, 's",                           niveau: "A1" },
    { id: "en-a1-preps",     naam: "prepositions in / on / at",   romaji: "at 3 o'clock",         tagline: "Voorzetsels van tijd en plaats",                  niveau: "A1" },
    { id: "en-a1-wordorder", naam: "word order",                  romaji: "subject–verb–object",  tagline: "Basiszinsbouw",                                   niveau: "A1" },

    { id: "en-a2-prescont",  naam: "present continuous",          romaji: "I'm working",          tagline: "Nu bezig: de -ing-vorm",                          niveau: "A2" },
    { id: "en-a2-pastsimple", naam: "past simple",                romaji: "I worked / went",      tagline: "De verleden tijd (regelmatig & onregelmatig)",    niveau: "A2" },
    { id: "en-a2-did",       naam: "did (vragen & ontkenning)",   romaji: "Did you…? / I didn't…", tagline: "Vragen en ontkennen in de verleden tijd",        niveau: "A2" },
    { id: "en-a2-goingto",   naam: "going to",                    romaji: "I'm going to…",        tagline: "Plannen en voornemens",                           niveau: "A2" },
    { id: "en-a2-will",      naam: "will",                        romaji: "I'll help you",        tagline: "Toekomst, beloftes en spontane besluiten",        niveau: "A2" },
    { id: "en-a2-compar",    naam: "comparatives & superlatives", romaji: "bigger / the biggest", tagline: "Vergelijken: -er en -est",                        niveau: "A2" },
    { id: "en-a2-quant",     naam: "some / any / much / many",    romaji: "much water",           tagline: "Telbaar en ontelbaar",                            niveau: "A2" },
    { id: "en-a2-freq",      naam: "adverbs of frequency",        romaji: "always / never",       tagline: "Hoe vaak iets gebeurt",                           niveau: "A2" },
    { id: "en-a2-haveto",    naam: "have to / must",              romaji: "I have to go",         tagline: "Moeten en verplichtingen",                        niveau: "A2" },
    { id: "en-a2-should",    naam: "should",                      romaji: "you should rest",      tagline: "Advies geven",                                    niveau: "A2" },
    { id: "en-a2-wouldlike", naam: "would like",                  romaji: "I'd like a coffee",    tagline: "Beleefd iets willen",                             niveau: "A2" },

    { id: "en-b1-presperf",  naam: "present perfect",             romaji: "I have done",          tagline: "'Have + voltooid deelwoord'",                     niveau: "B1" },
    { id: "en-b1-perfvssimple", naam: "present perfect vs past simple", romaji: "have you ever…?", tagline: "Wanneer welke verleden tijd",                    niveau: "B1" },
    { id: "en-b1-pastcont",  naam: "past continuous",             romaji: "I was working",        tagline: "Bezig in het verleden",                           niveau: "B1" },
    { id: "en-b1-cond1",     naam: "first conditional",           romaji: "if it rains, I'll…",   tagline: "Reële voorwaarde",                                niveau: "B1" },
    { id: "en-b1-cond2",     naam: "second conditional",          romaji: "if I were…, I'd…",     tagline: "Hypothetische voorwaarde",                        niveau: "B1" },
    { id: "en-b1-usedto",    naam: "used to",                     romaji: "I used to smoke",      tagline: "Vroegere gewoontes",                              niveau: "B1" },
    { id: "en-b1-passive",   naam: "passive voice",               romaji: "it is made in…",       tagline: "De lijdende vorm",                                niveau: "B1" },
    { id: "en-b1-relative",  naam: "relative clauses",            romaji: "the man who…",         tagline: "Bijzinnen met who / which / that",                niveau: "B1" },
    { id: "en-b1-reported",  naam: "reported speech",             romaji: "he said (that)…",      tagline: "Indirecte rede",                                  niveau: "B1" },
    { id: "en-b1-gerinf",    naam: "gerunds & infinitives",       romaji: "like doing / want to do", tagline: "-ing of to + werkwoord",                       niveau: "B1" },
    { id: "en-b1-modalprob", naam: "modals of probability",       romaji: "might / may / could",  tagline: "Waarschijnlijkheid uitdrukken",                   niveau: "B1" },
  ],
};

// ─── Koreaans (TOPIK 1 → 3) ─────────────────────────────────────────────────────

const KO: Curriculum = {
  framework: "TOPIK 1 → 3",
  levels: [
    { id: "T1", label: "TOPIK 1", color: C.green },
    { id: "T2", label: "TOPIK 2", color: C.amber },
    { id: "T3", label: "TOPIK 3", color: C.rose },
  ],
  topics: [
    { id: "ko-t1-ida",      naam: "이다 (zijn)",              romaji: "ida",              tagline: "X는 Y이다: iets is iets",              niveau: "T1" },
    { id: "ko-t1-eunneun",  naam: "은/는 (thema)",            romaji: "eun / neun",       tagline: "Het onderwerp/thema markeren",         niveau: "T1" },
    { id: "ko-t1-iga",      naam: "이/가 (onderwerp)",        romaji: "i / ga",           tagline: "Wie of wat de handeling doet",         niveau: "T1" },
    { id: "ko-t1-eulreul",  naam: "을/를 (lijdend voorwerp)", romaji: "eul / reul",       tagline: "Wie of wat de handeling ondergaat",    niveau: "T1" },
    { id: "ko-t1-e",        naam: "에 (tijd・plaats)",        romaji: "e",                tagline: "Tijdstip en bestemming",               niveau: "T1" },
    { id: "ko-t1-eseo",     naam: "에서 (plaats van handeling)", romaji: "eseo",          tagline: "Waar iets gebeurt / vandaan",          niveau: "T1" },
    { id: "ko-t1-do",       naam: "도 (ook)",                 romaji: "do",               tagline: "'Ook' toevoegen",                      niveau: "T1" },
    { id: "ko-t1-ui",       naam: "의 (bezit)",               romaji: "ui",               tagline: "Bezit: 'van'",                         niveau: "T1" },
    { id: "ko-t1-hago",     naam: "하고・와/과 (en・met)",    romaji: "hago / wa / gwa",  tagline: "Verbinden en 'samen met'",             niveau: "T1" },
    { id: "ko-t1-itda",     naam: "있다・없다 (er is・hebben)", romaji: "itda / eopda",    tagline: "Bestaan en bezit",                     niveau: "T1" },
    { id: "ko-t1-seumnida", naam: "ㅂ니다/습니다 (formeel)",  romaji: "seumnida",         tagline: "De formeel-beleefde vorm (합쇼체)",     niveau: "T1" },
    { id: "ko-t1-ayo",      naam: "아요/어요 (beleefd)",      romaji: "ayo / eoyo",       tagline: "De gewoon-beleefde vorm (해요체)",      niveau: "T1" },
    { id: "ko-t1-ieyo",     naam: "이에요/예요 (zijn, spreektaal)", romaji: "ieyo / yeyo", tagline: "'Zijn' in de 해요체",                   niveau: "T1" },
    { id: "ko-t1-anmot",    naam: "안・못 (ontkenning)",      romaji: "an / mot",         tagline: "Niet doen / niet kunnen",              niveau: "T1" },
    { id: "ko-t1-past",     naam: "았/었 (verleden)",         romaji: "at / eot",         tagline: "De verleden tijd",                     niveau: "T1" },
    { id: "ko-t1-question", naam: "뭐・누구・어디 (vraagwoorden)", romaji: "mwo / nugu / eodi", tagline: "Vraagwoorden: wat/wie/waar",       niveau: "T1" },
    { id: "ko-t1-counters", naam: "개・명 (telwoorden)",      romaji: "gae / myeong",     tagline: "Tellen met het juiste telwoord",       niveau: "T1" },

    { id: "ko-t2-gosipda",  naam: "고 싶다 (willen)",         romaji: "go sipda",         tagline: "Iets willen doen",                     niveau: "T2" },
    { id: "ko-t2-go",       naam: "고 (en toen)",             romaji: "go",               tagline: "Handelingen verbinden",                niveau: "T2" },
    { id: "ko-t2-aseo",     naam: "아서/어서 (reden・volgorde)", romaji: "aseo / eoseo",  tagline: "Omdat / en dan",                       niveau: "T2" },
    { id: "ko-t2-jiman",    naam: "지만 (maar)",              romaji: "jiman",            tagline: "Tegenstelling: 'maar'",                niveau: "T2" },
    { id: "ko-t2-nikka",    naam: "(으)니까 (omdat)",         romaji: "(eu)nikka",        tagline: "Reden, vooral bij verzoeken",          niveau: "T2" },
    { id: "ko-t2-goitda",   naam: "고 있다 (bezig)",          romaji: "go itda",          tagline: "Nu bezig met",                         niveau: "T2" },
    { id: "ko-t2-future",   naam: "(으)ㄹ 거예요 (toekomst)", romaji: "(eu)l geoyeyo",    tagline: "Toekomst en plan",                     niveau: "T2" },
    { id: "ko-t2-get",      naam: "겠 (voornemen・vermoeden)", romaji: "get",             tagline: "Wil en waarschijnlijkheid",            niveau: "T2" },
    { id: "ko-t2-juseyo",   naam: "아/어 주세요 (verzoek)",   romaji: "a/eo juseyo",      tagline: "Beleefd om iets vragen",               niveau: "T2" },
    { id: "ko-t2-dodoeda",  naam: "아/어도 되다 (mogen)",     romaji: "a/eodo doeda",     tagline: "Toestemming: 'mag ik…?'",              niveau: "T2" },
    { id: "ko-t2-m07andoe", naam: "(으)면 안 되다 (verbod)",  romaji: "(eu)myeon an doeda", tagline: "Verbod: 'dat mag niet'",             niveau: "T2" },
    { id: "ko-t2-yadoeda",  naam: "아/어야 되다 (moeten)",    romaji: "a/eoya doeda",     tagline: "Iets moeten doen",                     niveau: "T2" },
    { id: "ko-t2-suitda",   naam: "(으)ㄹ 수 있다/없다 (kunnen)", romaji: "(eu)l su itda", tagline: "Wel of niet kunnen",                  niveau: "T2" },
    { id: "ko-t2-attr",     naam: "는/(으)ㄴ (bijvoeglijke bijzin)", romaji: "neun / (eu)n", tagline: "Werkwoorden als bijvoeglijk naamwoord", niveau: "T2" },
    { id: "ko-t2-myeon",    naam: "(으)면 (als)",             romaji: "(eu)myeon",        tagline: "Voorwaarde: als…dan",                  niveau: "T2" },
    { id: "ko-t2-boda",     naam: "보다 (vergelijking)",      romaji: "boda",             tagline: "A is …-er dan B",                      niveau: "T2" },

    { id: "ko-t3-jeogi",    naam: "(으)ㄴ 적이 있다 (ervaring)", romaji: "(eu)n jeogi itda", tagline: "Ooit gedaan hebben",                niveau: "T3" },
    { id: "ko-t3-lkkayo",   naam: "(으)ㄹ까요? (voorstel・gis)", romaji: "(eu)lkkayo",     tagline: "'Zullen we…?' en gissen",              niveau: "T3" },
    { id: "ko-t3-psida",    naam: "(으)ㅂ시다 (laten we)",    romaji: "(eu)psida",        tagline: "Voorstel: 'laten we…'",                niveau: "T3" },
    { id: "ko-t3-neungeot", naam: "는 것 (nominalisatie)",    romaji: "neun geot",        tagline: "Een handeling als zelfstandig naamwoord", niveau: "T3" },
    { id: "ko-t3-ttaemune", naam: "기 때문에 (omdat)",        romaji: "gi ttaemune",      tagline: "Formele reden",                        niveau: "T3" },
    { id: "ko-t3-ryeogo",   naam: "(으)려고 (om te)",         romaji: "(eu)ryeogo",       tagline: "Voornemen: 'om te…'",                  niveau: "T3" },
    { id: "ko-t3-gedoeda",  naam: "게 되다 (verandering)",    romaji: "ge doeda",         tagline: "'Gaan / komen te…'",                   niveau: "T3" },
    { id: "ko-t3-eoboda",   naam: "아/어 보다 (proberen)",    romaji: "a/eo boda",        tagline: "Iets uitproberen",                     niveau: "T3" },
    { id: "ko-t3-myeonseo", naam: "(으)면서 (terwijl)",       romaji: "(eu)myeonseo",     tagline: "Twee dingen tegelijk",                 niveau: "T3" },
    { id: "ko-t3-jianta",   naam: "지 않다 (formele ontkenning)", romaji: "ji anta",      tagline: "De lange ontkenning",                  niveau: "T3" },
    { id: "ko-t3-passive",  naam: "이/히/리/기 (passief・causatief)", romaji: "i/hi/ri/gi", tagline: "Lijdende en aanzettende vormen",     niveau: "T3" },
    { id: "ko-t3-banmal",   naam: "반말 (informele taal)",    romaji: "banmal",           tagline: "De casual spreektaal",                 niveau: "T3" },
    { id: "ko-t3-si",       naam: "(으)시 (beleefdheid)",     romaji: "(eu)si",           tagline: "Beleefdheidsvormen (시, 께서)",         niveau: "T3" },
  ],
};

// ─── Register ───────────────────────────────────────────────────────────────────

const GRAMMAR_CURRICULA: Partial<Record<LangCode, Curriculum>> = {
  ja:  JA,
  zh:  ZH,
  yue: YUE,
  ko:  KO,
  en:  EN,
};

export function getCurriculum(lang: string): Curriculum | null {
  return GRAMMAR_CURRICULA[lang as LangCode] ?? null;
}
