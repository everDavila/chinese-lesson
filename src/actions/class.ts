"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { chooseSessionSentences, currentUserId, createDemoLesson } from "@/lib/lessons";
import { createSession, endSession, setTeacherRating } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

async function requireTeacher() {
  const teacherId = await currentUserId();
  if (!teacherId) return redirect({ href: "/login", locale: await getLocale() });
  return teacherId;
}

export async function createDemoLessonAction() {
  const teacherId = await requireTeacher();
  await createDemoLesson(teacherId);
  redirect({ href: "/", locale: await getLocale() });
}

/** Empieza una clase con la lección y abre la presentación. */
export async function startSessionAction(lessonId: string) {
  const teacherId = await requireTeacher();
  const sessionId = await createSession(lessonId, teacherId);
  // Si la elección de frases falla, la clase se da igual con todas.
  await chooseSessionSentences(sessionId, lessonId).catch((e) => console.error("Rotación de frases:", e));
  redirect({ href: `/present/session/${sessionId}`, locale: await getLocale() });
}

export async function rateSenseAction(sessionId: string, senseId: string, rating: number | null) {
  await requireTeacher();
  if (rating !== null && ![1, 2, 3, 4].includes(rating)) throw new Error("Valoración no válida");
  await setTeacherRating(sessionId, senseId, rating);
}

export async function endSessionAction(sessionId: string) {
  await requireTeacher();
  await endSession(sessionId);
  redirect({ href: "/", locale: await getLocale() });
}

// ── Presentar desde el catálogo HSK (hoja de ruta, prioridad 3) ─────────
// Toda clase cuelga de una lección: se crea una lección suelta marcada como
// `quick` (no sale en Mis lecciones) con las palabras pedidas y se abre la
// clase como cualquier otra. Ver migración 20261017020000.

const MAX_SELECTION = 1000;

/** Presenta las palabras seleccionadas en el catálogo (por sense_id, en ese orden). */
export async function presentSelectionAction(senseIds: string[]) {
  const teacherId = await requireTeacher();
  const ids = [...new Set(senseIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)))].slice(0, MAX_SELECTION);
  if (!ids.length) throw new Error("No hay palabras seleccionadas");
  const lessonId = await createQuickLesson(teacherId, `Selección · ${ids.length}`, ids);
  await startSessionAction(lessonId);
}

/** Presenta un nivel HSK completo (7 = banda 7–9), en orden oficial. */
export async function presentLevelAction(level: number) {
  const teacherId = await requireTeacher();
  if (!Number.isInteger(level) || level < 1 || level > 7) throw new Error("Nivel no válido");
  const supabase = await createClient();
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("word_levels")
      .select("sense_id")
      .eq("standard", "hsk-3.0")
      .eq("level", level)
      .not("sense_id", "is", null)
      .order("source_order")
      .range(from, from + 999);
    if (error) throw error;
    ids.push(...data.map((r) => r.sense_id as string));
    if (data.length < 1000) break;
  }
  if (!ids.length) throw new Error("Nivel sin palabras");
  const lessonId = await createQuickLesson(teacherId, `HSK ${level === 7 ? "7–9" : level}`, [...new Set(ids)]);
  await startSessionAction(lessonId);
}

async function createQuickLesson(teacherId: string, title: string, senseIds: string[]): Promise<string> {
  const supabase = await createClient();
  const day = new Date().toISOString().slice(0, 10);
  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({ teacher_id: teacherId, collection_id: null, title: `${title} · ${day}`, quick: true })
    .select("id")
    .single();
  if (error) throw error;
  // En tandas: un nivel completo son hasta 5600 ítems.
  for (let i = 0; i < senseIds.length; i += 500) {
    const chunk = senseIds.slice(i, i + 500).map((sense_id, k) => ({ lesson_id: lesson.id, sense_id, position: i + k + 1 }));
    const { error: itemsError } = await supabase.from("lesson_items").insert(chunk);
    if (itemsError) throw itemsError;
  }
  return lesson.id;
}
