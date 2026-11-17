// Motor del quiz mixto (piloto /lab/quiz). Puro: sin React ni base de datos,
// para poder probarlo y reutilizarlo después en el modo en vivo.
//
// Una pregunta es un objeto con `kind`; una ronda es una lista mezclada de
// esas preguntas. La interfaz decide su aspecto según `kind`.

export type QuizWord = {
  hanzi: string;
  pinyin: string;
  /** Significado corto en español (ya recortado). */
  es: string;
  /** Categoría gramatical principal (名, 动, 形…), para elegir distractores. */
  pos: string;
};

export type ChooseQuestion = {
  kind: "choose";
  /** hanzi→español o español→hanzi. */
  direction: "hanzi-es" | "es-hanzi";
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

function makeChoose(word: QuizWord, pool: readonly QuizWord[], rng: Rng): ChooseQuestion {
  const direction = rng() < 0.7 ? "hanzi-es" : "es-hanzi";
  const wrong = distractors(word, pool, 3, rng);
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
): QuizQuestion[] {
  const chosen = shuffle(from, rng).slice(0, total);
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
