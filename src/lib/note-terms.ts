const HAN_RUN = /\p{Script=Han}+/gu;
/** Palabras del catálogo de hasta 4 caracteres (como 一边吃饭 → 一边 · 吃饭). */
export const MAX_TERM = 4;

/**
 * Fragmentos chinos de notas redactadas en español o inglés, y todas sus
 * piezas de hasta MAX_TERM caracteres: una cita suele ser una frase
 * (我以为他来了) y se ayuda palabra por palabra.
 */
export function noteTermCandidates(texts: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const run of texts.flatMap((text) => text?.match(HAN_RUN) ?? [])) {
    out.add(run);
    for (let i = 0; i < run.length; i++)
      for (let len = 1; len <= MAX_TERM && i + len <= run.length; len++) out.add(run.slice(i, i + len));
  }
  return [...out];
}

/**
 * Parte un fragmento chino en piezas: de izquierda a derecha, la más larga que
 * sea término conocido; lo demás queda como texto, juntando lo consecutivo.
 */
export function segmentHan(run: string, isTerm: (piece: string) => boolean): { text: string; term: boolean }[] {
  if (isTerm(run)) return [{ text: run, term: true }];
  const out: { text: string; term: boolean }[] = [];
  let i = 0;
  while (i < run.length) {
    let len = Math.min(MAX_TERM, run.length - i);
    while (len > 0 && !isTerm(run.slice(i, i + len))) len--;
    if (len > 0) {
      out.push({ text: run.slice(i, i + len), term: true });
      i += len;
    } else {
      const last = out.at(-1);
      if (last && !last.term) last.text += run[i];
      else out.push({ text: run[i], term: false });
      i++;
    }
  }
  return out;
}
