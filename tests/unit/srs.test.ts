// npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { dismissedState, nextState } from "../../src/lib/srs.ts";

const now = new Date("2026-11-10T12:00:00Z");
const days = (d: Date | null) => (d ? (d.getTime() - now.getTime()) / 86_400_000 : null);

test("primer acierto: vista, vuelve mañana", () => {
  const n = nextState(null, "correct", 3, now);
  assert.equal(n.stage, "seen");
  assert.equal(n.intervalDays, 1);
  assert.equal(days(n.dueAt), 1);
});

test("aciertos seguidos suben la escalera y acaban dominada", () => {
  let s = nextState(null, "correct", 3, now);
  const seen = [s.intervalDays];
  for (let i = 0; i < 3; i++) {
    s = nextState(s, "correct", 3, now);
    seen.push(s.intervalDays);
  }
  assert.deepEqual(seen, [1, 3, 7, 16]);
  assert.equal(s.stage, "mastered");
});

test("«Fácil» salta un peldaño", () => {
  assert.equal(nextState(null, "correct", 4, now).intervalDays, 3);
});

test("fallar la devuelve a repasar en minutos, frágil", () => {
  const n = nextState({ stage: "mastered", intervalDays: 16 }, "wrong", 2, now);
  assert.equal(n.stage, "fragile");
  assert.equal(n.intervalDays, 0);
  assert.equal(n.dueAt!.getTime() - now.getTime(), 10 * 60_000);
});

test("rendirse cuenta como fallar", () => {
  assert.equal(nextState(null, "gave_up", 1, now).stage, "fragile");
});

test("«ya la sé»: dominada y chequeo esporádico a los 30 días", () => {
  const n = nextState(null, "known", null, now);
  assert.equal(n.stage, "mastered");
  assert.equal(days(n.dueAt), 30);
});

test("chequeo acertado alarga el intervalo; fallado la devuelve a la cola", () => {
  const known = nextState(null, "known", null, now);
  const pass = nextState({ stage: known.stage, intervalDays: known.intervalDays }, "correct", 3, now);
  assert.ok(pass.intervalDays > 30);
  const fail = nextState({ stage: known.stage, intervalDays: known.intervalDays }, "wrong", 1, now);
  assert.equal(fail.stage, "fragile");
});

test("«no me la preguntes»: fuera de la cola y no vuelve aunque practique", () => {
  const d = dismissedState({ stage: "fragile", intervalDays: 3 });
  assert.equal(d.dueAt, null);
  const after = nextState({ stage: d.stage, intervalDays: d.intervalDays }, "correct", 4, now);
  assert.equal(after.stage, "dismissed");
  assert.equal(after.dueAt, null);
});

test("el intervalo no pasa del último peldaño", () => {
  assert.equal(nextState({ stage: "mastered", intervalDays: 180 }, "correct", 4, now).intervalDays, 180);
});
