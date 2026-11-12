import "server-only";

import { createClient } from "./supabase/server";
import type { Skill } from "@/actions/student";
import { getStars } from "./student-progress";

// Resumen del avance del alumno, calculado al vuelo desde sus eventos (no hay
// agregados guardados: si cambia una fórmula se recalcula todo). RLS ya limita
// las filas a las del propio alumno.

export type HardWord = { senseId: string; hanzi: string; pinyin: string; meaningEs: string; attempts: number; wrong: number; mistakes: number; stars: 0 | 1 | 2 | 3 };
export type StudentStats = {
  weekActiveMs: number;
  weekAttempts: number;
  wordsPracticed: number;
  /** Palabras cuyos dos últimos intentos fueron correctos. */
  wordsKnown: number;
  hard: HardWord[];
  /** Cuántas palabras difíciles hay en total (la lista muestra solo las primeras). */
  hardCount: number;
  /** Todas las palabras difíciles, de la más a la menos difícil: alimentan el repaso de «leeches». */
  hardIds: string[];
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
        stars: 0,
      });
    }
  }
  hard.sort((a, b) => b.wrong / b.attempts - a.wrong / a.attempts || b.mistakes - a.mistakes);

  const top = hard.slice(0, 5);
  const stars = await getStars(top.map((h) => h.senseId));
  for (const h of top) h.stars = stars.get(h.senseId) ?? 0;

  return {
    weekActiveMs: (sessions.data ?? []).reduce((a, s) => a + (s.active_ms as number), 0),
    weekAttempts: rows.filter((r) => r.at >= since).length,
    wordsPracticed: bySense.size,
    wordsKnown: known,
    hard: top,
    hardCount: hard.length,
    hardIds: hard.map((h) => h.senseId),
  };
}

// ── Cola de repaso ──────────────────────────────────────────────────────
export type DueWord = { senseId: string; hanzi: string; pinyin: string; meaningEs: string; dueAt: string; fragile: boolean };

/** Palabras que toca repasar ya: vencidas y no descartadas, las más atrasadas primero. */
export async function getDueWords(skill: Skill, limit = 30): Promise<DueWord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_word_state")
    .select("sense_id, stage, due_at, senses(pinyin, meaning_es, words(hanzi))")
    .eq("skill", skill)
    .neq("stage", "dismissed")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(limit);
  return ((data ?? []) as unknown as {
    sense_id: string;
    stage: string;
    due_at: string;
    senses: { pinyin: string; meaning_es: string | null; words: { hanzi: string } | { hanzi: string }[] | null } | null;
  }[]).map((r) => {
    const word = r.senses && (Array.isArray(r.senses.words) ? r.senses.words[0] : r.senses.words);
    return {
      senseId: r.sense_id,
      hanzi: word?.hanzi ?? "?",
      pinyin: r.senses?.pinyin ?? "",
      meaningEs: r.senses?.meaning_es ?? "",
      dueAt: r.due_at,
      fragile: r.stage === "fragile",
    };
  });
}
