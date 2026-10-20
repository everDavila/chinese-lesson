// Selección de palabras del catálogo HSK, por sense_id. Sobrevive a cambiar de
// página, de nivel o recargar (sessionStorage: se borra al cerrar la pestaña)
// y se comparte entre niveles. Mismo patrón que advance-store: store externo
// para useSyncExternalStore, sin setState en efectos ni desajustes de
// hidratación (en el servidor siempre está vacía).

/** Lo mínimo para mostrar la selección sin volver a pedirla a la base. */
export type SelectedEntry = { senseId: string; hanzi: string; pinyin: string; level: number; order: number };

const KEY = "renshi:seleccion-catalogo";
const EMPTY: SelectedEntry[] = [];
const listeners = new Set<() => void>();
let cache: SelectedEntry[] | null = null;

function read(): SelectedEntry[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: SelectedEntry[]) {
  cache = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export const catalogSelection = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,
  /** Agrega las que falten (respeta el orden en que se eligieron). */
  add(entries: SelectedEntry[]) {
    const have = new Set(read().map((e) => e.senseId));
    const fresh = entries.filter((e) => !have.has(e.senseId));
    if (fresh.length) write([...read(), ...fresh]);
  },
  remove(senseIds: string[]) {
    const drop = new Set(senseIds);
    write(read().filter((e) => !drop.has(e.senseId)));
  },
  clear() {
    write([]);
  },
};
