import type { Rating } from "./group-rating";

// Valoraciones de la profesora guardadas en el navegador mientras no hay
// sesiones en Supabase (la fase 1 las llevará a la tabla teacher_ratings).
// Store externo para useSyncExternalStore: sin setState en efectos y sin
// desajustes de hidratación (en el servidor siempre está vacío).
const KEY = "hanzi:demo-ratings";
const EMPTY: Record<string, Rating> = {};
const listeners = new Set<() => void>();
let cache: Record<string, Rating> | null = null;

function read(): Record<string, Rating> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

export const ratingsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,
  set(key: string, rating: Rating | undefined) {
    const next = { ...read() };
    if (rating) next[key] = rating;
    else delete next[key];
    cache = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    listeners.forEach((l) => l());
  },
};
