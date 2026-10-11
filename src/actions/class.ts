"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { chooseSessionSentences, currentUserId, createDemoLesson } from "@/lib/lessons";
import { createSession, endSession, setTeacherRating } from "@/lib/sessions";

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
