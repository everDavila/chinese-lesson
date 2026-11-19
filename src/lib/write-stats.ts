// Escritura en clase (docs/DISENO-ESCRITURA-EN-CLASE.md): límites, intento y
// estadísticas. Funciones puras y sin dependencias de servidor: las usan el
// celular del alumno, el panel de la profesora y las pruebas.

// ── Límites ─────────────────────────────────────────────────────────────
export type LimitBand = { /** Hasta cuántos trazos vale; null = el resto. */ upTo: number | null; /** Errores permitidos antes de mostrar el carácter. */ max: number };

export type WriteConfig = {
  /** Errores permitidos por carácter según sus trazos (tramos de menor a mayor). */
  limits: LimitBand[];
  /** Errores en un mismo trazo antes de darlo por bueno (se dibuja y cuenta como fallado). */
  perStroke: number;
  /** % de trazos acertados a la primera para contar como «lo logró». */
  pass: number;
  /** Con guía (calcar) o de memoria. */
  guide: boolean;
};

/** Valores iniciales: una suposición razonable, a revisar tras las primeras clases. */
export const DEFAULT_WRITE_CONFIG: WriteConfig = {
  limits: [
    { upTo: 2, max: 3 },
    { upTo: 4, max: 5 },
    { upTo: 6, max: 7 },
    { upTo: 8, max: 9 },
    { upTo: 10, max: 10 },
    { upTo: 12, max: 11 },
    { upTo: 16, max: 13 },
    { upTo: 20, max: 15 },
    { upTo: null, max: 18 },
  ],
  perStroke: 3,
  pass: 80,
  guide: true,
};

/** Errores permitidos para un carácter de `strokes` trazos. */
export function limitFor(strokes: number, config: WriteConfig): number {
  const band = config.limits.find((b) => b.upTo === null || strokes <= b.upTo);
  return band?.max ?? config.limits[config.limits.length - 1]?.max ?? 1;
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Valida lo que llega de fuera (la profesora o la base). null si no es una configuración válida. */
export function parseConfig(input: unknown): WriteConfig | null {
  if (typeof input !== "object" || input === null) return null;
  const c = input as Record<string, unknown>;
  if (!Array.isArray(c.limits) || c.limits.length < 1 || c.limits.length > 12) return null;
  const limits: LimitBand[] = [];
  let prev = 0;
  for (const [i, raw] of c.limits.entries()) {
    if (typeof raw !== "object" || raw === null) return null;
    const b = raw as Record<string, unknown>;
    const last = i === c.limits.length - 1;
    if (!isInt(b.max, 1, 60)) return null;
    if (last) {
      if (b.upTo !== null) return null;
      limits.push({ upTo: null, max: b.max });
    } else {
      if (!isInt(b.upTo, prev + 1, 60)) return null;
      prev = b.upTo;
      limits.push({ upTo: b.upTo, max: b.max });
    }
  }
  if (!isInt(c.perStroke, 1, 10) || !isInt(c.pass, 50, 100) || typeof c.guide !== "boolean") return null;
  return { limits, perStroke: c.perStroke, pass: c.pass, guide: c.guide };
}

/** Avisos (no errores) para la profesora: un tramo largo que permite menos que uno corto. */
export function configWarnings(config: WriteConfig): string[] {
  const out: string[] = [];
  for (let i = 1; i < config.limits.length; i++) {
    if (config.limits[i].max < config.limits[i - 1].max) out.push(`El tramo ${i + 1} permite menos errores que el ${i}.`);
  }
  return out;
}

// ── Intento ─────────────────────────────────────────────────────────────
export type Pointer = "touch" | "mouse" | "pen";

export type AttemptChar = {
  char: string;
  /** Trazos del carácter; null si faltan sus datos. */
  strokes: number | null;
  /** Trazos completados (hasta que se mostró o terminó). */
  done: number;
  /** Errores por trazo (largo = trazos). */
  errors: number[];
  /** Se le mostró el carácter (llegó al límite o pidió verlo). */
  shown: boolean;
};

export type WriteAttempt = {
  v: 1;
  chars: AttemptChar[];
  /** Instante (ms desde que se mostró la palabra) de cada acción de trazo, acertada o no. */
  events: number[];
  /** Ms hasta el primer trazo; null si no hubo. */
  msFirst: number | null;
  msTotal: number;
  pointer: Pointer | null;
  guide: boolean;
};

const MAX_CHARS = 12;
const MAX_STROKES = 60;
const MAX_EVENTS = 2000;

/** Lee un intento de fuera con cuidado: null si no tiene la forma esperada. Recorta lo que sobra. */
export function parseAttempt(input: unknown): WriteAttempt | null {
  if (typeof input !== "object" || input === null) return null;
  const a = input as Record<string, unknown>;
  if (a.v !== 1 || !Array.isArray(a.chars) || a.chars.length < 1 || a.chars.length > MAX_CHARS) return null;
  const chars: AttemptChar[] = [];
  for (const raw of a.chars) {
    if (typeof raw !== "object" || raw === null) return null;
    const c = raw as Record<string, unknown>;
    if (typeof c.char !== "string" || c.char.length < 1 || c.char.length > 2) return null;
    const strokes = c.strokes === null ? null : isInt(c.strokes, 1, MAX_STROKES) ? c.strokes : undefined;
    if (strokes === undefined) return null;
    if (!Array.isArray(c.errors) || c.errors.length > MAX_STROKES || !c.errors.every((n) => isInt(n, 0, 1000))) return null;
    if (strokes !== null && c.errors.length !== strokes) return null;
    if (!isInt(c.done, 0, MAX_STROKES) || (strokes !== null && c.done > strokes) || typeof c.shown !== "boolean") return null;
    chars.push({ char: c.char, strokes, done: c.done, errors: c.errors as number[], shown: c.shown });
  }
  if (!Array.isArray(a.events) || a.events.length > MAX_EVENTS || !a.events.every((n) => isInt(n, 0, 86_400_000))) return null;
  if (!(a.msFirst === null || isInt(a.msFirst, 0, 86_400_000)) || !isInt(a.msTotal, 0, 86_400_000)) return null;
  if (!(a.pointer === null || a.pointer === "touch" || a.pointer === "mouse" || a.pointer === "pen")) return null;
  if (typeof a.guide !== "boolean") return null;
  return { v: 1, chars, events: a.events as number[], msFirst: a.msFirst, msTotal: a.msTotal, pointer: a.pointer, guide: a.guide };
}

// ── Medidas de un intento ───────────────────────────────────────────────
/**
 * % de trazos acertados a la primera (0–100): de los trazos de la palabra,
 * los completados sin ningún error. Un trazo fallado cuenta una sola vez; los
 * de un carácter que se mostró y no llegó a completar cuentan como no
 * acertados. null si no se conoce ningún carácter.
 */
export function precision(a: WriteAttempt): number | null {
  let total = 0;
  let good = 0;
  for (const c of a.chars) {
    if (c.strokes === null) continue;
    total += c.strokes;
    for (let i = 0; i < c.strokes; i++) if (i < c.done && c.errors[i] === 0) good += 1;
  }
  return total === 0 ? null : Math.round((good / total) * 100);
}

/** Una pausa más larga que esto no se suma al tiempo activo (se distrajo). */
export const ACTIVE_PAUSE_CAP_MS = 20_000;

/**
 * Tiempo activo: lo que dudó antes del primer trazo y las pausas entre
 * acciones, con cada pausa limitada a `cap`. El tiempo de reloj se guarda aparte.
 */
export function activeMs(a: WriteAttempt, cap = ACTIVE_PAUSE_CAP_MS): number {
  const events = [...a.events].sort((x, y) => x - y);
  if (!events.length) return 0;
  let total = Math.min(a.msFirst ?? events[0], cap);
  for (let i = 1; i < events.length; i++) total += Math.min(events[i] - events[i - 1], cap);
  return total;
}

/** Cuántos caracteres de la palabra se le mostraron. */
export const shownCount = (a: WriteAttempt) => a.chars.filter((c) => c.shown).length;

// ── Resumen de la clase ─────────────────────────────────────────────────
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Qué cifras mostrar según cuántos alumnos terminaron: ninguna, solo cada alumno, con detalle o completas. */
export type SummaryMode = "none" | "individual" | "detail" | "full";
export const summaryMode = (n: number): SummaryMode => (n === 0 ? "none" : n < 5 ? "individual" : n < 10 ? "detail" : "full");

export type ClassRow = {
  name: string;
  precision: number | null;
  activeMs: number;
  msFirst: number | null;
  pointer: Pointer | null;
  shown: number;
  passed: boolean;
};

export type ClassSummary = {
  mode: SummaryMode;
  /** Alumnos que terminaron la palabra. */
  n: number;
  passed: number;
  medianPrecision: number | null;
  minPrecision: number | null;
  maxPrecision: number | null;
  medianActiveMs: number | null;
  /** De menos a más precisión: arriba, quien más necesita ayuda. */
  rows: ClassRow[];
};

export function summarize(items: { name: string; attempt: WriteAttempt }[], config: Pick<WriteConfig, "pass">): ClassSummary {
  const rows: ClassRow[] = items.map(({ name, attempt }) => {
    const p = precision(attempt);
    return {
      name,
      precision: p,
      activeMs: activeMs(attempt),
      msFirst: attempt.msFirst,
      pointer: attempt.pointer,
      shown: shownCount(attempt),
      passed: p !== null && p >= config.pass,
    };
  });
  rows.sort((a, b) => (a.precision ?? -1) - (b.precision ?? -1) || a.name.localeCompare(b.name));
  const precisions = rows.flatMap((r) => (r.precision === null ? [] : [r.precision]));
  const n = rows.length;
  return {
    mode: summaryMode(n),
    n,
    passed: rows.filter((r) => r.passed).length,
    medianPrecision: median(precisions),
    minPrecision: precisions.length ? Math.min(...precisions) : null,
    maxPrecision: precisions.length ? Math.max(...precisions) : null,
    medianActiveMs: median(rows.map((r) => r.activeMs)),
    rows,
  };
}
