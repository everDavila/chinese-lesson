// Qué hace la presentación al pasar de palabra: volver al anverso (para ver
// el trazo) o mantener la cara (para repasar significados). El valor por
// defecto depende del contexto —en una clase en vivo vuelve al anverso; en la
// clase de ejemplo o un enlace compartido, mantiene— y lo que elija la docente
// se recuerda en el dispositivo por separado para cada contexto, así cambiarlo
// al repasar no afecta la próxima clase. Store externo para
// useSyncExternalStore, como el de la tinta.
export type AdvanceContext = "class" | "review";
export type AdvanceMode = "front" | "keep";

const KEY: Record<AdvanceContext, string> = { class: "renshi:avanzar:clase", review: "renshi:avanzar:repaso" };
const DEFAULT: Record<AdvanceContext, AdvanceMode> = { class: "front", review: "keep" };
const listeners = new Set<() => void>();
const cache: Partial<Record<AdvanceContext, AdvanceMode>> = {};

function read(context: AdvanceContext): AdvanceMode {
  if (cache[context]) return cache[context]!;
  let value: AdvanceMode = DEFAULT[context];
  try {
    const stored = localStorage.getItem(KEY[context]);
    if (stored === "front" || stored === "keep") value = stored;
  } catch {}
  cache[context] = value;
  return value;
}

export const advanceStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  snapshot: (context: AdvanceContext) => () => read(context),
  serverSnapshot: (context: AdvanceContext) => () => DEFAULT[context],
  toggle(context: AdvanceContext) {
    const next: AdvanceMode = read(context) === "front" ? "keep" : "front";
    cache[context] = next;
    try {
      localStorage.setItem(KEY[context], next);
    } catch {}
    listeners.forEach((l) => l());
  },
};
