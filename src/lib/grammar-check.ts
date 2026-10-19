// Revisión mínima de una frase escrita por el alumno en /lab/gramatica.
// No corrige chino: compara con respuestas modelo y busca piezas del patrón.
// Que una frase no coincida no la hace incorrecta; por eso el resultado
// intermedio es «usa la estructura», no «está mal».

export type GrammarPrompt = {
  es: string;
  hint: string;
  answers: string[];
  /** Piezas en orden; una lista interna es «cualquiera de estas». */
  uses: (string | string[])[];
  avoid?: { text: string; why: string }[];
};

export type CheckResult =
  | { kind: "empty" }
  | { kind: "not-hanzi" }
  | { kind: "match" }
  | { kind: "avoid"; why: string }
  | { kind: "pattern" }
  | { kind: "missing"; piece: string };

/** Quita espacios y puntuación (ancha y estrecha) para comparar solo los caracteres. */
export function normalize(text: string): string {
  return text.replace(/[\s\p{P}]/gu, "");
}

export function checkSentence(input: string, prompt: GrammarPrompt): CheckResult {
  const text = normalize(input);
  if (!text) return { kind: "empty" };
  if (!/\p{Script=Han}/u.test(text)) return { kind: "not-hanzi" };
  if (prompt.answers.some((a) => normalize(a) === text)) return { kind: "match" };
  const mistake = prompt.avoid?.find((a) => text.includes(a.text));
  if (mistake) return { kind: "avoid", why: mistake.why };
  let from = 0;
  for (const piece of prompt.uses) {
    const options = typeof piece === "string" ? [piece] : piece;
    const hits = options.map((o) => text.indexOf(o, from)).filter((i) => i >= 0);
    if (!hits.length) return { kind: "missing", piece: options.join(" / ") };
    from = Math.min(...hits) + 1;
  }
  return { kind: "pattern" };
}
