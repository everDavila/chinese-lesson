// Rotación de frases entre clases (sin dependencias: se prueba con node --test).
//
// Una palabra se repasa en varias clases; si siempre salen las mismas frases,
// el alumno memoriza la frase y no la palabra. Al abrir una clase se eligen
// las frases de cada sentido: primero las que esa clase nunca vio, en el
// orden de enseñanza; después las ya vistas, empezando por la que hace más
// tiempo que salió. La elección se guarda con la sesión y no cambia durante
// la clase.

export type Candidate = { key: string };

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
  if (candidates.length <= n) return candidates;
  const unseen = candidates.filter((c) => !lastSeen.has(c.key));
  const seen = candidates
    .filter((c) => lastSeen.has(c.key))
    .sort((a, b) => lastSeen.get(a.key)! - lastSeen.get(b.key)!);
  const chosen = new Set([...unseen, ...seen].slice(0, n).map((c) => c.key));
  // Se presentan en el orden de enseñanza, no en el de elección.
  return candidates.filter((c) => chosen.has(c.key));
}
