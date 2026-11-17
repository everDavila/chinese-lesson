// Elige la frase de ejemplo que se muestra al revelar una respuesta. Pura.
// Regla: corta a media (3–14 caracteres chinos) y hecha solo con caracteres del
// nivel de la palabra o más fáciles; entre las que cumplen, la más corta, y a
// igual largo las de datos abiertos antes que las generadas por IA.

import type { QuizExample } from "./quiz.ts";

export type RawSentence = { zh: string; pinyin: string; es: string; origin?: string };

export const MIN_CHARS = 3;
export const MAX_CHARS = 14;

const isHan = (c: string) => /\p{Script=Han}/u.test(c);

/** `levelOf(ch)`: nivel HSK en que aparece el carácter (Infinity si no está). */
export function pickExample(
  sentences: readonly RawSentence[],
  level: number,
  levelOf: (ch: string) => number,
): QuizExample | null {
  const ok = sentences.filter((s) => {
    const han = [...s.zh].filter(isHan);
    return han.length >= MIN_CHARS && han.length <= MAX_CHARS && han.every((c) => levelOf(c) <= level) && !!s.es;
  });
  if (ok.length === 0) return null;
  const rank = (s: RawSentence) => [...s.zh].filter(isHan).length * 2 + (s.origin === "ai" ? 1 : 0);
  const best = [...ok].sort((a, b) => rank(a) - rank(b))[0];
  return { zh: best.zh, pinyin: best.pinyin, es: best.es };
}
