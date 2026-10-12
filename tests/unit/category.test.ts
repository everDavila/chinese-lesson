// npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryLabel, studentLabels } from "../../src/lib/student-labels.ts";

const es = studentLabels("es");
const en = studentLabels("en");

test("categoría en inglés (HSK 1–3): se traduce", () => {
  assert.equal(categoryLabel("noun", es), "sustantivo");
  assert.equal(categoryLabel("measure word", en), "measure word");
});

test("categoría en chino abreviado (HSK 4–9): se traduce", () => {
  assert.equal(categoryLabel("名", es), "sustantivo");
  assert.equal(categoryLabel("动、名", es), "verbo / sustantivo");
  assert.equal(categoryLabel("拟声", en), "onomatopoeia");
});

test("uso secundario entre paréntesis: no se muestra; como mucho dos", () => {
  assert.equal(categoryLabel("名、（动）", es), "sustantivo");
  assert.equal(categoryLabel("形、动、副", es), "adjetivo / verbo");
});

test("vacía o desconocida: se devuelve tal cual", () => {
  assert.equal(categoryLabel("", es), "");
  assert.equal(categoryLabel("成语", es), "成语");
});
