// npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { combinedVerdict, teacherVerdict, votesVerdict } from "../../src/lib/semaphore.ts";

test("menos de 3 votos: sin datos", () => {
  assert.equal(votesVerdict([0, 0, 1, 1]), "nodata");
});

test("participación baja frente a los esperados: sin datos", () => {
  // 3 votos de 10 esperados = 30 % < 40 %.
  assert.equal(votesVerdict([0, 0, 2, 1], 10), "nodata");
  assert.equal(votesVerdict([0, 0, 3, 1], 10), "mastered");
});

test("30 % o más de 'No la sé': refuerzo, aunque el resto sea Fácil", () => {
  assert.equal(votesVerdict([3, 0, 0, 7]), "reinforce");
});

test("media por debajo de 1,2: refuerzo", () => {
  // 1 No la sé + 4 Me costó: media 0,8.
  assert.equal(votesVerdict([1, 4, 0, 0]), "reinforce");
});

test("70 % Bien+Fácil y como mucho 10 % No la sé: dominio aparente", () => {
  assert.equal(votesVerdict([1, 2, 4, 3]), "mastered");
});

test("lo demás: necesita repaso", () => {
  assert.equal(votesVerdict([0, 4, 3, 3]), "review");
});

test("docente: 1 refuerzo, 2 repaso, 3 y 4 dominio", () => {
  assert.deepEqual([1, 2, 3, 4].map((r) => teacherVerdict(r as 1 | 2 | 3 | 4)), ["reinforce", "review", "mastered", "mastered"]);
});

test("combinado: el peor de los dos; sin datos no cuenta", () => {
  assert.equal(combinedVerdict("mastered", "review"), "review");
  assert.equal(combinedVerdict("reinforce", "mastered"), "reinforce");
  assert.equal(combinedVerdict("nodata", "mastered"), "mastered");
  assert.equal(combinedVerdict("review"), "review");
});
