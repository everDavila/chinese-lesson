import assert from "node:assert/strict";
import test from "node:test";
import { noteTermCandidates, segmentHan } from "../../src/lib/note-terms.ts";

test("detecta términos chinos aislados y elimina duplicados", () => {
  assert.deepEqual(
    noteTermCandidates([
      "Para gustos cotidianos suele ser más natural 喜欢.",
      "喜欢 is more natural for everyday likes; 爱 is stronger.",
      null,
    ]),
    ["喜欢", "喜", "欢", "爱"],
  );
});

test("una cita larga aporta sus piezas de hasta 4 caracteres", () => {
  const c = noteTermCandidates(["un mercado del este (东市)"]);
  assert.deepEqual(c.sort(), ["东", "东市", "市"].sort());
  const long = noteTermCandidates(["一边吃饭一边聊天"]);
  assert.ok(long.includes("一边吃饭一边聊天") && long.includes("吃饭") && !long.includes("一边吃饭一"));
});

test("parte una frase en las palabras conocidas más largas", () => {
  const known = new Set(["一边", "吃饭", "聊天", "吃", "饭"]);
  assert.deepEqual(segmentHan("一边吃饭一边聊天", (p) => known.has(p)), [
    { text: "一边", term: true },
    { text: "吃饭", term: true },
    { text: "一边", term: true },
    { text: "聊天", term: true },
  ]);
});

test("lo desconocido queda como texto, junto", () => {
  const known = new Set(["东", "市"]);
  assert.deepEqual(segmentHan("东市", (p) => known.has(p)), [
    { text: "东", term: true },
    { text: "市", term: true },
  ]);
  assert.deepEqual(segmentHan("我龘龘你", (p) => p === "我" || p === "你"), [
    { text: "我", term: true },
    { text: "龘龘", term: false },
    { text: "你", term: true },
  ]);
  assert.deepEqual(segmentHan("喜欢", (p) => p === "喜欢"), [{ text: "喜欢", term: true }]);
});
