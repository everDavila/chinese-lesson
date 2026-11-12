import "server-only";

import type { Skill } from "@/actions/student";
import { masteryStars, type Stage } from "./srs";
import { createClient } from "./supabase/server";
import { computeStreak, dayKey, lastDays } from "./student-time";

// Datos del panel del alumno: progreso por nivel HSK, rastreador, racha, meta
// diaria y favoritas. Todo se calcula al vuelo; RLS limita a las filas propias.

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Trae todas las filas de una consulta paginando de 1000 en 1000 (tope de PostgREST). */
async function pageAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await build(from, from + 999);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

export type WordStatus = "none" | "progress" | "mastered" | "dismissed";

/** Una palabra, varias habilidades: descartada si alguna lo está; dominada solo si todas lo están. */
export function combineStatus(stages: Stage[]): WordStatus {
  if (!stages.length) return "none";
  if (stages.includes("dismissed")) return "dismissed";
  return stages.every((s) => s === "mastered") ? "mastered" : "progress";
}

export const LEVELS = [1, 2, 3, 4, 5, 6, 7] as const; // 7 = banda avanzada 7–9

// ── Progreso por nivel ──────────────────────────────────────────────────
export type LevelProgress = { level: number; total: number; mastered: number; inProgress: number; dismissed: number };

type StateWithLevel = { sense_id: string; stage: Stage; senses: { word_levels: { level: number; standard: string }[] } | null };

export async function getLevelProgress(skill: Skill): Promise<LevelProgress[]> {
  const supabase = await createClient();
  const [totals, states] = await Promise.all([
    Promise.all(
      LEVELS.map((level) =>
        supabase.from("word_levels").select("id", { count: "exact", head: true }).eq("standard", "hsk-3.0").eq("level", level),
      ),
    ),
    pageAll<StateWithLevel>((from, to) =>
      supabase
        .from("student_word_state")
        .select("sense_id, stage, senses(word_levels(level, standard))")
        .eq("skill", skill)
        .range(from, to) as unknown as PromiseLike<{ data: StateWithLevel[] | null }>,
    ),
  ]);

  const stagesBySense = new Map<string, Stage[]>();
  const levelOf = new Map<string, number>();
  for (const r of states) {
    stagesBySense.set(r.sense_id, [...(stagesBySense.get(r.sense_id) ?? []), r.stage]);
    const wl = r.senses?.word_levels?.find((w) => w.standard === "hsk-3.0");
    if (wl) levelOf.set(r.sense_id, wl.level);
  }

  const result: LevelProgress[] = LEVELS.map((level, i) => ({
    level,
    total: totals[i].count ?? 0,
    mastered: 0,
    inProgress: 0,
    dismissed: 0,
  }));
  for (const [senseId, stages] of stagesBySense) {
    const row = result.find((r) => r.level === levelOf.get(senseId));
    if (!row) continue;
    const status = combineStatus(stages);
    if (status === "mastered") row.mastered += 1;
    else if (status === "progress") row.inProgress += 1;
    else if (status === "dismissed") row.dismissed += 1;
  }
  return result;
}

// ── Rastreador de un nivel ──────────────────────────────────────────────
export type TrackedWord = { senseId: string; hanzi: string; status: WordStatus };

export async function getLevelWords(level: number, skill: Skill): Promise<TrackedWord[]> {
  const supabase = await createClient();
  const [words, states] = await Promise.all([
    pageAll<{ sense_id: string | null; words: { hanzi: string } | { hanzi: string }[] | null }>((from, to) =>
      supabase
        .from("word_levels")
        .select("sense_id, words(hanzi)")
        .eq("standard", "hsk-3.0")
        .eq("level", level)
        .order("source_order", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: { sense_id: string | null; words: { hanzi: string } | { hanzi: string }[] | null }[] | null }>,
    ),
    pageAll<{ sense_id: string; stage: Stage }>((from, to) =>
      supabase.from("student_word_state").select("sense_id, stage").eq("skill", skill).range(from, to) as unknown as PromiseLike<{ data: { sense_id: string; stage: Stage }[] | null }>,
    ),
  ]);
  const stages = new Map<string, Stage[]>();
  for (const s of states) stages.set(s.sense_id, [...(stages.get(s.sense_id) ?? []), s.stage]);
  return words
    .filter((w): w is typeof w & { sense_id: string } => !!w.sense_id)
    .map((w) => {
      const word = Array.isArray(w.words) ? w.words[0] : w.words;
      return { senseId: w.sense_id, hanzi: word?.hanzi ?? "?", status: combineStatus(stages.get(w.sense_id) ?? []) };
    });
}

// ── Racha y meta diaria ─────────────────────────────────────────────────
export type Streak = {
  current: number;
  best: number;
  week: { day: string; done: boolean; today: boolean }[];
  todayMs: number;
  goalMinutes: number;
};

export const DEFAULT_GOAL_MINUTES = 10;
export const GOAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export async function getStreak(): Promise<Streak> {
  const supabase = await createClient();
  const [sessions, settings] = await Promise.all([
    supabase.from("student_sessions").select("started_at, active_ms").order("started_at", { ascending: false }).limit(1000),
    supabase.from("student_settings").select("daily_goal_minutes").maybeSingle(),
  ]);
  const today = dayKey(Date.now());
  const days = new Set<string>();
  let todayMs = 0;
  for (const s of (sessions.data ?? []) as { started_at: string; active_ms: number }[]) {
    if (s.active_ms <= 0) continue;
    const key = dayKey(s.started_at);
    days.add(key);
    if (key === today) todayMs += s.active_ms;
  }
  const { current, best } = computeStreak(days, today);
  return {
    current,
    best,
    week: lastDays(today, 7).map((day) => ({ day, done: days.has(day), today: day === today })),
    todayMs,
    goalMinutes: (settings.data?.daily_goal_minutes as number | undefined) ?? DEFAULT_GOAL_MINUTES,
  };
}

// ── Favoritas y estrellas ───────────────────────────────────────────────
export async function getBookmarkIds(supabase?: Supabase): Promise<string[]> {
  const client = supabase ?? (await createClient());
  const rows = await pageAll<{ sense_id: string }>((from, to) =>
    client.from("student_bookmarks").select("sense_id").range(from, to) as unknown as PromiseLike<{ data: { sense_id: string }[] | null }>,
  );
  return rows.map((r) => r.sense_id);
}

/** Estrellas (0–3) de unas palabras: la mejor de sus habilidades. */
export async function getStars(senseIds: string[]): Promise<Map<string, 0 | 1 | 2 | 3>> {
  const out = new Map<string, 0 | 1 | 2 | 3>();
  if (!senseIds.length) return out;
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_word_state")
    .select("sense_id, stage, interval_days")
    .in("sense_id", senseIds);
  for (const r of (data ?? []) as { sense_id: string; stage: Stage; interval_days: number }[]) {
    const stars = masteryStars({ stage: r.stage, intervalDays: Number(r.interval_days) });
    out.set(r.sense_id, Math.max(out.get(r.sense_id) ?? 0, stars) as 0 | 1 | 2 | 3);
  }
  return out;
}
