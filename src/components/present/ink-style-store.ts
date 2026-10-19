// Estilo del trazo en el anverso: liso (por defecto) o tinta china. Se
// recuerda en este dispositivo; store externo para useSyncExternalStore (en el
// servidor siempre es liso, sin desajustes de hidratación).
const KEY = "renshi:tinta";
const listeners = new Set<() => void>();
let cache: boolean | null = null;

function read(): boolean {
  if (cache !== null) return cache;
  try {
    cache = localStorage.getItem(KEY) === "1";
  } catch {
    cache = false;
  }
  return cache;
}

export const inkStyleStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: () => false,
  toggle() {
    cache = !read();
    try {
      localStorage.setItem(KEY, cache ? "1" : "0");
    } catch {}
    listeners.forEach((l) => l());
  },
};
