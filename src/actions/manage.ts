"use server";

import { refresh } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditableWord } from "@/lib/content";
import { getProfile } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

// Escrituras de las vistas de admin y docente. Cada acción comprueba la
// sesión y deja el resto a RLS; devuelven un código de error en vez de
// lanzar, para que la pantalla lo muestre en su idioma.

export type ActionError = "auth" | "inUse" | "invalid" | "failed";
export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: ActionError; detail?: string };

async function session() {
  const profile = await getProfile();
  if (!profile) return null;
  return { profile, db: await createClient() };
}

function fail(error: { code?: string; message?: string } | null): Result {
  // 23503: clave foránea (un sentido que ya usan lecciones o valoraciones).
  if (error?.code === "23503") return { ok: false, error: "inUse", detail: error.message };
  return { ok: false, error: "failed", detail: error?.message };
}

// ── Colecciones y lecciones ─────────────────────────────────────────────

export async function createCollectionAction(title: string, template: boolean): Promise<Result<{ id: string }>> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  const { data, error } = await s.db
    .from("collections")
    .insert({ title: title.trim(), owner_id: template ? null : s.profile.id })
    .select("id")
    .single();
  if (error) return fail(error) as Result<{ id: string }>;
  refresh();
  return { ok: true, id: data.id };
}

export async function copyTemplateAction(templateId: string): Promise<Result<{ id: string }>> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data, error } = await s.db.rpc("copy_collection", { template_id: templateId });
  if (error) return fail(error) as Result<{ id: string }>;
  refresh();
  return { ok: true, id: data as string };
}

export async function renameCollectionAction(id: string, title: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  const { error } = await s.db.from("collections").update({ title: title.trim() }).eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function deleteCollectionAction(id: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { error } = await s.db.from("collections").delete().eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function addLessonAction(collectionId: string, title: string): Promise<Result<{ id: string }>> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  const { data: c } = await s.db.from("collections").select("owner_id").eq("id", collectionId).single();
  const { data: last } = await s.db
    .from("lessons")
    .select("position")
    .eq("collection_id", collectionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await s.db
    .from("lessons")
    .insert({
      title: title.trim(),
      collection_id: collectionId,
      // Las lecciones de plantilla no tienen dueña.
      teacher_id: c?.owner_id ? s.profile.id : null,
      position: (last?.position ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) return fail(error) as Result<{ id: string }>;
  refresh();
  return { ok: true, id: data.id };
}

export async function renameLessonAction(id: string, title: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  const { error } = await s.db.from("lessons").update({ title: title.trim() }).eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function deleteLessonAction(id: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { error } = await s.db.from("lessons").delete().eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// Intercambia la posición de dos filas pasando por una temporal negativa:
// las columnas de orden son únicas y un cambio directo chocaría.
async function swapPositions(
  db: SupabaseClient,
  table: "lessons" | "lesson_items",
  a: { match: Record<string, string>; position: number },
  b: { match: Record<string, string>; position: number },
) {
  for (const [match, position] of [
    [a.match, -1],
    [b.match, a.position],
    [a.match, b.position],
  ] as const) {
    const { error } = await db.from(table).update({ position }).match(match);
    if (error) return error;
  }
  return null;
}

export async function moveLessonAction(collectionId: string, lessonId: string, delta: -1 | 1): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data: lessons } = await s.db
    .from("lessons")
    .select("id, position")
    .eq("collection_id", collectionId)
    .order("position");
  const i = lessons?.findIndex((l) => l.id === lessonId) ?? -1;
  const other = lessons?.[i + delta];
  if (!lessons || i < 0 || !other) return { ok: false, error: "invalid" };
  const error = await swapPositions(
    s.db,
    "lessons",
    { match: { id: lessonId }, position: lessons[i].position },
    { match: { id: other.id }, position: other.position },
  );
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// ── Palabras de una lección ─────────────────────────────────────────────

export async function addItemsAction(lessonId: string, senseIds: string[]): Promise<Result<{ added: number }>> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data: items } = await s.db.from("lesson_items").select("sense_id, position").eq("lesson_id", lessonId);
  const present = new Set(items?.map((i) => i.sense_id));
  let next = Math.max(0, ...(items ?? []).map((i) => i.position));
  const rows = [...new Set(senseIds)].filter((id) => !present.has(id)).map((sense_id) => ({ lesson_id: lessonId, sense_id, position: ++next }));
  if (!rows.length) return { ok: true, added: 0 };
  const { error } = await s.db.from("lesson_items").insert(rows);
  if (error) return fail(error) as Result<{ added: number }>;
  refresh();
  return { ok: true, added: rows.length };
}

export async function setItemSenseAction(lessonId: string, fromSenseId: string, toSenseId: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { error } = await s.db
    .from("lesson_items")
    .update({ sense_id: toSenseId })
    .eq("lesson_id", lessonId)
    .eq("sense_id", fromSenseId);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function moveItemAction(lessonId: string, senseId: string, delta: -1 | 1): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data: items } = await s.db.from("lesson_items").select("sense_id, position").eq("lesson_id", lessonId).order("position");
  const i = items?.findIndex((it) => it.sense_id === senseId) ?? -1;
  const other = items?.[i + delta];
  if (!items || i < 0 || !other) return { ok: false, error: "invalid" };
  const error = await swapPositions(
    s.db,
    "lesson_items",
    { match: { lesson_id: lessonId, sense_id: senseId }, position: items[i].position },
    { match: { lesson_id: lessonId, sense_id: other.sense_id }, position: other.position },
  );
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function removeItemAction(lessonId: string, senseId: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { error } = await s.db.from("lesson_items").delete().eq("lesson_id", lessonId).eq("sense_id", senseId);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// ── Base común (solo admin; RLS y las funciones lo vuelven a comprobar) ─

export async function saveWordAction(word: EditableWord): Promise<Result> {
  const s = await session();
  if (!s || s.profile.role !== "admin") return { ok: false, error: "auth" };
  const { error } = await s.db.rpc("save_word", {
    p: {
      id: word.id,
      hsk_level: word.hsk || null,
      status: word.published ? "reviewed" : "unreviewed",
      cultural_note_es: word.culturalNoteEs,
      cultural_note_en: word.culturalNoteEn,
      senses: word.senses.map((sense) => ({
        id: sense.id,
        pinyin: sense.pinyin,
        category: sense.category,
        meaning_es: sense.meaningEs,
        meaning_en: sense.meaningEn,
        nuance_es: sense.nuanceEs,
        nuance_en: sense.nuanceEn,
        sentences: sense.sentences.map((t) => ({
          id: t.id,
          zh: t.zh,
          pinyin: t.pinyin,
          translation_es: t.es,
          translation_en: t.en,
        })),
      })),
    },
  });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function setWordPublishedAction(wordId: string, published: boolean): Promise<Result> {
  const s = await session();
  if (!s || s.profile.role !== "admin") return { ok: false, error: "auth" };
  const { error } = await s.db.rpc("set_word_status", { word: wordId, new_status: published ? "reviewed" : "unreviewed" });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function acceptSuggestionAction(id: string, replaceOriginal: boolean): Promise<Result> {
  const s = await session();
  if (!s || s.profile.role !== "admin") return { ok: false, error: "auth" };
  const { error } = await s.db.rpc("accept_teacher_example", { example_id: id, replace_original: replaceOriginal });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function rejectSuggestionAction(id: string, note: string): Promise<Result> {
  const s = await session();
  if (!s || s.profile.role !== "admin") return { ok: false, error: "auth" };
  const { error } = await s.db
    .from("teacher_examples")
    .update({
      status: "rejected",
      review_note: note.trim() || null,
      reviewed_by: s.profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "submitted");
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// ── Frases de la docente ────────────────────────────────────────────────
export type ExampleInput = { zh: string; pinyin: string; es: string; en: string };

const exampleFields = (e: ExampleInput) => ({
  zh: e.zh.trim(),
  pinyin: e.pinyin.trim() || null,
  translation_es: e.es.trim() || null,
  translation_en: e.en.trim() || null,
});

export async function createExampleAction(senseId: string, input: ExampleInput, basedOn: string | null): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!input.zh.trim()) return { ok: false, error: "invalid" };
  const { error } = await s.db
    .from("teacher_examples")
    .insert({ ...exampleFields(input), teacher_id: s.profile.id, sense_id: senseId, based_on_sentence_id: basedOn });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

/** Editar devuelve la frase a borrador: si estaba enviada o rechazada, hay que volver a sugerirla. */
export async function updateExampleAction(id: string, input: ExampleInput): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!input.zh.trim()) return { ok: false, error: "invalid" };
  const { error } = await s.db
    .from("teacher_examples")
    .update({ ...exampleFields(input), status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function deleteExampleAction(id: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { error } = await s.db.from("teacher_examples").delete().eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

/** Sugerir al admin (submit = true) o retirar la sugerencia. */
export async function suggestExampleAction(id: string, submit: boolean): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data: e } = await s.db.from("teacher_examples").select("pinyin").eq("id", id).single();
  // El admin la publica tal cual: sin pinyin no se puede aceptar.
  if (submit && !e?.pinyin) return { ok: false, error: "invalid" };
  const { error } = await s.db
    .from("teacher_examples")
    .update({ status: submit ? "submitted" : "draft", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function hideSentenceAction(sentenceId: string, hidden: boolean): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { error } = hidden
    ? await s.db.from("teacher_hidden_sentences").upsert({ teacher_id: s.profile.id, sentence_id: sentenceId })
    : await s.db.from("teacher_hidden_sentences").delete().eq("sentence_id", sentenceId).eq("teacher_id", s.profile.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// ── Rotación de frases ──────────────────────────────────────────────────
const validCount = (n: number | null) => n === null || (Number.isInteger(n) && n >= 0 && n <= 9);

/** Frases por palabra en clase para toda la colección (0 = todas). */
export async function setCollectionExamplesAction(id: string, count: number): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!validCount(count)) return { ok: false, error: "invalid" };
  const { error } = await s.db.from("collections").update({ examples_shown: count }).eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

/** Lo mismo para una lección; null = como la colección. */
export async function setLessonExamplesAction(id: string, count: number | null): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!validCount(count)) return { ok: false, error: "invalid" };
  const { error } = await s.db.from("lessons").update({ examples_shown: count }).eq("id", id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
