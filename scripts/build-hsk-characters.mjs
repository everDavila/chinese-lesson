// Construye los datos de caracteres usados por el catálogo HSK 1-9 a partir
// de Make Me a Hanzi (dictionary.txt, LGPL-3.0-or-later). No toca Supabase.
// Uso: node scripts/build-hsk-characters.mjs <ruta/a/dictionary.txt>
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [dictPath] = process.argv.slice(2);
if (!dictPath) throw new Error("Falta la ruta a dictionary.txt de Make Me a Hanzi.");

const dict = new Map(
  readFileSync(dictPath, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line))
    .map((entry) => [entry.character, entry]),
);
const levels = [1, 2, 3, 4, 5, 6, "7-9"];
const words = levels.flatMap((level) =>
  JSON.parse(readFileSync(`contenido/hsk3-level${level}.json`, "utf8")).words,
);
const chars = [...new Set(words.flatMap((word) => [...word.hanzi].filter((char) => /\p{Script=Han}/u.test(char))))];
const pinyinList = (value) => Array.isArray(value) ? value : value ? value.split(", ") : [];

const IDS_ARITY = { "⿰": 2, "⿱": 2, "⿲": 3, "⿳": 3, "⿴": 2, "⿵": 2, "⿶": 2, "⿷": 2, "⿸": 2, "⿹": 2, "⿺": 2, "⿻": 2 };
function topComponents(ids) {
  const symbols = [...ids];
  if (!(symbols[0] in IDS_ARITY)) return [ids];
  let index = 1;
  const read = () => {
    const start = index;
    let pending = 1;
    while (pending > 0 && index < symbols.length) {
      pending += (IDS_ARITY[symbols[index]] ?? 0) - 1;
      index++;
    }
    return symbols.slice(start, index).join("");
  };
  return Array.from({ length: IDS_ARITY[symbols[0]] }, read);
}

const out = {};
const missing = [];
for (const char of chars) {
  const entry = dict.get(char);
  if (!entry) {
    missing.push(char);
    continue;
  }
  const components = topComponents(entry.decomposition);
  const etymology = entry.etymology ?? {};
  const semantic = etymology.semantic ?? (components.includes(entry.radical) ? entry.radical : undefined);
  const roleOf = (component) =>
    component === semantic ? "semantic" : component === etymology.phonetic ? "phonetic" : "other";

  out[char] = {
    pinyin: pinyinList(entry.pinyin),
    radical: entry.radical || null,
    decomposition: entry.decomposition,
    components: components.map((component) => ({
      char: component,
      role: roleOf(component),
      pinyin: pinyinList(dict.get(component)?.pinyin)[0] ?? null,
    })),
    etymology: etymology.type
      ? {
          type: etymology.type,
          ...(etymology.semantic ? { semantic: etymology.semantic } : {}),
          ...(etymology.phonetic ? { phonetic: etymology.phonetic } : {}),
          ...(etymology.hint ? { hint: etymology.hint } : {}),
        }
      : null,
    strokeRoles: entry.matches.map((path) => (path ? roleOf(components[path[0]]) : "other")),
  };
}

writeFileSync("data/characters.json", `${JSON.stringify(out, null, 2)}\n`);
writeFileSync(
  "data/characters-source.json",
  `${JSON.stringify({
    sourceId: "makemeahanzi",
    sourceUrl: "https://github.com/skishore/makemeahanzi",
    sourceFile: "dictionary.txt",
    license: "LGPL-3.0-or-later",
    retrievedAt: new Date().toISOString().slice(0, 10),
    catalog: "HSK 3.0 levels 1-9 (7-9 is one official band)",
    charactersRequested: chars.length,
    charactersWritten: Object.keys(out).length,
    incompleteDecompositions: Object.values(out).filter((row) => row.decomposition.includes("？")).length,
  }, null, 2)}\n`,
);

const strokesDir = "public/hanzi-writer";
mkdirSync(strokesDir, { recursive: true });
for (const char of Object.keys(out)) {
  const source = `node_modules/hanzi-writer-data/${char}.json`;
  if (existsSync(source)) copyFileSync(source, `${strokesDir}/${char}.json`);
  else console.warn(`Sin trazos de Hanzi Writer: ${char}`);
}

console.log(`${Object.keys(out).length}/${chars.length} caracteres escritos; ${missing.length} ausentes.`);
console.log(`${Object.values(out).filter((row) => row.decomposition.includes("？")).length} descomposiciones incompletas quedan identificadas y la interfaz no las mostrará.`);

