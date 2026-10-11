import { readFile } from "node:fs/promises";

const expectedLevels = [
  { level: 1, firstOrder: 1, entryCount: 300, cumulativeEntryCount: 300 },
  { level: 2, firstOrder: 301, entryCount: 200, cumulativeEntryCount: 500 },
  { level: 3, firstOrder: 501, entryCount: 500, cumulativeEntryCount: 1000 },
];

const fail = (message) => {
  throw new Error(`Catálogo HSK inválido: ${message}`);
};

const allEntries = [];

for (const expected of expectedLevels) {
  const catalogUrl = new URL(
    `../contenido/hsk3-level${expected.level}.json`,
    import.meta.url,
  );
  const { metadata, words } = JSON.parse(await readFile(catalogUrl, "utf8"));

  if (metadata.standard !== "hsk-3.0" || metadata.level !== expected.level) {
    fail(`el archivo de nivel ${expected.level} declara otro estándar o nivel`);
  }

  if (!Array.isArray(words) || words.length !== expected.entryCount) {
    fail(`nivel ${expected.level}: se esperaban ${expected.entryCount} entradas`);
  }

  if (
    metadata.entryCount !== words.length ||
    metadata.cumulativeEntryCount !== expected.cumulativeEntryCount ||
    metadata.entryKind !== "introduced-at-level"
  ) {
    fail(`nivel ${expected.level}: metadatos de conteo incorrectos`);
  }

  const sourceOrders = new Set();
  for (const [index, word] of words.entries()) {
    const expectedOrder = expected.firstOrder + index;
    if (word.sourceOrder !== expectedOrder || sourceOrders.has(word.sourceOrder)) {
      fail(`nivel ${expected.level}: orden inválido en ${expectedOrder}`);
    }
    sourceOrders.add(word.sourceOrder);

    for (const field of ["hanzi", "sourceLabel", "pinyin", "sourceLevelLabel"]) {
      if (typeof word[field] !== "string" || word[field].trim() === "") {
        fail(`nivel ${expected.level}: ${field} vacío en ${expectedOrder}`);
      }
    }

    if (word.partOfSpeech !== null && typeof word.partOfSpeech !== "string") {
      fail(`nivel ${expected.level}: partOfSpeech inválido en ${expectedOrder}`);
    }

    allEntries.push({ ...word, level: expected.level });
  }

  console.log(
    `HSK 3.0 nivel ${expected.level}: ${words.length} nuevas, ${metadata.cumulativeEntryCount} acumuladas.`,
  );
}

const entriesByHanzi = new Map();
for (const entry of allEntries) {
  const entries = entriesByHanzi.get(entry.hanzi) ?? [];
  entries.push(entry);
  entriesByHanzi.set(entry.hanzi, entries);
}

const repeatedHanzi = [...entriesByHanzi.values()].filter(
  (entries) => entries.length > 1,
);
if (allEntries.length !== 1000 || entriesByHanzi.size !== 988 || repeatedHanzi.length !== 11) {
  fail("la cobertura o las repeticiones entre niveles no coinciden con la fuente");
}

const hasEntry = (hanzi, level, pinyin) =>
  allEntries.some(
    (entry) => entry.hanzi === hanzi && entry.level === level && entry.pinyin === pinyin,
  );

if (!hasEntry("只", 1, "zhī") || !hasEntry("只", 3, "zhǐ")) {
  fail("no se conservaron las dos lecturas y niveles de 只");
}
if (!hasEntry("长", 2, "cháng") || !hasEntry("长", 3, "zhǎng")) {
  fail("no se conservaron las dos lecturas y niveles de 长");
}

console.log("Total: 1000 entradas, 988 formas y 11 formas repetidas por lectura o uso.");
