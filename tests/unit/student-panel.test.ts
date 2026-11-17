import assert from "node:assert/strict";
import { test } from "node:test";
import { tonesOf } from "../../src/lib/pinyin.ts";
import { masteryStars } from "../../src/lib/srs.ts";
import { accuracyBySkill } from "../../src/lib/student-accuracy.ts";
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

test("racha: hoy sin práctica no la rompe, dos días seguidos sí", () => {
  const days = new Set(["2026-11-06", "2026-11-07", "2026-11-08"]);
  assert.deepEqual(computeStreak(days, "2026-11-09"), { current: 3, best: 3, rested: 0 });
  assert.deepEqual(computeStreak(days, "2026-11-11"), { current: 0, best: 3, rested: 0 });
  days.add("2026-11-09");
  assert.deepEqual(computeStreak(days, "2026-11-09"), { current: 4, best: 4, rested: 0 });
});

test("racha: un día libre por semana no la rompe", () => {
  // 06, 07, (08 libre), 09: la racha sigue y el día libre no suma.
  const days = new Set(["2026-11-06", "2026-11-07", "2026-11-09"]);
  assert.deepEqual(computeStreak(days, "2026-11-09"), { current: 3, best: 3, rested: 1 });
  // Ayer fue el día libre y hoy aún no practica: la racha se mantiene.
  assert.deepEqual(computeStreak(new Set(["2026-11-07", "2026-11-08"]), "2026-11-10"), { current: 2, best: 2, rested: 1 });
  // Dos libres en menos de 7 días: el segundo rompe.
  const two = new Set(["2026-11-01", "2026-11-03", "2026-11-05"]);
  assert.deepEqual(computeStreak(two, "2026-11-05"), { current: 2, best: 2, rested: 1 });
  // Siete días después ya vuelve a haber un libre.
  const spaced = new Set(["2026-11-01", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-11"]);
  assert.deepEqual(computeStreak(spaced, "2026-11-11"), { current: 9, best: 9, rested: 2 });
});

test("racha: la mejor puede estar en el pasado", () => {
  const days = new Set(["2026-10-01", "2026-10-02", "2026-10-03", "2026-11-09"]);
  assert.deepEqual(computeStreak(days, "2026-11-09"), { current: 1, best: 3, rested: 0 });
});

test("estrellas de dominio", () => {
  assert.equal(masteryStars(null), 0);
  assert.equal(masteryStars({ stage: "seen", intervalDays: 1 }), 1);
  assert.equal(masteryStars({ stage: "fragile", intervalDays: 0 }), 1);
  assert.equal(masteryStars({ stage: "mastered", intervalDays: 16 }), 2);
  assert.equal(masteryStars({ stage: "mastered", intervalDays: 80 }), 3);
  assert.equal(masteryStars({ stage: "dismissed", intervalDays: 80 }), 0);
});

import { wordsForMinutes, parseAmount, parseExercise, isFrequencyCollection, isRadicalCollection, parseSource, pickForPractice, skillOf, themeGroup } from "../../src/lib/practice-pick.ts";

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
  assert.deepEqual(parseSource("frecuencia-3f2a1b4c-0000-4000-8000-000000000001"), { kind: "frequency", id: "3f2a1b4c-0000-4000-8000-000000000001" });
  assert.equal(parseSource("frecuencia-no-es-uuid"), null);
  assert.equal(isFrequencyCollection("Alta frecuencia 1000"), true);
  assert.equal(isFrequencyCollection("Frecuencia y grado"), false);
  assert.deepEqual(parseSource("radicales-3f2a1b4c-0000-4000-8000-000000000001"), { kind: "radicals", id: "3f2a1b4c-0000-4000-8000-000000000001" });
  assert.equal(parseSource("radicales-no-es-uuid"), null);
  assert.equal(isRadicalCollection("Radicales más usados"), true);
  assert.equal(isRadicalCollection("Pictogramas"), false);
  assert.equal(parseAmount("40"), 40);
  assert.equal(parseAmount("7"), 7);
  assert.equal(parseAmount("3"), 20);
  assert.equal(parseAmount("100"), 20);
  assert.equal(parseAmount("7.5"), 20);
  assert.equal(wordsForMinutes(5, "tarjeta"), 15);
  assert.equal(wordsForMinutes(10, "escribir"), 13);
  assert.equal(wordsForMinutes(1, "escribir"), 5);
  assert.equal(parseAmount(undefined), 20);
});

test("temas: se agrupan por la nota de origen y los niveles HSK no son temas", () => {
  assert.equal(themeGroup("Temario oficial HSK 3.0, nivel 2, en lecciones de 20"), null);
  assert.equal(themeGroup("Vocabulario HSK 3.0 por contexto (nivel 1–3)."), "situations");
  assert.equal(themeGroup("Lista manual por tema, sobre el temario HSK 3.0"), "topics");
  assert.equal(themeGroup("Lista manual por función, sobre el temario HSK 3.0"), "functions");
  assert.equal(themeGroup("Generada por regla desde la categoría del temario"), "wordTypes");
  assert.equal(themeGroup("Lista manual sobre el temario HSK 3.0 (niveles 1–3)"), "wordTypes");
  assert.equal(themeGroup("Lista del libro de la profesora, dada por Ever"), "other");
  assert.equal(themeGroup(null), "other");
});

test("ejercicio: tarjeta por defecto y su habilidad", () => {
  assert.equal(parseExercise(undefined), "card");
  assert.equal(parseExercise("escribir"), "write");
  assert.equal(parseExercise("otra"), "card");
  assert.equal(skillOf("card"), "recognize");
  assert.equal(skillOf("write"), "write");
});

test("pinyinSegments conserva separadores y da el tono de cada sílaba", async () => {
  const { pinyinSegments } = await import("../../src/lib/pinyin.ts");
  assert.deepEqual(pinyinSegments("Xī'ān"), [
    { text: "Xī", tone: 1 },
    { text: "'", tone: null },
    { text: "ān", tone: 1 },
  ]);
  assert.equal(pinyinSegments("nǐ hǎo").map((s) => s.text).join(""), "nǐ hǎo");
  assert.deepEqual(pinyinSegments("péngyou").map((s) => s.tone), [2, 5]);
});

test("proyección: sin datos suficientes no estima", async () => {
  const { projectCompletion } = await import("../../src/lib/student-projection.ts");
  const days = Array.from({ length: 12 }, () => "2026-11-10");
  const p = projectCompletion(days, 100, "2026-11-12");
  assert.equal(p.status, "insufficient");
});

test("proyección: da un rango con ritmo estable", async () => {
  const { projectCompletion, weeklyNewWords } = await import("../../src/lib/student-projection.ts");
  // 4 semanas, 5 palabras nuevas por semana: 20 palabras en 28 días.
  const seen: string[] = [];
  for (let d = 0; d < 28; d += 7) for (let k = 0; k < 5; k++) seen.push(`2026-10-${String(1 + d).padStart(2, "0")}`);
  const p = projectCompletion(seen, 100, "2026-10-28");
  assert.equal(p.status, "ok");
  if (p.status === "ok") {
    assert.ok(p.weeksMin <= (p.weeksMax ?? Infinity));
    assert.ok(p.weeksMin >= 10 && p.weeksMin <= 40);
  }
  assert.equal(weeklyNewWords(seen, "2026-10-28", 4).reduce((a, b) => a + b, 0), 20);
});

test("proyección: nivel terminado y sin ritmo", async () => {
  const { projectCompletion } = await import("../../src/lib/student-projection.ts");
  const old = Array.from({ length: 12 }, () => "2026-09-01");
  assert.equal(projectCompletion(old, 0, "2026-11-12").status, "done");
  // Mucha práctica antigua y nada reciente: el ritmo reciente es 0, el rango queda sin tope.
  const p = projectCompletion(old, 50, "2026-11-12");
  assert.equal(p.status, "ok");
  if (p.status === "ok") assert.equal(p.weeksMax, null);
});

test("precisión por habilidad: known cuenta, gave_up no, sin intentos es null", () => {
  const r = accuracyBySkill([
    { skill: "write", outcome: "correct" },
    { skill: "write", outcome: "gave_up" },
    { skill: "write", outcome: "known" },
    { skill: "write", outcome: "wrong" },
  ]);
  assert.deepEqual(r[1], { skill: "write", attempts: 4, correct: 2, percent: 50 });
  assert.deepEqual(r[0], { skill: "recognize", attempts: 0, correct: 0, percent: null });
});
