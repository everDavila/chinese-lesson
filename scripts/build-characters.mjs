// Extrae de Make Me a Hanzi (dictionary.txt, LGPL) los caracteres que usa una
// lección y calcula el papel de cada trazo (semántico / fonético / otro) para
// colorearlo en la animación. Uso:
//   node scripts/build-characters.mjs <ruta/a/dictionary.txt> [contenido/leccion-demo.json]
// Escribe data/characters.json.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [dictPath, lessonPath = "contenido/leccion-demo.json"] = process.argv.slice(2);
if (!dictPath) {
  console.error("Falta la ruta a dictionary.txt de Make Me a Hanzi.");
  process.exit(1);
}

const dict = new Map(
  readFileSync(dictPath, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .map((entry) => [entry.character, entry]),
);
const lesson = JSON.parse(readFileSync(lessonPath, "utf8"));

// Caracteres de las palabras de la lección (no los de las frases: la
// descomposición solo se muestra para la palabra clave).
const chars = [...new Set(lesson.words.flatMap((w) => [...w.hanzi]))];

// Componentes de primer nivel de una secuencia IDS, p. ej. "⿰彳⿱旦寸" → ["彳", "⿱旦寸"].
const IDS_ARITY = { "⿰": 2, "⿱": 2, "⿲": 3, "⿳": 3, "⿴": 2, "⿵": 2, "⿶": 2, "⿷": 2, "⿸": 2, "⿹": 2, "⿺": 2, "⿻": 2 };
function topComponents(ids) {
  const symbols = [...ids];
  if (!(symbols[0] in IDS_ARITY)) return [ids];
  let i = 1;
  const read = () => {
    const start = i;
    let pending = 1;
    while (pending > 0 && i < symbols.length) {
      pending += (IDS_ARITY[symbols[i]] ?? 0) - 1;
      i++;
    }
    return symbols.slice(start, i).join("");
  };
  return Array.from({ length: IDS_ARITY[symbols[0]] }, read);
}

const out = {};
const missing = [];
for (const ch of chars) {
  const entry = dict.get(ch);
  if (!entry) {
    missing.push(ch);
    continue;
  }
  const components = topComponents(entry.decomposition);
  const ety = entry.etymology ?? {};
  // Si la etimología no marca parte semántica, el radical hace ese papel
  // (思 → 心, 得 → 彳): se colorea igual, en verde.
  const semantic = ety.semantic ?? (components.includes(entry.radical) ? entry.radical : undefined);
  const roleOf = (component) =>
    component === semantic ? "semantic" : component === ety.phonetic ? "phonetic" : "other";
  out[ch] = {
    pinyin: entry.pinyin,
    radical: entry.radical,
    decomposition: entry.decomposition,
    components: components.map((c) => ({ char: c, role: roleOf(c) })),
    etymology: ety.type
      ? { type: ety.type, semantic: ety.semantic, phonetic: ety.phonetic, hint: ety.hint }
      : null,
    // Un papel por trazo, en el orden de escritura.
    strokeRoles: entry.matches.map((path) => (path ? roleOf(components[path[0]]) : "other")),
  };
}

writeFileSync("data/characters.json", JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.keys(out).length} caracteres → data/characters.json`);
if (missing.length) console.log(`Sin datos: ${missing.join(" ")}`);

// Trazos para Hanzi Writer, autoalojados (licencia Arphic, ver
// public/hanzi-writer/ARPHICPL.TXT). Solo los caracteres de la lección.
const strokesDir = "public/hanzi-writer";
mkdirSync(strokesDir, { recursive: true });
copyFileSync("node_modules/hanzi-writer-data/ARPHICPL.TXT", `${strokesDir}/ARPHICPL.TXT`);
for (const ch of chars) {
  const src = `node_modules/hanzi-writer-data/${ch}.json`;
  if (existsSync(src)) copyFileSync(src, `${strokesDir}/${ch}.json`);
  else console.log(`Sin trazos: ${ch}`);
}
console.log(`Trazos copiados a ${strokesDir}/`);
