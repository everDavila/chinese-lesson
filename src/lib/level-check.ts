// Comprueba si una frase usa vocabulario por encima de un nivel HSK. Misma
// lógica que scripts/validate-content.mjs: busca la división de la frase en
// palabras de la lista HSK que minimiza el nivel máximo (lectura favorable),
// así que si aun así se pasa, el problema es real.

export type Levels = Record<string, { o?: number; n?: number }>;

export function makeLevelChecker(levels: Levels, version: "o" | "n" = "o") {
  const maxLen = Math.max(...Object.keys(levels).map((w) => w.length));
  const charLevel = new Map<string, number>([["儿", 1]]);
  for (const [w, l] of Object.entries(levels)) {
    const v = l[version];
    if (!v) continue;
    for (const ch of w) if (!charLevel.has(ch) || charLevel.get(ch)! > v) charLevel.set(ch, v);
  }
  const pieceLevel = (p: string) =>
    levels[p]?.[version] ?? (p.length === 1 ? (charLevel.get(p) ?? Infinity) : undefined);

  function split(text: string, target: string) {
    const dp: ({ cost: number; prev: number; piece: string; lvl: number } | undefined)[] = [
      { cost: 0, prev: 0, piece: "", lvl: 0 },
    ];
    for (let i = 1; i <= text.length; i++) {
      for (let len = 1; len <= Math.min(maxLen, i); len++) {
        const piece = text.slice(i - len, i);
        const lvl = piece === target ? 0 : pieceLevel(piece);
        const before = dp[i - len];
        if (lvl === undefined || !before) continue;
        const cost = Math.max(before.cost, lvl);
        if (!dp[i] || cost < dp[i]!.cost) dp[i] = { cost, prev: i - len, piece, lvl };
      }
    }
    const pieces: { piece: string; lvl: number }[] = [];
    for (let i = text.length; i > 0; i = dp[i]!.prev) pieces.unshift(dp[i]!);
    return pieces;
  }

  /** Piezas de la frase que superan el nivel (vacío si la frase cumple). */
  return function check(sentence: string, keyword: string, maxLevel: number) {
    const over: { piece: string; level: number | null }[] = [];
    for (const run of sentence.match(/\p{Script=Han}+/gu) ?? []) {
      for (const p of split(run, keyword)) {
        if (p.lvl > maxLevel) over.push({ piece: p.piece, level: Number.isFinite(p.lvl) ? p.lvl : null });
      }
    }
    return over;
  };
}
