// Rotación de frases entre clases (sin dependencias: se prueba con node --test).
//
// Una palabra se repasa en varias clases; si siempre salen las mismas frases,
// el alumno memoriza la frase y no la palabra. Al abrir una clase se eligen
// las frases de cada sentido: primero las que esa clase nunca vio, en el
// orden de enseñanza; después las ya vistas, empezando por la que hace más
// tiempo que salió. La elección se guarda con la sesión y no cambia durante
// la clase. La frase maestra (estrella del admin) sale siempre, la primera, y
// cuenta dentro del número de frases: las demás rotan a su alrededor.

export type Candidate = { key: string; master?: boolean };

/**
 * @param candidates frases disponibles, en orden de enseñanza
 * @param lastSeen   clave → cuándo salió por última vez (ms); ausente = nunca
 * @param count      cuántas mostrar; null = todas
 */
export function pickSentences<T extends Candidate>(
  candidates: T[],
  lastSeen: Map<string, number>,
  count: number | null,
): T[] {
  const n = count === null ? candidates.length : Math.max(1, count);
  const master = candidates.find((c) => c.master);
  const rest = candidates.filter((c) => c !== master);
  const slots = master ? n - 1 : n;
  let chosen = rest;
  if (rest.length > slots) {
    const unseen = rest.filter((c) => !lastSeen.has(c.key));
    const seen = rest
      .filter((c) => lastSeen.has(c.key))
      .sort((a, b) => lastSeen.get(a.key)! - lastSeen.get(b.key)!);
    const keys = new Set([...unseen, ...seen].slice(0, slots).map((c) => c.key));
    // Se presentan en el orden de enseñanza, no en el de elección.
    chosen = rest.filter((c) => keys.has(c.key));
  }
  return master ? [master, ...chosen] : chosen;
}
