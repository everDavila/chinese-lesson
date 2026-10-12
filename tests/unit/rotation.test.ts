// node --experimental-strip-types --test tests/unit/  (npm run test:unit)
import assert from "node:assert/strict";
import { test } from "node:test";
import { pickSentences } from "../../src/lib/rotation.ts";

const frases = ["a", "b", "c", "d"].map((key) => ({ key }));
const keys = (xs: { key: string }[]) => xs.map((x) => x.key).join("");

test("sin historial: las primeras en orden de enseñanza", () => {
  assert.equal(keys(pickSentences(frases, new Map(), 2)), "ab");
});

test("null o un número mayor que las disponibles: todas", () => {
  assert.equal(keys(pickSentences(frases, new Map(), null)), "abcd");
  assert.equal(keys(pickSentences(frases, new Map(), 9)), "abcd");
});

test("tres clases seguidas de 2 frases no repiten hasta agotarlas", () => {
  const visto = new Map<string, number>();
  const clases: string[] = [];
  for (let dia = 1; dia <= 3; dia++) {
    const elegidas = pickSentences(frases, visto, 2);
    clases.push(keys(elegidas));
    for (const f of elegidas) visto.set(f.key, dia);
  }
  // 1.ª: a b · 2.ª: las no vistas c d · 3.ª: las vistas hace más tiempo, a b.
  assert.deepEqual(clases, ["ab", "cd", "ab"]);
});

test("una frase nueva (p. ej. de la docente) sale antes que las ya vistas", () => {
  const visto = new Map([["a", 1], ["b", 1], ["c", 2], ["d", 2]]);
  const conNueva = [...frases, { key: "propia" }];
  assert.equal(keys(pickSentences(conNueva, visto, 2)), "apropia");
});

test("se presentan en orden de enseñanza aunque se elijan en otro", () => {
  const visto = new Map([["a", 5], ["b", 1], ["c", 9], ["d", 3]]);
  // Las dos vistas hace más tiempo: b (1) y d (3).
  assert.equal(keys(pickSentences(frases, visto, 2)), "bd");
});

test("count 0 o negativo se trata como 1", () => {
  assert.equal(pickSentences(frases, new Map(), 0).length, 1);
});
