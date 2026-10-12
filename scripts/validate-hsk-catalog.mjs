import { readFile } from "node:fs/promises";

const expectedLevels = [
  { key: "1", level: 1, label: "1", firstOrder: 1, entryCount: 300, cumulativeEntryCount: 300 },
  { key: "2", level: 2, label: "2", firstOrder: 301, entryCount: 200, cumulativeEntryCount: 500 },
  { key: "3", level: 3, label: "3", firstOrder: 501, entryCount: 500, cumulativeEntryCount: 1000 },
  { key: "4", level: 4, label: "4", firstOrder: 1001, entryCount: 1000, cumulativeEntryCount: 2000, meaning: true },
  { key: "5", level: 5, label: "5", firstOrder: 2001, entryCount: 1600, cumulativeEntryCount: 3600, meaning: true },
  { key: "6", level: 6, label: "6", firstOrder: 3601, entryCount: 1800, cumulativeEntryCount: 5400, meaning: true },
  { key: "7-9", level: 7, label: "7–9", firstOrder: 5401, entryCount: 5600, cumulativeEntryCount: 11000, meaning: true },
];

const fail = (message) => {
  throw new Error(`Catálogo HSK inválido: ${message}`);
};

const allEntries = [];

for (const expected of expectedLevels) {
  const catalogUrl = new URL(
    `../contenido/hsk3-level${expected.key}.json`,
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
    if (expected.meaning && (typeof word.meaningEs !== "string" || !word.meaningEs.trim())) {
      fail(`nivel ${expected.label}: meaningEs vacío en ${expectedOrder}`);
    }

    allEntries.push({ ...word, level: expected.level });
  }

  console.log(
    `HSK 3.0 nivel ${expected.label}: ${words.length} nuevas, ${metadata.cumulativeEntryCount} acumuladas.`,
  );
}

const beginnerEntries = allEntries.filter((entry) => entry.level <= 3);
const entriesByHanzi = new Map();
for (const entry of beginnerEntries) {
  const entries = entriesByHanzi.get(entry.hanzi) ?? [];
  entries.push(entry);
  entriesByHanzi.set(entry.hanzi, entries);
}

const repeatedHanzi = [...entriesByHanzi.values()].filter(
  (entries) => entries.length > 1,
);
if (beginnerEntries.length !== 1000 || entriesByHanzi.size !== 988 || repeatedHanzi.length !== 11) {
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

console.log("Total: 11.000 entradas oficiales; HSK 7–9 se conserva como una sola banda.");
