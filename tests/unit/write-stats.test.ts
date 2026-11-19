import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_WRITE_CONFIG,
  activeMs,
  configWarnings,
  limitFor,
  median,
  parseAttempt,
  parseConfig,
  precision,
  shownCount,
  summarize,
  summaryMode,
  type WriteAttempt,
} from "../../src/lib/write-stats.ts";

const char = (c: string, strokes: number, errors: number[], done = strokes, shown = false) => ({ char: c, strokes, errors, done, shown });
const attempt = (chars: ReturnType<typeof char>[], extra: Partial<WriteAttempt> = {}): WriteAttempt => ({
  v: 1,
  chars,
  events: [],
  msFirst: 1000,
  msTotal: 10_000,
  pointer: "touch",
  guide: true,
  ...extra,
});

test("límites: el tramo que corresponde a los trazos del carácter", () => {
  const c = DEFAULT_WRITE_CONFIG;
  assert.equal(limitFor(1, c), 3);
  assert.equal(limitFor(2, c), 3);
  assert.equal(limitFor(3, c), 5);
  assert.equal(limitFor(7, c), 9);
  assert.equal(limitFor(9, c), 10);
  assert.equal(limitFor(13, c), 13);
  assert.equal(limitFor(20, c), 15);
  assert.equal(limitFor(21, c), 18);
  assert.equal(limitFor(40, c), 18);
});

test("configuración: la inicial es válida y lo raro se rechaza", () => {
  assert.deepEqual(parseConfig(JSON.parse(JSON.stringify(DEFAULT_WRITE_CONFIG))), DEFAULT_WRITE_CONFIG);
  const bad = (patch: object) => parseConfig({ ...DEFAULT_WRITE_CONFIG, ...patch });
  assert.equal(parseConfig(null), null);
  assert.equal(bad({ limits: [] }), null);
  assert.equal(bad({ limits: [{ upTo: 4, max: 3 }] }), null); // el último tramo debe ser abierto
  assert.equal(bad({ limits: [{ upTo: 4, max: 3 }, { upTo: 4, max: 5 }, { upTo: null, max: 6 }] }), null); // tramos que no crecen
  assert.equal(bad({ limits: [{ upTo: 4, max: 0 }, { upTo: null, max: 6 }] }), null);
  assert.equal(bad({ limits: [{ upTo: 4, max: 99 }, { upTo: null, max: 6 }] }), null);
  assert.equal(bad({ perStroke: 0 }), null);
  assert.equal(bad({ pass: 30 }), null);
  assert.equal(bad({ guide: "sí" }), null);
  assert.ok(parseConfig({ limits: [{ upTo: null, max: 5 }], perStroke: 3, pass: 80, guide: false }));
});

test("configuración: avisa si un tramo largo permite menos que uno corto", () => {
  assert.deepEqual(configWarnings(DEFAULT_WRITE_CONFIG), []);
  const c = { ...DEFAULT_WRITE_CONFIG, limits: [{ upTo: 4, max: 8 }, { upTo: null, max: 5 }] };
  assert.equal(configWarnings(c).length, 1);
});

test("precisión: % de trazos acertados a la primera", () => {
  assert.equal(precision(attempt([char("一", 1, [0]), char("二", 2, [0, 0])])), 100);
  // 3 trazos: uno con errores (aunque fueran 5, cuenta una vez)
  assert.equal(precision(attempt([char("川", 3, [0, 5, 0])])), 67);
  // un carácter mostrado a medias: lo no completado cuenta como no acertado
  assert.equal(precision(attempt([char("好", 6, [0, 0, 0, 3, 0, 0], 3, true)])), 50);
  // dos caracteres: 9 de 13 trazos → 69
  assert.equal(precision(attempt([char("你", 7, [0, 0, 0, 0, 0, 0, 0]), char("好", 6, [1, 1, 1, 1, 0, 0])])), 69);
  // sin datos de trazos
  assert.equal(precision(attempt([{ char: "x", strokes: null, errors: [], done: 0, shown: false }])), null);
});

test("tiempo activo: duda más pausas, con cada pausa limitada a 20 s", () => {
  assert.equal(activeMs(attempt([char("一", 1, [0])], { events: [2000], msFirst: 2000 })), 2000);
  assert.equal(activeMs(attempt([char("二", 2, [0, 0])], { events: [1000, 3000, 6000], msFirst: 1000 })), 6000);
  // se fue 5 minutos entre dos trazos: solo suma 20 s
  assert.equal(activeMs(attempt([char("二", 2, [0, 0])], { events: [1000, 301_000], msFirst: 1000 })), 21_000);
  // la duda inicial también se limita
  assert.equal(activeMs(attempt([char("一", 1, [0])], { events: [200_000], msFirst: 200_000 })), 20_000);
  assert.equal(activeMs(attempt([char("一", 1, [0])], { events: [] })), 0);
});

test("caracteres mostrados", () => {
  assert.equal(shownCount(attempt([char("你", 7, [0, 0, 0, 0, 0, 0, 0]), char("好", 6, [4, 4, 4, 0, 0, 0], 0, true)])), 1);
});

test("modos de resumen según cuántos terminaron", () => {
  assert.equal(summaryMode(0), "none");
  assert.equal(summaryMode(1), "individual");
  assert.equal(summaryMode(4), "individual");
  assert.equal(summaryMode(5), "detail");
  assert.equal(summaryMode(9), "detail");
  assert.equal(summaryMode(10), "full");
  assert.equal(summaryMode(18), "full");
});

test("mediana: no se deja arrastrar por un alumno que juega", () => {
  assert.equal(median([]), null);
  assert.equal(median([7]), 7);
  assert.equal(median([1, 9, 5]), 5);
  assert.equal(median([4, 2, 8, 6]), 5);
  // el ejemplo del diseño: 10 alumnos, uno con 5 %
  const values = [5, 80, 85, 87, 88, 89, 90, 91, 92, 95];
  assert.equal(median(values), 88.5);
  assert.ok(Math.abs(values.reduce((a, b) => a + b, 0) / values.length - 80.2) < 1e-9);
});

test("resumen de la clase: titular, mediana y quién necesita más ayuda", () => {
  const mk = (name: string, good: number) => ({ name, attempt: attempt([char("川", 10, Array.from({ length: 10 }, (_, i) => (i < good ? 0 : 1)))]) });
  const s = summarize([mk("Ana", 10), mk("Luis", 9), mk("Mia", 4), mk("Pedro", 8), mk("Sol", 10)], { pass: 80 });
  assert.equal(s.mode, "detail");
  assert.equal(s.n, 5);
  assert.equal(s.passed, 4); // 100, 90, 80, 100 ≥ 80; Mia con 40 no
  assert.equal(s.medianPrecision, 90);
  assert.equal(s.minPrecision, 40);
  assert.equal(s.maxPrecision, 100);
  assert.equal(s.rows[0].name, "Mia"); // arriba, la que más necesita ayuda
  assert.equal(summarize([], { pass: 80 }).mode, "none");
});

test("intento de fuera: se acepta el válido y se rechaza lo raro", () => {
  const good = attempt([char("你", 7, [0, 1, 0, 0, 0, 0, 0])]);
  assert.deepEqual(parseAttempt(JSON.parse(JSON.stringify(good))), good);
  assert.equal(parseAttempt(null), null);
  assert.equal(parseAttempt({ ...good, v: 2 }), null);
  assert.equal(parseAttempt({ ...good, chars: [] }), null);
  assert.equal(parseAttempt({ ...good, chars: [{ ...good.chars[0], errors: [0, 1] }] }), null); // largo distinto de los trazos
  assert.equal(parseAttempt({ ...good, chars: [{ ...good.chars[0], done: 99 }] }), null);
  assert.equal(parseAttempt({ ...good, events: [-1] }), null);
  assert.equal(parseAttempt({ ...good, pointer: "laser" }), null);
  assert.equal(parseAttempt({ ...good, msTotal: "x" }), null);
});
