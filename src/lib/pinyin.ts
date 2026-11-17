// Utilidades de pinyin.

const V = "aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";
// Inicial opcional + vocales + final nasal/r solo si no empieza otra sílaba.
const SYLLABLE = new RegExp(
  `(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[${V}]+(?:ng(?![${V}])|n(?![${V}])|r(?![${V}]))?`,
  "gi",
);

/** "rènshi" → ["rèn", "shi"]. El apóstrofo y el espacio separan sílabas (Xī'ān). */
export function splitPinyin(word: string): string[] {
  return word.split(/['’\s]+/).flatMap((part) => part.match(SYLLABLE) ?? []);
}

/** Quita el tono: "rén" → "ren". */
export function toneless(syllable: string): string {
  return syllable.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const TONE_MARKS: Record<string, 1 | 2 | 3 | 4> = {};
["āēīōūǖ", "áéíóúǘ", "ǎěǐǒǔǚ", "àèìòùǜ"].forEach((row, i) => {
  for (const ch of row) TONE_MARKS[ch] = (i + 1) as 1 | 2 | 3 | 4;
});

/** Tono de una sílaba con marca ("hǎo" → 3); 5 si no lleva marca (tono neutro). */
export function toneOf(syllable: string): 1 | 2 | 3 | 4 | 5 {
  for (const ch of syllable.toLowerCase()) if (TONE_MARKS[ch]) return TONE_MARKS[ch];
  return 5;
}

const MARKED: Record<string, [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};
const PLAIN_OF: Record<string, string> = {};
for (const [plain, row] of Object.entries(MARKED)) for (const ch of row) PLAIN_OF[ch] = plain;

/**
 * Pone otro tono a una sílaba: ("hao", 3) → "hǎo", ("hǎo", 4) → "hào",
 * ("lü", 3) → "lǚ". El tono 5 (neutro) quita la marca. La marca va en la «a» o
 * la «e»; en «ou», en la «o»; si no, en la última vocal.
 */
export function withTone(syllable: string, tone: 1 | 2 | 3 | 4 | 5): string {
  const base = [...syllable].map((ch) => PLAIN_OF[ch] ?? ch).join("");
  if (tone === 5) return base;
  const lower = base.toLowerCase();
  let at = lower.search(/[ae]/);
  if (at < 0 && lower.includes("ou")) at = lower.indexOf("ou");
  if (at < 0) {
    for (let i = lower.length - 1; i >= 0; i--) {
      if ("iouü".includes(lower[i])) {
        at = i;
        break;
      }
    }
  }
  if (at < 0) return base;
  const marked = MARKED[lower[at]][tone - 1];
  return base.slice(0, at) + (base[at] !== lower[at] ? marked.toUpperCase() : marked) + base.slice(at + 1);
}

/** "péngyou" → [2, 5]: el tono de cada sílaba, en orden. */
export function tonesOf(word: string): (1 | 2 | 3 | 4 | 5)[] {
  return splitPinyin(word).map(toneOf);
}

/**
 * Parte un pinyin en tramos conservando todo lo que no es sílaba (espacios,
 * apóstrofos): "Xī'ān" → [Xī(1), '(null), ān(1)]. tone es null en los separadores.
 */
export function pinyinSegments(word: string): { text: string; tone: 1 | 2 | 3 | 4 | 5 | null }[] {
  const out: { text: string; tone: 1 | 2 | 3 | 4 | 5 | null }[] = [];
  let last = 0;
  for (const m of word.matchAll(SYLLABLE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: word.slice(last, at), tone: null });
    out.push({ text: m[0], tone: toneOf(m[0]) });
    last = at + m[0].length;
  }
  if (last < word.length) out.push({ text: word.slice(last), tone: null });
  return out;
}
