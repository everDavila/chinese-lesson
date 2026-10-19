// npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkSentence, type GrammarPrompt } from "../../src/lib/grammar-check.ts";

const mei: GrammarPrompt = {
  es: "Ayer no fui a la escuela.",
  hint: "Usa 没",
  answers: ["我昨天没去学校。", "昨天我没去学校。"],
  uses: ["昨天", "没", "去学校"],
  avoid: [
    { text: "了", why: "sin 了" },
    { text: "不去", why: "不 no" },
  ],
};

test("vacío y pinyin: no se revisan", () => {
  assert.deepEqual(checkSentence("  ", mei), { kind: "empty" });
  assert.deepEqual(checkSentence("wo zuotian mei qu", mei), { kind: "not-hanzi" });
});

test("coincide con una respuesta modelo aunque cambie la puntuación", () => {
  assert.deepEqual(checkSentence("昨天 我没去学校", mei), { kind: "match" });
  assert.deepEqual(checkSentence("我昨天没去学校.", mei), { kind: "match" });
});

test("error típico: gana a las piezas", () => {
  assert.deepEqual(checkSentence("我昨天没去学校了", mei), { kind: "avoid", why: "sin 了" });
  assert.deepEqual(checkSentence("我昨天不去学校", mei), { kind: "avoid", why: "不 no" });
});

test("usa el patrón en orden pero no es una respuesta modelo", () => {
  assert.deepEqual(checkSentence("我和朋友昨天都没去学校", mei), { kind: "pattern" });
});

test("pieza fuera de orden o ausente", () => {
  assert.deepEqual(checkSentence("我没去学校昨天", mei), { kind: "missing", piece: "没" });
  assert.deepEqual(checkSentence("我昨天没来", mei), { kind: "missing", piece: "去学校" });
});

test("alternativas dentro de una pieza", () => {
  const p: GrammarPrompt = { es: "", hint: "", answers: [], uses: [["去饭店", "去饭馆"], "吃饭"] };
  assert.deepEqual(checkSentence("我们去饭馆吃饭", p), { kind: "pattern" });
});

test("datos del piloto: cada respuesta modelo cumple sus piezas y no cae en sus errores", () => {
  const data = JSON.parse(readFileSync(new URL("../../contenido/gramatica-hsk1-piloto.json", import.meta.url), "utf8"));
  for (const point of data.points) {
    for (const prompt of point.prompts as GrammarPrompt[]) {
      for (const answer of prompt.answers) {
        assert.deepEqual(checkSentence(answer, { ...prompt, answers: [] }), { kind: "pattern" }, `${point.id}: ${answer}`);
      }
    }
  }
});
