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
