// Motor del modo «emparejar» (piloto /lab/emparejar). Puro: sin React ni base
// de datos. Una tanda son N palabras: el alumno coloca cada hanzi en el hueco
// de su pinyin y se corrige al enviar.

export type MatchWord = { hanzi: string; pinyin: string };

export type Rng = () => number;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pinyin sin tonos ni espacios: dos palabras que lo comparten suenan casi igual. */
export function toneless(pinyin: string): string {
  return pinyin.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ü/gi, "u").replace(/[\s'’·-]/g, "").toLowerCase();
}

/**
 * Elige `n` palabras para una tanda sin ambigüedad: nunca dos con el mismo
 * pinyin exacto (los homófonos no se pueden distinguir) ni el mismo hanzi.
 * También evita dos con el mismo pinyin sin tonos, que se confunden de oído.
 */
export function pickBatch(pool: readonly MatchWord[], n: number, rng: Rng): MatchWord[] {
  const out: MatchWord[] = [];
  const hanzi = new Set<string>();
  const sounds = new Set<string>();
  for (const w of shuffle(pool, rng)) {
    if (out.length === n) break;
    const sound = toneless(w.pinyin);
    if (hanzi.has(w.hanzi) || sounds.has(sound)) continue;
    hanzi.add(w.hanzi);
    sounds.add(sound);
    out.push(w);
  }
  return out;
}

/** Fichas del banco: los hanzi de la tanda, en otro orden que los huecos. */
export function bankOrder(batch: readonly MatchWord[], rng: Rng): string[] {
  const hanzi = batch.map((w) => w.hanzi);
  if (hanzi.length < 2) return hanzi;
  // Que no queden en el mismo orden que los huecos (sería regalar la respuesta).
  for (let tries = 0; tries < 10; tries++) {
    const s = shuffle(hanzi, rng);
    if (s.some((h, i) => h !== hanzi[i])) return s;
  }
  return [...hanzi].reverse();
}

export type Grade = { correct: boolean[]; hits: number; complete: boolean };

/** `slots[i]` es el hanzi colocado en el hueco de `batch[i]` (o null). */
export function grade(batch: readonly MatchWord[], slots: readonly (string | null)[]): Grade {
  const correct = batch.map((w, i) => slots[i] === w.hanzi);
  return { correct, hits: correct.filter(Boolean).length, complete: slots.length === batch.length && slots.every((s) => s !== null) };
}

/** Coloca una ficha en un hueco. Si el hueco ya tenía otra, vuelve al banco; si la ficha estaba en otro hueco, lo deja libre. */
export function place(slots: readonly (string | null)[], hanzi: string, slot: number): (string | null)[] {
  const next = slots.map((s) => (s === hanzi ? null : s));
  next[slot] = hanzi;
  return next;
}

/** Fichas que aún no están en ningún hueco, en el orden del banco. */
export function remaining(bank: readonly string[], slots: readonly (string | null)[]): string[] {
  const used = new Set(slots.filter((s): s is string => s !== null));
  return bank.filter((h) => !used.has(h));
}
