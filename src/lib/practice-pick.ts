// Qué palabras de una fuente (nivel HSK o tema) entran en una práctica de N.
// Función pura: primero lo que toca repasar (vencidas, las más atrasadas
// primero), luego las nuevas en el orden de la fuente. Lo ya programado para
// más adelante y lo descartado no entra.
export type PickState = { stage: string; dueAt: string | null };

export function pickForPractice(candidates: string[], states: Map<string, PickState>, n: number, now: Date): string[] {
  const nowIso = now.toISOString();
  const overdue: { id: string; dueAt: string }[] = [];
  const fresh: string[] = [];
  const seen = new Set<string>();
  for (const id of candidates) {
    if (seen.has(id)) continue;
    seen.add(id);
    const s = states.get(id);
    if (!s) fresh.push(id);
    else if (s.stage !== "dismissed" && s.dueAt && s.dueAt <= nowIso) overdue.push({ id, dueAt: s.dueAt });
  }
  overdue.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return [...overdue.map((o) => o.id), ...fresh].slice(0, n);
}

export const PRACTICE_AMOUNTS = [10, 20, 40] as const;
export const DEFAULT_AMOUNT = 20;

export type PracticeSource = { kind: "hsk"; level: number } | { kind: "theme"; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** «hsk-3» o «tema-<uuid>» → fuente; null si no es válida. */
export function parseSource(value: string | undefined): PracticeSource | null {
  if (!value) return null;
  const hsk = /^hsk-([1-7])$/.exec(value);
  if (hsk) return { kind: "hsk", level: Number(hsk[1]) };
  const theme = /^tema-(.+)$/.exec(value);
  if (theme && UUID.test(theme[1])) return { kind: "theme", id: theme[1] };
  return null;
}

export function parseAmount(value: string | undefined): number {
  const n = Number(value);
  return (PRACTICE_AMOUNTS as readonly number[]).includes(n) ? n : DEFAULT_AMOUNT;
}

export type ThemeGroup = "situations" | "topics" | "wordTypes" | "functions" | "other";

/**
 * Agrupa una plantilla del sistema por su nota de origen (aún no hay una
 * columna de tipo). null: las plantillas del temario oficial por nivel, que
 * duplican los niveles HSK y no van entre los temas.
 */
export function themeGroup(sourceNote: string | null): ThemeGroup | null {
  const note = sourceNote ?? "";
  if (/^Temario oficial/i.test(note)) return null;
  if (/por contexto/i.test(note)) return "situations";
  if (/por funci[oó]n/i.test(note)) return "functions";
  if (/por tema/i.test(note)) return "topics";
  if (/categor[ií]a|Lista manual sobre el temario/i.test(note)) return "wordTypes";
  return "other";
}

export type Exercise = "card" | "write";

/** «tarjeta» (estudiar, por defecto) o «escribir». */
export function parseExercise(value: string | undefined): Exercise {
  return value === "escribir" ? "write" : "card";
}

/** Habilidad que entrena cada ejercicio: la tarjeta reconoce, escribir escribe. */
export const skillOf = (exercise: Exercise) => (exercise === "card" ? "recognize" : "write") as "recognize" | "write";
