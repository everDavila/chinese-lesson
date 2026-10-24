// Preferencias y avance del alumno, solo en este dispositivo (localStorage):
// sin cuenta y sin base. El registro de avance ya tiene la forma de una fila
// futura (sentido, valoración, errores, modo, fecha) para subirlo tal cual si
// algún día hay cuentas. Stores externos para useSyncExternalStore, como el de
// la tinta.
export type Rating = 1 | 2 | 3 | 4;
export type WritingMode = "guide" | "free";

export type PracticeRecord = {
  rating: Rating;
  mistakes: number;
  mode: WritingMode;
  /** Pulsó «No me sale»: se le mostró la respuesta. */
  gaveUp: boolean;
  at: string;
};

export type Prefs = {
  /** Cómo practica: con contorno, de memoria, o sorteado por palabra. */
  mode: WritingMode | "random";
  /** Al valorar: girar a la ficha, o solo practicar (sin valorar ni girar). */
  after: "detail" | "practice";
};

function createStore<T>(key: string, fallback: T, valid: (value: unknown) => value is T) {
  const listeners = new Set<() => void>();
  let cache: T | null = null;
  const read = (): T => {
    if (cache) return cache;
    let value = fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (valid(parsed)) value = parsed;
      }
    } catch {}
    cache = value;
    return value;
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: read,
    serverSnapshot: () => fallback,
    set(next: T) {
      cache = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      listeners.forEach((l) => l());
    },
  };
}

const DEFAULT_PREFS: Prefs = { mode: "guide", after: "detail" };
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export const prefsStore = createStore<Prefs>(
  "renshi:alumno:preferencias",
  DEFAULT_PREFS,
  (v): v is Prefs =>
    isObject(v) && ["guide", "free", "random"].includes(v.mode as string) && ["detail", "practice"].includes(v.after as string),
);

const NO_PROGRESS: Record<string, PracticeRecord> = {};

const progressBase = createStore<Record<string, PracticeRecord>>("renshi:alumno:avance:v1", NO_PROGRESS, isObject as (v: unknown) => v is Record<string, PracticeRecord>);

export const progressStore = {
  subscribe: progressBase.subscribe,
  snapshot: progressBase.snapshot,
  serverSnapshot: progressBase.serverSnapshot,
  save(senseKey: string, record: PracticeRecord) {
    progressBase.set({ ...progressBase.snapshot(), [senseKey]: record });
  },
};

/** Valoración sugerida según los errores por carácter (el alumno puede cambiarla). */
export function suggestRating(mistakes: number, chars: number, gaveUp: boolean): Rating {
  if (gaveUp) return 1;
  const perChar = mistakes / Math.max(chars, 1);
  if (perChar === 0) return 4;
  if (perChar <= 2) return 3;
  if (perChar <= 5) return 2;
  return 1;
}
