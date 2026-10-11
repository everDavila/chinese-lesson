// Genera data/hsk-catalogo-1-3.json (catálogo del prototipo) a partir de los
// catálogos oficiales HSK 3.0 de contenido/ y añade una glosa inglesa de
// complete-hsk-vocabulary (MIT), emparejando hanzi Y pinyin para no tomar
// otra lectura (吗 ma, no má). Uso:
//   node scripts/build-catalogo.mjs <ruta/a/complete.min.json>
import { readFileSync, writeFileSync } from "node:fs";
import { tidyGloss } from "./lib/gloss.mjs";

const completePath = process.argv[2];
if (!completePath) {
  console.error("Falta la ruta a complete.min.json (github.com/drkameleon/complete-hsk-vocabulary).");
  process.exit(1);
}

const plain = (p) => p.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[\s'’]/g, "").toLowerCase();
const exact = (p) => p.replace(/[\s'’]/g, "").toLowerCase();

// Glosas por hanzi: cada forma con su pinyin.
const glosses = new Map();
for (const x of JSON.parse(readFileSync(completePath, "utf8"))) {
  for (const f of x.f) {
    const list = glosses.get(x.s) ?? [];
    list.push({ p: f.i.y, m: f.m });
    glosses.set(x.s, list);
  }
}
// Varias formas pueden compartir pinyin. Se descartan las auxiliares del
// diccionario ("used in…", "variant of…", apellidos) y, si el temario dice
// que es clasificador, la acepción de clasificador va primero (本: libros,
// no "raíz"; 只 zhī: animales, no "grano").
const AUX = /^(used in|variant of|old variant|surname|see |abbr. for|(archaic))/i;
function glossFor(hanzi, pinyin, cat) {
  const forms = glosses.get(hanzi) ?? [];
  let hits = forms.filter((f) => exact(f.p) === exact(pinyin));
  if (!hits.length) hits = forms.filter((f) => plain(f.p) === plain(pinyin));
  const useful = hits.map((f) => ({ ...f, m: f.m.filter((x) => !AUX.test(x)) })).filter((f) => f.m.length);
  if (!useful.length) return "";
  let meanings = useful.sort((a, b) => b.m.length - a.m.length)[0].m;
  if (cat === "measure word") {
    const all = useful.flatMap((f) => f.m);
    const cl = all.filter((x) => /classifier/i.test(x));
    meanings = [...cl, ...meanings.filter((x) => !cl.includes(x))];
  }
  // Máximo 90 caracteres sin cortar a media palabra ni dejar un "(" abierto.
  return tidyGloss(meanings.slice(0, 3).join("; "));
}

// Primera categoría del temario ("名、动" → noun).
const POS = {
  名: "noun", 动: "verb", 形: "adjective", 副: "adverb", 代: "pronoun", 量: "measure word",
  数: "numeral", 数量: "numeral", 助: "particle", 介: "preposition", 连: "conjunction",
  叹: "interjection", 前缀: "affix", 后缀: "affix",
};
const category = (pos) => POS[(pos ?? "").split(/[、（(]/)[0].trim()] ?? "";

const byHanzi = new Map();
let missing = 0;
for (const level of [1, 2, 3]) {
  const { words } = JSON.parse(readFileSync(`contenido/hsk3-level${level}.json`, "utf8"));
  for (const w of words) {
    const en = glossFor(w.hanzi, w.pinyin, category(w.partOfSpeech));
    if (!en) missing++;
    const entry = byHanzi.get(w.hanzi) ?? { h: w.hanzi, l: level, s: [] };
    entry.s.push({ p: w.pinyin.replace(/\s+/g, ""), en, c: category(w.partOfSpeech) });
    byHanzi.set(w.hanzi, entry);
  }
}

const out = [...byHanzi.values()];
writeFileSync("data/hsk-catalogo-1-3.json", JSON.stringify(out));
const multi = out.filter((e) => e.s.length > 1);
console.log(
  `${out.length} palabras (HSK 3.0): ` +
    [1, 2, 3].map((n) => `nivel ${n}: ${out.filter((e) => e.l === n).length}`).join(", ") +
    `. Con varios sentidos: ${multi.map((e) => e.h).join(" ")}. Sin glosa inglesa: ${missing}.`,
);
