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

/**
 * Racha actual y mejor racha. Hoy sin práctica todavía no rompe la racha: se
 * cuenta desde ayer hasta que termine el día.
 */
export function computeStreak(days: Set<string>, today: string): { current: number; best: number } {
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}
