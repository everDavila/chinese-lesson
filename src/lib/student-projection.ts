// Proyección de ritmo del alumno: a partir del día en que empezó cada palabra
// estima cuántas semanas le faltan para ver todas las de un nivel. Funciones
// puras. Cuenta palabras *empezadas*, no dominadas: de cuándo se dominó cada una
// no hay registro (updated_at se mueve con cada repaso). Por eso se da como
// rango y solo con datos suficientes.

export const MIN_PROJECTION_DAYS = 14;
export const MIN_PROJECTION_WORDS = 10;
export const MAX_PROJECTION_WEEKS = 104;

const DAY = 24 * 3600 * 1000;

/** Días entre dos claves YYYY-MM-DD (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
}

/** Palabras nuevas por semana, de la más antigua a la actual (la actual son los últimos 7 días). */
export function weeklyNewWords(firstSeen: string[], today: string, weeks = 8): number[] {
  const buckets = new Array<number>(weeks).fill(0);
  for (const day of firstSeen) {
    const ago = daysBetween(day, today);
    if (ago < 0) continue;
    const i = Math.floor(ago / 7);
    if (i < weeks) buckets[i] += 1;
  }
  return buckets.reverse();
}

export type Projection =
  | { status: "insufficient"; daysOfData: number; words: number }
  | { status: "done" }
  | { status: "no-pace" }
  | { status: "ok"; weeksMin: number; /** null: sin tope (el ritmo mínimo es casi cero). */ weeksMax: number | null; perWeekLow: number; perWeekHigh: number };

/**
 * @param firstSeen día (YYYY-MM-DD) en que el alumno empezó cada palabra.
 * @param remaining palabras del nivel objetivo que aún no ha empezado.
 */
export function projectCompletion(firstSeen: string[], remaining: number, today: string): Projection {
  const first = [...firstSeen].sort()[0];
  const daysOfData = first ? daysBetween(first, today) + 1 : 0;
  if (daysOfData < MIN_PROJECTION_DAYS || firstSeen.length < MIN_PROJECTION_WORDS) {
    return { status: "insufficient", daysOfData: Math.max(daysOfData, 0), words: firstSeen.length };
  }
  if (remaining <= 0) return { status: "done" };

  const overall = firstSeen.length / (daysOfData / 7);
  const recent = firstSeen.filter((d) => daysBetween(d, today) < 14).length / 2;
  const low = Math.min(overall, recent);
  const high = Math.max(overall, recent);
  if (high <= 0) return { status: "no-pace" };

  const weeksMin = Math.min(Math.ceil(remaining / high), MAX_PROJECTION_WEEKS);
  const rawMax = low > 0 ? Math.ceil(remaining / low) : null;
  return {
    status: "ok",
    weeksMin,
    weeksMax: rawMax === null || rawMax > MAX_PROJECTION_WEEKS ? null : rawMax,
    perWeekLow: Math.round(low * 10) / 10,
    perWeekHigh: Math.round(high * 10) / 10,
  };
}
