import "server-only";

import { allPages } from "./in-chunks";
import { parseAmount, parseSource, pickForPractice, type PickState } from "./practice-pick";
import { createClient } from "./supabase/server";

// Material de práctica del alumno: el del sistema (niveles HSK y temas). El
// alumno elige la fuente y cuántas palabras; aquí se deciden cuáles.

export type Theme = { id: string; title: string; description: string | null; words: number };

/** Los temas son las plantillas del sistema (colecciones sin dueño). */
export async function listThemes(): Promise<Theme[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, title, description, lessons(archived_at, lesson_items(count))")
    .is("owner_id", null)
    .order("title");
  if (error) throw error;
  type Row = { id: string; title: string; description: string | null; lessons: { archived_at: string | null; lesson_items: { count: number }[] }[] };
  return (data as unknown as Row[])
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      words: c.lessons.filter((l) => !l.archived_at).reduce((n, l) => n + (l.lesson_items[0]?.count ?? 0), 0),
    }))
    .filter((t) => t.words > 0);
}

async function writeStates(): Promise<Map<string, PickState>> {
  const supabase = await createClient();
  const rows = await allPages<{ sense_id: string; stage: string; due_at: string | null }>(
    (from, to) => supabase.from("student_word_state").select("sense_id, stage, due_at").eq("skill", "write").range(from, to) as unknown as PromiseLike<{ data: { sense_id: string; stage: string; due_at: string | null }[] | null; error: unknown }>,
  );
  return new Map(rows.map((r) => [r.sense_id, { stage: r.stage, dueAt: r.due_at }]));
}

export type PracticePlan = { title: string; senseIds: string[]; /** La fuente no tiene palabras nuevas ni por repasar. */ done: boolean };

/** Arma la práctica de `n` palabras de una fuente (`hsk-3`, `tema-<id>`). null si la fuente no es válida. */
export async function planPractice(sourceParam: string | undefined, amountParam: string | undefined): Promise<PracticePlan | null> {
  const source = parseSource(sourceParam);
  if (!source) return null;
  const n = parseAmount(amountParam);
  const supabase = await createClient();
  const states = await writeStates();
  const now = new Date();

  if (source.kind === "hsk") {
    // En el orden oficial, página a página, hasta tener suficientes palabras nuevas.
    const seen: string[] = [];
    for (let from = 0; ; from += 200) {
      const { data, error } = await supabase
        .from("word_levels")
        .select("sense_id")
        .eq("standard", "hsk-3.0")
        .eq("level", source.level)
        .not("sense_id", "is", null)
        .order("source_order", { ascending: true })
        .range(from, from + 199);
      if (error) throw error;
      seen.push(...(data ?? []).map((r) => r.sense_id as string));
      const picked = pickForPractice(seen, states, n, now);
      const freshCount = seen.filter((id) => !states.has(id)).length;
      if (freshCount >= n || !data || data.length < 200) {
        return { title: `${source.level === 7 ? "HSK 7–9" : `HSK ${source.level}`} · ${picked.length}`, senseIds: picked, done: picked.length === 0 };
      }
    }
  }

  const { data, error } = await supabase
    .from("collections")
    .select("title, lessons(position, archived_at, lesson_items(position, sense_id))")
    .eq("id", source.id)
    .is("owner_id", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  type Row = { title: string; lessons: { position: number; archived_at: string | null; lesson_items: { position: number; sense_id: string }[] }[] };
  const row = data as unknown as Row;
  const ordered = row.lessons
    .filter((l) => !l.archived_at)
    .sort((a, b) => a.position - b.position)
    .flatMap((l) => [...l.lesson_items].sort((a, b) => a.position - b.position).map((i) => i.sense_id));
  const picked = pickForPractice(ordered, states, n, now);
  return { title: `${row.title} · ${picked.length}`, senseIds: picked, done: picked.length === 0 };
}
