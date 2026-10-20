// En qué idioma empiezan las frases del reverso: en chino (por defecto; se
// revela la traducción en español e inglés) o en español / inglés (la clase
// intenta decirla en chino y se revela). Se recuerda en el dispositivo; store
// externo para useSyncExternalStore, como el de la tinta.
export type SentenceMode = "zh" | "es" | "en";
export const SENTENCE_MODES: SentenceMode[] = ["zh", "es", "en"];

const KEY = "renshi:frases";
const listeners = new Set<() => void>();
let cache: SentenceMode | null = null;

function read(): SentenceMode {
  if (cache) return cache;
  let value: SentenceMode = "zh";
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "zh" || stored === "es" || stored === "en") value = stored;
  } catch {}
  cache = value;
  return value;
}

export const sentenceModeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: read,
  getServerSnapshot: (): SentenceMode => "zh",
  set(mode: SentenceMode) {
    cache = mode;
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
    listeners.forEach((l) => l());
  },
  next() {
    const i = SENTENCE_MODES.indexOf(read());
    sentenceModeStore.set(SENTENCE_MODES[(i + 1) % SENTENCE_MODES.length]);
  },
};
