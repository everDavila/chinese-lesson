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
