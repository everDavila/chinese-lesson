import "server-only";

import { createClient } from "./supabase/server";

// Resumen del avance del alumno, calculado al vuelo desde sus eventos (no hay
// agregados guardados: si cambia una fórmula se recalcula todo). RLS ya limita
// las filas a las del propio alumno.

export type HardWord = { senseId: string; hanzi: string; pinyin: string; meaningEs: string; attempts: number; wrong: number; mistakes: number };
export type StudentStats = {
  weekActiveMs: number;
  weekAttempts: number;
  wordsPracticed: number;
  /** Palabras cuyos dos últimos intentos fueron correctos. */
  wordsKnown: number;
  hard: HardWord[];
};

type Row = {
  sense_id: string;
  outcome: string;
  mistakes: number;
  at: string;
  senses: { pinyin: string; meaning_es: string | null; words: { hanzi: string } | { hanzi: string }[] | null } | { pinyin: string; meaning_es: string | null; words: unknown }[] | null;
};

const WEEK_MS = 7 * 24 * 3600 * 1000;

export async function getStudentStats(): Promise<StudentStats> {
  const supabase = await createClient();
  const since = new Date(Date.now() - WEEK_MS).toISOString();
  const [events, sessions] = await Promise.all([
    supabase
      .from("student_events")
      .select("sense_id, outcome, mistakes, at, senses(pinyin, meaning_es, words(hanzi))")
      .order("at", { ascending: false })
      .limit(2000),
    supabase.from("student_sessions").select("active_ms").gte("started_at", since),
  ]);
  const rows = (events.data ?? []) as unknown as Row[];

  const bySense = new Map<string, Row[]>();
  for (const r of rows) bySense.set(r.sense_id, [...(bySense.get(r.sense_id) ?? []), r]); // más reciente primero

  const hard: HardWord[] = [];
  let known = 0;
  for (const [senseId, list] of bySense) {
    const wrong = list.filter((r) => r.outcome === "wrong" || r.outcome === "gave_up").length;
    if (list.length >= 2 && list[0].outcome === "correct" && list[1].outcome === "correct") known += 1;
    // Cuesta si el último intento no fue correcto, o si falla más de la mitad.
    if (wrong > 0 && (list[0].outcome !== "correct" || wrong / list.length > 0.5)) {
      const sense = Array.isArray(list[0].senses) ? list[0].senses[0] : list[0].senses;
      const word = sense && (Array.isArray(sense.words) ? sense.words[0] : sense.words) as { hanzi: string } | undefined;
      hard.push({
        senseId,
        hanzi: word?.hanzi ?? "?",
        pinyin: sense?.pinyin ?? "",
        meaningEs: sense?.meaning_es ?? "",
        attempts: list.length,
        wrong,
        mistakes: list.reduce((a, r) => a + r.mistakes, 0),
      });
    }
  }
  hard.sort((a, b) => b.wrong / b.attempts - a.wrong / a.attempts || b.mistakes - a.mistakes);

  return {
    weekActiveMs: (sessions.data ?? []).reduce((a, s) => a + (s.active_ms as number), 0),
    weekAttempts: rows.filter((r) => r.at >= since).length,
    wordsPracticed: bySense.size,
    wordsKnown: known,
    hard: hard.slice(0, 5),
  };
}
