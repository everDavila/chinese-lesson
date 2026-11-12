import assert from "node:assert/strict";
import { test } from "node:test";
import { tonesOf } from "../../src/lib/pinyin.ts";
import { masteryStars } from "../../src/lib/srs.ts";
import { addDays, computeStreak, dayKey, lastDays } from "../../src/lib/student-time.ts";

test("tonos por sílaba", () => {
  assert.deepEqual(tonesOf("nǐ hǎo"), [3, 3]);
  assert.deepEqual(tonesOf("péngyou"), [2, 5]);
  assert.deepEqual(tonesOf("chūlái"), [1, 2]);
  assert.deepEqual(tonesOf("dàrén"), [4, 2]);
  assert.deepEqual(tonesOf("ma"), [5]);
});

test("el día se corta en hora de Lima", () => {
  // 03:00 UTC del 10 es todavía el 9 en Lima (UTC-5).
  assert.equal(dayKey("2026-11-10T03:00:00Z"), "2026-11-09");
  assert.equal(dayKey("2026-11-10T06:00:00Z"), "2026-11-10");
});

test("fechas: sumar días y ventana de 7", () => {
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.deepEqual(lastDays("2026-11-09", 3), ["2026-11-07", "2026-11-08", "2026-11-09"]);
});

test("racha: hoy sin práctica no la rompe, un hueco sí", () => {
  const days = new Set(["2026-11-06", "2026-11-07", "2026-11-08"]);
  assert.deepEqual(computeStreak(days, "2026-11-09"), { current: 3, best: 3 });
  assert.deepEqual(computeStreak(days, "2026-11-10"), { current: 0, best: 3 });
  days.add("2026-11-09");
  assert.deepEqual(computeStreak(days, "2026-11-09"), { current: 4, best: 4 });
});

test("racha: la mejor puede estar en el pasado", () => {
  const days = new Set(["2026-10-01", "2026-10-02", "2026-10-03", "2026-11-09"]);
  assert.deepEqual(computeStreak(days, "2026-11-09"), { current: 1, best: 3 });
});

test("estrellas de dominio", () => {
  assert.equal(masteryStars(null), 0);
  assert.equal(masteryStars({ stage: "seen", intervalDays: 1 }), 1);
  assert.equal(masteryStars({ stage: "fragile", intervalDays: 0 }), 1);
  assert.equal(masteryStars({ stage: "mastered", intervalDays: 16 }), 2);
  assert.equal(masteryStars({ stage: "mastered", intervalDays: 80 }), 3);
  assert.equal(masteryStars({ stage: "dismissed", intervalDays: 80 }), 0);
});

import { parseAmount, parseSource, pickForPractice } from "../../src/lib/practice-pick.ts";

test("práctica: primero lo vencido, luego lo nuevo; sin programadas ni descartadas", () => {
  const now = new Date("2026-11-12T12:00:00Z");
  const states = new Map([
    ["a", { stage: "mastered", dueAt: "2026-12-01T00:00:00Z" }], // programada: fuera
    ["b", { stage: "fragile", dueAt: "2026-11-12T11:00:00Z" }], // vencida
    ["c", { stage: "dismissed", dueAt: null }], // descartada: fuera
    ["d", { stage: "fragile", dueAt: "2026-11-10T00:00:00Z" }], // vencida, más atrasada
  ]);
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  assert.deepEqual(pickForPractice(ids, states, 10, now), ["d", "b", "e", "f", "g"]);
  assert.deepEqual(pickForPractice(ids, states, 3, now), ["d", "b", "e"]);
  assert.deepEqual(pickForPractice(["a", "c"], states, 5, now), []);
  assert.deepEqual(pickForPractice(["e", "e", "f"], states, 5, now), ["e", "f"]);
});

test("práctica: fuente y cantidad válidas", () => {
  assert.deepEqual(parseSource("hsk-3"), { kind: "hsk", level: 3 });
  assert.deepEqual(parseSource("hsk-7"), { kind: "hsk", level: 7 });
  assert.equal(parseSource("hsk-8"), null);
  assert.equal(parseSource("tema-no-es-uuid"), null);
  assert.deepEqual(parseSource("tema-3f2a1b4c-0000-4000-8000-000000000001"), { kind: "theme", id: "3f2a1b4c-0000-4000-8000-000000000001" });
  assert.equal(parseSource(undefined), null);
  assert.equal(parseAmount("40"), 40);
  assert.equal(parseAmount("7"), 20);
  assert.equal(parseAmount(undefined), 20);
});
