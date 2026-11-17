import test from "node:test";
import assert from "node:assert/strict";
import { withTone } from "../../src/lib/pinyin.ts";
import { buildRound, similarWords, toneVariants, type QuizWord } from "../../src/lib/quiz.ts";
import { pickExample } from "../../src/lib/quiz-data.ts";

const seq = (): (() => number) => {
  let i = 0;
  return () => (i++ * 0.37) % 1;
};
const w = (hanzi: string, pinyin: string, es: string, pos = "名"): QuizWord => ({ hanzi, pinyin, es, pos });
const POOL = [
  w("妈", "mā", "mamá"), w("麻", "má", "cáñamo"), w("马", "mǎ", "caballo"), w("骂", "mà", "regañar"),
  w("朋友", "péngyou", "amigo"), w("好", "hǎo", "bueno", "形"), w("你", "nǐ", "tú", "代"), w("人", "rén", "persona"),
];

test("withTone coloca la marca donde toca", () => {
  assert.equal(withTone("hao", 3), "hǎo");
  assert.equal(withTone("hǎo", 4), "hào");
  assert.equal(withTone("liu", 2), "liú");
  assert.equal(withTone("gui", 4), "guì");
  assert.equal(withTone("lü", 3), "lǚ");
  assert.equal(withTone("zhōu", 5), "zhou");
  assert.equal(withTone("nou", 2), "nóu");
});

test("toneVariants: tres variantes distintas de la correcta", () => {
  for (const p of ["mā", "péngyou", "de", "túshūguǎn"]) {
    const v = toneVariants(p, seq());
    assert.ok(v, p);
    assert.equal(new Set([p, ...v]).size, 4);
  }
});

test("toneVariants no sirve con cosas que no son pinyin", () => {
  assert.equal(toneVariants("", seq()), null);
});

test("modo tonos: 4 opciones de pinyin, la correcta en `correct`", () => {
  const round = buildRound(POOL, 5, seq(), POOL, "tonos");
  assert.equal(round.length, 5);
  for (const q of round) {
    if (q.kind !== "choose") throw new Error("kind");
    assert.equal(q.direction, "tone");
    assert.equal(q.options.length, 4);
    assert.equal(q.options[q.correct], q.word.pinyin);
  }
});

test("modo escuchar: hanzi distintos y ninguno suena igual", () => {
  const round = buildRound(POOL, 5, seq(), POOL, "escuchar");
  for (const q of round) {
    if (q.kind !== "choose") throw new Error("kind");
    assert.equal(q.direction, "listen");
    assert.equal(new Set(q.options).size, 4);
    assert.equal(q.options[q.correct], q.word.hanzi);
  }
});

test("similarWords prefiere el mismo sonido sin tono", () => {
  const near = similarWords(POOL[0], POOL, 3, seq());
  assert.deepEqual(new Set(near.map((x) => x.hanzi)), new Set(["麻", "马", "骂"]));
});

test("pickExample: la más corta que cumple nivel y largo", () => {
  const levelOf = (c: string) => ("我爱你妈孩子".includes(c) ? 1 : 9);
  const ex = pickExample(
    [
      { zh: "我爱你！", pinyin: "a", es: "A", origin: "ai" },
      { zh: "妈妈爱孩子。", pinyin: "b", es: "B" },
      { zh: "我爱我的狗。", pinyin: "c", es: "C" },
      { zh: "我", pinyin: "d", es: "D" },
    ],
    1,
    levelOf,
  );
  assert.equal(ex?.es, "A");
  assert.equal(pickExample([{ zh: "我爱狗。", pinyin: "", es: "x" }], 1, levelOf), null);
});
