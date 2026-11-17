// Motor del quiz mixto (piloto /lab/quiz). Puro: sin React ni base de datos,
// para poder probarlo y reutilizarlo después en el modo en vivo.
//
// Una pregunta es un objeto con `kind`; una ronda es una lista mezclada de
// esas preguntas. La interfaz decide su aspecto según `kind`.

import { pinyinSegments, splitPinyin, toneless, withTone } from "./pinyin.ts";

/** Frase de ejemplo de una palabra (la elige quiz-data.ts). */
export type QuizExample = { zh: string; pinyin: string; es: string };

/** Qué se practica: leer (reconocer), tonos o el oído. */
export type QuizMode = "reconocer" | "tonos" | "escuchar";

export type QuizWord = {
  hanzi: string;
  pinyin: string;
  /** Significado corto en español (ya recortado). */
  es: string;
  /** Categoría gramatical principal (名, 动, 形…), para elegir distractores. */
  pos: string;
  /** Nivel HSK (1–3) de la palabra. */
  level?: number;
  /** Frase corta con la palabra, para el reverso. */
  example?: QuizExample;
};

export type ChooseQuestion = {
  kind: "choose";
  /** hanzi→español, español→hanzi, hanzi→pinyin con tonos o audio→hanzi. */
  direction: "hanzi-es" | "es-hanzi" | "tone" | "listen";
  word: QuizWord;
  /** Cuatro opciones, ya mezcladas; `correct` es el índice de la buena. */
  options: string[];
  correct: number;
};

export type TrueFalseQuestion = {
  kind: "truefalse";
  word: QuizWord;
  /** Significado que se afirma: el real o el de otra palabra. */
  claim: string;
  /** Si la afirmación es verdadera. */
  truth: boolean;
};

export type QuizQuestion = ChooseQuestion | TrueFalseQuestion;

/** Segundos y puntos máximos por tipo: acertar V/F al azar es más fácil. */
export const RULES = {
  choose: { seconds: 20, maxPoints: 1000 },
  truefalse: { seconds: 12, maxPoints: 600 },
} as const;

export type Rng = () => number;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Distractores: misma categoría gramatical primero, y nunca el mismo
 *  significado ni el mismo hanzi. Si faltan, completa con cualquier otra. */
function distractors(word: QuizWord, pool: readonly QuizWord[], n: number, rng: Rng): QuizWord[] {
  const valid = pool.filter((w) => w.hanzi !== word.hanzi && w.es !== word.es);
  const same = shuffle(valid.filter((w) => w.pos === word.pos), rng);
  const rest = shuffle(valid.filter((w) => w.pos !== word.pos), rng);
  const out: QuizWord[] = [];
  const seen = new Set<string>();
  for (const w of [...same, ...rest]) {
    if (out.length === n) break;
    if (seen.has(w.es) || seen.has(w.hanzi)) continue;
    seen.add(w.es);
    seen.add(w.hanzi);
    out.push(w);
  }
  return out;
}

/** Hanzi que se parecen a `word`: mismo sonido sin tono (3), un carácter en
 *  común (2), misma categoría (1). Con `soundsDifferent`, nunca el mismo
 *  pinyin exacto (sonaría idéntico y no habría respuesta justa de oído). */
export function similarWords(
  word: QuizWord,
  pool: readonly QuizWord[],
  n: number,
  rng: Rng,
  soundsDifferent = false,
): QuizWord[] {
  const soundOf = (p: string) => splitPinyin(p).map(toneless).join("");
  const sound = soundOf(word.pinyin);
  const chars = new Set([...word.hanzi]);
  const scored = shuffle(
    pool.filter((w) => w.hanzi !== word.hanzi && !(soundsDifferent && w.pinyin === word.pinyin)),
    rng,
  ).map((w) => ({
    w,
    score: (soundOf(w.pinyin) === sound ? 3 : 0) + ([...w.hanzi].some((c) => chars.has(c)) ? 2 : 0) + (w.pos === word.pos ? 1 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((x) => x.w);
}

/** Pinyin con otro tono en una sílaba (los distractores de «tonos»). Devuelve
 *  tres variantes distintas de la correcta, o null si no se pueden formar. */
export function toneVariants(pinyin: string, rng: Rng): string[] | null {
  const segs = pinyinSegments(pinyin);
  const plain = segs.every((s) => s.tone !== null || /^[\s'’]+$/.test(s.text));
  if (segs.length === 0 || !plain) return null;
  const candidates: string[] = [];
  segs.forEach((seg, i) => {
    if (seg.tone === null) return;
    for (const t of [1, 2, 3, 4] as const) {
      if (t === seg.tone) continue;
      candidates.push(segs.map((s, j) => (j === i ? withTone(s.text, t) : s.text)).join(""));
    }
  });
  const unique = [...new Set(candidates)].filter((c) => c !== pinyin);
  return unique.length >= 3 ? shuffle(unique, rng).slice(0, 3) : null;
}

function makeTone(word: QuizWord, pool: readonly QuizWord[], rng: Rng): ChooseQuestion {
  const wrong = toneVariants(word.pinyin, rng);
  if (!wrong) return makeChoose(word, pool, rng);
  const options = shuffle([word.pinyin, ...wrong], rng);
  return { kind: "choose", direction: "tone", word, options, correct: options.indexOf(word.pinyin) };
}

function makeListen(word: QuizWord, pool: readonly QuizWord[], rng: Rng): ChooseQuestion {
  const wrong = similarWords(word, pool, 3, rng, true);
  const options = shuffle([word, ...wrong].map((w) => w.hanzi), rng);
  return { kind: "choose", direction: "listen", word, options, correct: options.indexOf(word.hanzi) };
}

function makeChoose(word: QuizWord, pool: readonly QuizWord[], rng: Rng): ChooseQuestion {
  const direction = rng() < 0.7 ? "hanzi-es" : "es-hanzi";
  const wrong = direction === "es-hanzi" ? similarWords(word, pool, 3, rng) : distractors(word, pool, 3, rng);
  const pick = (w: QuizWord) => (direction === "hanzi-es" ? w.es : w.hanzi);
  const options = shuffle([word, ...wrong].map(pick), rng);
  return { kind: "choose", direction, word, options, correct: options.indexOf(pick(word)) };
}

function makeTrueFalse(word: QuizWord, pool: readonly QuizWord[], rng: Rng): TrueFalseQuestion {
  const truth = rng() < 0.5;
  if (truth) return { kind: "truefalse", word, claim: word.es, truth };
  const [other] = distractors(word, pool, 1, rng);
  return { kind: "truefalse", word, claim: other.es, truth: false };
}

/** Reparte los tipos: sin tres seguidos del mismo (con 6/4 no se puede evitar
 *  que haya dos seguidos, pero sí que se note un patrón). */
export function pickKinds(total: number, rng: Rng): ("choose" | "truefalse")[] {
  const tf = Math.round(total * 0.4);
  for (let attempt = 0; attempt < 200; attempt++) {
    const kinds = shuffle<"choose" | "truefalse">(
      [...Array(total - tf).fill("choose"), ...Array(tf).fill("truefalse")],
      rng,
    );
    const runOfThree = kinds.some((k, i) => i >= 2 && kinds[i - 1] === k && kinds[i - 2] === k);
    if (!runOfThree) return kinds;
  }
  return Array.from({ length: total }, (_, i) => (i % 5 === 1 || i % 5 === 3 ? "truefalse" : "choose"));
}

/** Arma una ronda con `total` palabras distintas de `words`. `from` limita
 *  qué palabras se preguntan (p. ej. solo las falladas); los distractores
 *  salen siempre de `pool`. */
export function buildRound(
  pool: readonly QuizWord[],
  total = 10,
  rng: Rng = Math.random,
  from: readonly QuizWord[] = pool,
  mode: QuizMode = "reconocer",
): QuizQuestion[] {
  const base = mode === "tonos" ? from.filter((w) => toneVariants(w.pinyin, () => 0) !== null) : from;
  const chosen = shuffle(base, rng).slice(0, total);
  if (mode === "tonos") return chosen.map((w) => makeTone(w, pool, rng));
  if (mode === "escuchar") return chosen.map((w) => makeListen(w, pool, rng));
  const kinds = pickKinds(chosen.length, rng);
  return chosen.map((w, i) => (kinds[i] === "choose" ? makeChoose(w, pool, rng) : makeTrueFalse(w, pool, rng)));
}

/** Puntos por acertar, como Kahoot: entre la mitad y el máximo según lo
 *  rápido que respondes. Fallar o agotar el tiempo vale 0. */
export function score(kind: QuizQuestion["kind"], secondsLeft: number): number {
  const { seconds, maxPoints } = RULES[kind];
  const left = Math.min(Math.max(secondsLeft, 0), seconds);
  return Math.round(maxPoints * (0.5 + 0.5 * (left / seconds)));
}

/** Recorta un significado largo («amar; gustar mucho») a su primera parte. */
export function shortMeaning(meaning: string): string {
  return meaning.split(/[;；]/)[0].trim();
}
