"use server";

import { redirect } from "next/navigation";
import { currentUserId, createDemoLesson } from "@/lib/lessons";
import { createSession, endSession, setTeacherRating } from "@/lib/sessions";

async function requireTeacher() {
  const teacherId = await currentUserId();
  if (!teacherId) redirect("/login");
  return teacherId;
}

export async function createDemoLessonAction() {
  const teacherId = await requireTeacher();
  await createDemoLesson(teacherId);
  redirect("/");
}

/** Empieza una clase con la lección y abre la presentación. */
export async function startSessionAction(lessonId: string) {
  const teacherId = await requireTeacher();
  const sessionId = await createSession(lessonId, teacherId);
  redirect(`/present/session/${sessionId}`);
}

export async function rateSenseAction(sessionId: string, senseId: string, rating: number | null) {
  await requireTeacher();
  if (rating !== null && ![1, 2, 3, 4].includes(rating)) throw new Error("Valoración no válida");
  await setTeacherRating(sessionId, senseId, rating);
}

export async function endSessionAction(sessionId: string) {
  await requireTeacher();
  await endSession(sessionId);
  redirect("/");
}
