// Días de práctica del alumno: racha y semana. Funciones puras; el día se
// corta en una zona horaria fija porque hoy todos los alumnos están en
// Latinoamérica (Perú). Si hay alumnos en otra zona, pasa a ser un ajuste.
export const APP_TIME_ZONE = "America/Lima";

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** "2026-11-09": el día local de un instante. */
export function dayKey(at: Date | string | number): string {
  return fmt.format(new Date(at));
}

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Los últimos `n` días terminando en `today`, del más antiguo al de hoy. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86_400_000);
}

/**
 * Días seguidos que terminan en `from`, yendo hacia atrás. Un día libre por
 * cada 7: un solo día sin práctica entre dos con práctica no rompe la racha
 * (no suma al conteo). Dos días seguidos sin práctica sí la rompen.
 */
function runEndingAt(days: Set<string>, from: string): { length: number; rested: number } {
  let length = 0;
  let rested = 0;
  let lastRest: string | null = null;
  let cursor = from;
  for (;;) {
    if (days.has(cursor)) {
      length += 1;
    } else if (days.has(addDays(cursor, -1)) && (lastRest === null || daysBetween(lastRest, cursor) >= 7)) {
      lastRest = cursor;
      rested += 1;
    } else {
      return { length, rested };
    }
    cursor = addDays(cursor, -1);
  }
}

/**
 * Racha actual y mejor racha, con un día libre por semana (ver `runEndingAt`).
 * Hoy sin práctica todavía no rompe la racha: se cuenta desde ayer hasta que
 * termine el día. `rested` = días libres usados en la racha actual.
 */
export function computeStreak(days: Set<string>, today: string): { current: number; best: number; rested: number } {
  const start = days.has(today) ? today : addDays(today, -1);
  const now = runEndingAt(days, start);
  let best = now.length;
  for (const d of days) best = Math.max(best, runEndingAt(days, d).length);
  return { current: now.length, best, rested: now.rested };
}
