// Evita reintroducir español regional en los lotes de ejemplos HSK.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const regionalWords = new Set([
  "vosotros", "vosotras", "os", "vuestro", "vuestra", "vuestros", "vuestras", "sois", "estáis", "habéis",
  "vivís", "decís", "venís", "coche", "coches", "ordenador", "ordenadores", "móvil", "móviles",
  "coger", "coge", "coges", "cogéis", "cogen",
]);

const findRegionalSpanish = (text) => {
  if (/^\s*[¡¿]?vale[.!?]?\s*$/iu.test(text)) return "vale";
  return (text.toLocaleLowerCase("es").match(/\p{L}+/gu) ?? [])
    .find((word) => regionalWords.has(word) || /(?:áis|éis)$/u.test(word)) ?? null;
};

assert.equal(findRegionalSpanish("¿Os conocéis?"), "os");
assert.equal(findRegionalSpanish("Tiene ocho años."), null);
assert.equal(findRegionalSpanish("El libro vale diez soles."), null);
assert.equal(findRegionalSpanish("¿Se conocen?"), null);

const files = readdirSync("contenido")
  .filter((name) => /^ejemplos-hsk\d+-(?:curados-codex|sin-curar)\.json$/.test(name))
  .sort();
let problems = 0;

for (const file of files) {
  const batch = JSON.parse(readFileSync(`contenido/${file}`, "utf8"));
  for (const example of batch.examples ?? []) {
    for (const sentence of example.sentences ?? []) {
      const match = findRegionalSpanish(sentence.es ?? "");
      if (!match) continue;
      problems++;
      console.log(`✗ ${file} · ${example.hanzi} · «${match}»: ${sentence.es}`);
    }
  }
}

console.log(problems ? `\n${problems} traducción(es) fuera de la política.` : `✓ ${files.length} lotes usan español neutro latinoamericano.`);
process.exit(problems ? 1 : 0);
