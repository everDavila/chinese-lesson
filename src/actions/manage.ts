"use server";

import { refresh } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditableWord } from "@/lib/content";
import { getProfile } from "@/lib/content";
import { inChunks } from "@/lib/in-chunks";
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

export async function createCollectionAction(title: string, template: boolean, description?: string): Promise<Result<{ id: string }>> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  const { data, error } = await s.db
    .from("collections")
    .insert({ title: title.trim(), description: description?.trim() ?? null, owner_id: template ? null : s.profile.id })
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

export async function renameCollectionAction(id: string, title: string, description?: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  const { error } = await s.db.from("collections").update({ title: title.trim(), description: description?.trim() ?? null }).eq("id", id);
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

/**
 * Crea una lección. Sin colección (`collectionId` null) es una lección suelta
 * de la docente: no hace falta crear una colección para dar clase.
 */
export async function addLessonAction(collectionId: string | null, title: string, description?: string): Promise<Result<{ id: string }>> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  if (!collectionId) {
    const { data, error } = await s.db
      .from("lessons")
      .insert({ title: title.trim(), description: description?.trim() || null, collection_id: null, teacher_id: s.profile.id, position: null })
      .select("id")
      .single();
    if (error) return fail(error) as Result<{ id: string }>;
    refresh();
    return { ok: true, id: data.id };
  }
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
      description: description?.trim() ?? null,
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

/**
 * Mueve una lección propia a otra colección propia, o la deja suelta
 * (`targetCollectionId` null). Solo cambia a qué colección pertenece y su
 * posición (al final de la destino): sus palabras, frases propias, clases y
 * votos siguen colgando de la misma lección. La rotación de frases recuerda por
 * colección, así que en la destino la lección empieza sin historial (decisión
 * de Ever, 2026-10-17). RLS solo admite colecciones de la misma docente.
 */
export async function moveLessonToCollectionAction(
  lessonId: string,
  targetCollectionId: string | null,
): Promise<Result<{ collectionId: string | null }>> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data: lesson } = await s.db.from("lessons").select("teacher_id, collection_id").eq("id", lessonId).maybeSingle();
  if (!lesson || lesson.teacher_id !== s.profile.id) return { ok: false, error: "auth" };
  if ((lesson.collection_id ?? null) === targetCollectionId) return { ok: true, collectionId: targetCollectionId };
  let position: number | null = null;
  if (targetCollectionId) {
    const { data: target } = await s.db.from("collections").select("owner_id").eq("id", targetCollectionId).maybeSingle();
    if (!target || target.owner_id !== s.profile.id) return { ok: false, error: "auth" };
    const { data: last } = await s.db
      .from("lessons")
      .select("position")
      .eq("collection_id", targetCollectionId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    position = (last?.position ?? 0) + 1;
  }
  const { error } = await s.db.from("lessons").update({ collection_id: targetCollectionId, position }).eq("id", lessonId);
  if (error) return fail(error) as Result<{ collectionId: string | null }>;
  refresh();
  return { ok: true, collectionId: targetCollectionId };
}

export async function renameLessonAction(id: string, title: string, description?: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!title.trim()) return { ok: false, error: "invalid" };
  const { error } = await s.db.from("lessons").update({ title: title.trim(), description: description?.trim() ?? null }).eq("id", id);
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

/**
 * Archiva (o restaura) una lección o una colección propia: desaparece de las
 * listas de la docente pero conserva clases, votos e historial de frases.
 * Borrar, en cambio, se lleva ese historial (deleteLessonAction /
 * deleteCollectionAction). Migración 20261017030000.
 */
export async function setArchivedAction(kind: "lesson" | "collection", id: string, archived: boolean): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const table = kind === "lesson" ? "lessons" : "collections";
  const owner = kind === "lesson" ? "teacher_id" : "owner_id";
  const { data, error } = await s.db
    .from(table)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .eq(owner, s.profile.id)
    .select("id");
  if (error) return fail(error);
  if (!data?.length) return { ok: false, error: "auth" };
  refresh();
  return { ok: true };
}

export async function setTeacherPinAction(kind: "lesson" | "collection", id: string, pinned: boolean): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!id) return { ok: false, error: "invalid" };
  const column = kind === "lesson" ? "lesson_id" : "collection_id";
  const query = s.db.from("teacher_pins");
  const { error } = pinned
    ? await query.insert({ teacher_id: s.profile.id, [column]: id })
    : await query.delete().eq("teacher_id", s.profile.id).eq(column, id);
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

/**
 * Vuelve al orden de la plantilla de origen (una lección): los ítems que la
 * plantilla ya no tiene (añadidos por la docente) van al final, en su orden.
 * Escrita en dos pasadas (negativas → finales) como swapPositions: `position`
 * es única por lección y un cambio directo chocaría.
 */
export async function resetLessonOrderAction(lessonId: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data: lesson } = await s.db.from("lessons").select("collection_id").eq("id", lessonId).maybeSingle();
  const { data: collection } = lesson
    ? await s.db.from("collections").select("copied_from").eq("id", lesson.collection_id ?? "").maybeSingle()
    : { data: null };
  const templateId = collection?.copied_from;
  if (!templateId) return { ok: false, error: "invalid" };
  type TL = { id: string; lesson_items: { position: number; sense_id: string }[] };
  const { data: templateLessons } = await s.db
    .from("lessons")
    .select("id, lesson_items(position, sense_id)")
    .eq("collection_id", templateId)
    .order("position");
  const { data: mine } = await s.db.from("lesson_items").select("sense_id, position").eq("lesson_id", lessonId).order("position");
  if (!templateLessons?.length || !mine) return { ok: false, error: "failed" };
  // La lección de origen es la que más sentidos comparte (aguanta renombres y
  // palabras añadidas/quitas); empate: la primera de la plantilla.
  const sorted = (tl: TL) => [...tl.lesson_items].sort((a, b) => a.position - b.position).map((i) => i.sense_id);
  const myIds = new Set(mine.map((m) => m.sense_id));
  let origin = (templateLessons as unknown as TL[])[0];
  for (const tl of templateLessons as unknown as TL[]) {
    const tlSenses = sorted(tl);
    const oSenses = sorted(origin);
    if (tlSenses.filter((id) => myIds.has(id)).length > oSenses.filter((id) => myIds.has(id)).length) origin = tl;
  }
  const originIds = sorted(origin);
  // Supabase no ordena los anidados en el mismo select: se trae también
  // position y se ordena aquí.
  const target = [...originIds, ...mine.map((m) => m.sense_id).filter((id) => !originIds.includes(id))];
  const error = await setPositions(s.db, "lesson_items", { lessonId }, target, mine);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

/**
 * Vuelve al orden de la plantilla de origen (la colección): empareja cada
 * lección por sus sentidos, así aguanta renombres ("HSK 1 · 1" → "HSK 1 ·
 * 1a"). Las lecciones nuevas o con otra plantilla van al final, en su orden.
 */
export async function resetCollectionOrderAction(collectionId: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  const { data: collection } = await s.db.from("collections").select("owner_id, copied_from").eq("id", collectionId).maybeSingle();
  if (!collection || collection.owner_id !== s.profile.id || !collection.copied_from) return { ok: false, error: "invalid" };
  type L = { id: string; position: number; lesson_items: { position: number; sense_id: string }[] };
  const both = await Promise.all([
    s.db.from("lessons").select("id, position, lesson_items(position, sense_id)").eq("collection_id", collection.copied_from).order("position"),
    s.db.from("lessons").select("id, position, lesson_items(position, sense_id)").eq("collection_id", collectionId).order("position"),
  ]);
  const [origin, mine] = both.map((r) => (r.error || !r.data ? null : (r.data as unknown as L[])));
  if (!origin || !mine) return { ok: false, error: "failed" };
  const keyOf = (l: L) => [...l.lesson_items].sort((a, b) => a.position - b.position).map((i) => i.sense_id).join(",");
  const target: string[] = [];
  for (const o of origin) {
    const oSenses = keyOf(o);
    const match = mine.find((m) => !target.includes(m.id) && keyOf(m) === oSenses);
    if (match) target.push(match.id);
  }
  for (const m of mine) if (!target.includes(m.id)) target.push(m.id);
  const error = await setPositions(s.db, "lessons", { collectionId }, target, mine.map((m) => ({ id: m.id, position: m.position })));
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// Nueva posición de cada fila (1..n) en dos pasadas: primero todas a
// negativas para no chocar con la unicidad, luego a las definitivas.
async function setPositions(
  db: SupabaseClient,
  table: "lessons" | "lesson_items",
  scope: { lessonId: string } | { collectionId: string },
  // ids en el orden objetivo; lesson_items se identifica por sense_id.
  target: string[],
  current: { id?: string; sense_id?: string; position: number }[],
) {
  const byId = new Map(current.map((r) => [(r.sense_id ?? r.id) as string, r]));
  const rows = target.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => !!r);
  for (const [n, row] of rows.entries()) {
    const match = "lessonId" in scope ? { lesson_id: scope.lessonId, sense_id: row.sense_id } : { id: row.id };
    const { error } = await db.from(table).update({ position: -(n + 1) }).match(match);
    if (error) return error;
  }
  for (const [n, row] of rows.entries()) {
    const match = "lessonId" in scope ? { lesson_id: scope.lessonId, sense_id: row.sense_id } : { id: row.id };
    const { error } = await db.from(table).update({ position: n + 1 }).match(match);
    if (error) return error;
  }
  return null;
}

export async function removeItemAction(lessonId: string, senseId: string): Promise<Result> {
  return removeItemsAction(lessonId, [senseId]);
}

/** Quita varias palabras de una vez (selección del editor); en tandas por el largo de la URL. */
export async function removeItemsAction(lessonId: string, senseIds: string[]): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "auth" };
  if (!senseIds.length) return { ok: true };
  try {
    await inChunks([...new Set(senseIds)], (part) =>
      s.db.from("lesson_items").delete().eq("lesson_id", lessonId).in("sense_id", part).select("sense_id"),
    );
  } catch (error) {
    return fail(error as { code?: string; message?: string });
  }
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
