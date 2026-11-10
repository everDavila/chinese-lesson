// Repetición espaciada del alumno (docs/DISENO-AVANCE-ESTUDIANTE.md). Función
// pura: dado el estado previo de una palabra y lo que acaba de pasar, dice la
// etapa y cuándo vuelve. El estado se puede recalcular desde los eventos.
//
// Escalera de intervalos en días: acertar sube un peldaño (dos si se valoró
// «Fácil»); fallar o rendirse la devuelve a repasar en minutos. «Ya la sé» la
// saca de la cola diaria pero vuelve en un chequeo esporádico a los 30 días,
// y cada chequeo acertado alarga el intervalo.

export type Stage = "seen" | "fragile" | "mastered" | "dismissed";
export type SrsOutcome = "correct" | "wrong" | "gave_up" | "known";
export type SrsState = { stage: Stage; intervalDays: number };
export type SrsNext = { stage: Stage; intervalDays: number; dueAt: Date | null };

export const LADDER = [0, 1, 3, 7, 16, 35, 80, 180];
export const KNOWN_FIRST_CHECK_DAYS = 30;
export const RETRY_MINUTES = 10;
/** Desde este intervalo la palabra se considera dominada. */
export const MASTERED_FROM_DAYS = 7;

const DAY = 24 * 3600 * 1000;

function stepAfter(days: number, skip: number): number {
  const idx = LADDER.findIndex((d) => d > days);
  const target = (idx === -1 ? LADDER.length - 1 : idx) + skip;
  return LADDER[Math.min(target, LADDER.length - 1)];
}

export function nextState(prev: SrsState | null, outcome: SrsOutcome, rating: number | null, now: Date): SrsNext {
  if (prev?.stage === "dismissed" && outcome !== "known") return { stage: "dismissed", intervalDays: prev.intervalDays, dueAt: null };

  if (outcome === "wrong" || outcome === "gave_up") {
    return { stage: "fragile", intervalDays: 0, dueAt: new Date(now.getTime() + RETRY_MINUTES * 60_000) };
  }

  if (outcome === "known") {
    const days = Math.max(KNOWN_FIRST_CHECK_DAYS, prev ? stepAfter(prev.intervalDays, 0) : 0);
    return { stage: "mastered", intervalDays: days, dueAt: new Date(now.getTime() + days * DAY) };
  }

  // correct
  const days = stepAfter(prev?.intervalDays ?? 0, rating === 4 ? 1 : 0);
  const stage: Stage = days >= MASTERED_FROM_DAYS ? "mastered" : prev ? "fragile" : "seen";
  return { stage, intervalDays: days, dueAt: new Date(now.getTime() + days * DAY) };
}

/** «No me la preguntes más»: sale de la cola y no vuelve. */
export function dismissedState(prev: SrsState | null): SrsNext {
  return { stage: "dismissed", intervalDays: prev?.intervalDays ?? 0, dueAt: null };
}
