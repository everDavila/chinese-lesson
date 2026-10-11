import { readFile } from "node:fs/promises";

const catalogUrl = new URL("../contenido/hsk3-level1.json", import.meta.url);
const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
const { metadata, words } = catalog;

const fail = (message) => {
  throw new Error(`Catálogo HSK inválido: ${message}`);
};

if (metadata.standard !== "hsk-3.0" || metadata.level !== 1) {
  fail("el archivo no declara HSK 3.0 nivel 1");
}

if (!Array.isArray(words) || words.length !== 300) {
  fail(`se esperaban 300 entradas y se encontraron ${words?.length ?? 0}`);
}

if (metadata.entryCount !== words.length) {
  fail("entryCount no coincide con el número de entradas");
}

const hanzi = new Set();

for (const [index, word] of words.entries()) {
  const expectedOrder = index + 1;

  if (word.sourceOrder !== expectedOrder) {
    fail(`orden discontinuo en la posición ${expectedOrder}`);
  }

  for (const field of ["hanzi", "sourceLabel", "pinyin", "sourceLevelLabel"]) {
    if (typeof word[field] !== "string" || word[field].trim() === "") {
      fail(`${field} vacío en la posición ${expectedOrder}`);
    }
  }

  if (word.partOfSpeech !== null && typeof word.partOfSpeech !== "string") {
    fail(`partOfSpeech inválido en la posición ${expectedOrder}`);
  }

  if (hanzi.has(word.hanzi)) {
    fail(`entrada hanzi duplicada: ${word.hanzi}`);
  }

  hanzi.add(word.hanzi);
}

console.log(
  `HSK 3.0 nivel 1: ${words.length} entradas, orden continuo y hanzi únicos.`,
);
