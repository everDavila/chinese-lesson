import assert from "node:assert/strict";
import { test } from "node:test";
import { bankOrder, grade, pickBatch, place, remaining, toneless } from "../../src/lib/matching.ts";

const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };

test("pinyin sin tonos ni espacios", () => {
  assert.equal(toneless("nǐ hǎo"), "nihao");
  assert.equal(toneless("lǜ"), "lu");
});

test("la tanda no mezcla homófonos ni repite hanzi", () => {
  const pool = [
    { hanzi: "是", pinyin: "shì" },
    { hanzi: "事", pinyin: "shì" },
    { hanzi: "时", pinyin: "shí" },
    { hanzi: "你", pinyin: "nǐ" },
    { hanzi: "你", pinyin: "nǐ" },
    { hanzi: "好", pinyin: "hǎo" },
  ];
  const batch = pickBatch(pool, 6, seq(0.1, 0.5, 0.9));
  const sounds = batch.map((w) => toneless(w.pinyin));
  assert.equal(new Set(sounds).size, sounds.length);
  assert.equal(new Set(batch.map((w) => w.hanzi)).size, batch.length);
  assert.equal(batch.length, 3); // shi, ni, hao
});

test("el banco no queda en el orden de los huecos", () => {
  const batch = [{ hanzi: "a", pinyin: "a" }, { hanzi: "b", pinyin: "b" }, { hanzi: "c", pinyin: "c" }];
  for (const r of [0.01, 0.5, 0.99]) assert.notDeepEqual(bankOrder(batch, () => r), ["a", "b", "c"]);
});

test("colocar, mover y devolver fichas", () => {
  let slots: (string | null)[] = [null, null, null];
  slots = place(slots, "a", 0);
  slots = place(slots, "a", 2); // se mueve: deja libre el 0
  assert.deepEqual(slots, [null, null, "a"]);
  slots = place(slots, "b", 2); // ocupa: «a» vuelve al banco
  assert.deepEqual(slots, [null, null, "b"]);
  assert.deepEqual(remaining(["a", "b", "c"], slots), ["a", "c"]);
});

test("corrección por hueco y completitud", () => {
  const batch = [{ hanzi: "a", pinyin: "1" }, { hanzi: "b", pinyin: "2" }];
  assert.deepEqual(grade(batch, ["a", "a"]), { correct: [true, false], hits: 1, complete: true });
  assert.equal(grade(batch, ["a", null]).complete, false);
});
