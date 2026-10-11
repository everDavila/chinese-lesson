import "server-only";

import { randomInt } from "node:crypto";
import { createClient } from "./supabase/server";

// Sesiones de clase y valoraciones de la profesora (DIAGNOSTICO-MODO-CLASE.md §C).

// Sin 0/O, 1/I/L: se dicta y se teclea sin confusiones. Coincide con el
// check de la columna join_code.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function newJoinCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export async function createSession(lessonId: string, teacherId: string): Promise<string> {
  const supabase = await createClient();
  // El código es único solo entre sesiones activas; si choca, se reintenta.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("class_sessions")
      .insert({ lesson_id: lessonId, teacher_id: teacherId, join_code: newJoinCode() })
      .select("id")
      .single();
    if (!error) return data.id;
    if (error.code !== "23505") throw error;
  }
  throw new Error("No se pudo generar un código de sesión libre.");
}

export type SessionInfo = {
  id: string;
  lessonId: string;
  joinCode: string;
  status: "active" | "ended";
  ratings: Record<string, 1 | 2 | 3 | 4>;
};

export async function getSession(sessionId: string): Promise<SessionInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_sessions")
    .select("id, lesson_id, join_code, status, teacher_ratings(sense_id, rating)")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    lessonId: data.lesson_id,
    joinCode: data.join_code,
    status: data.status,
    ratings: Object.fromEntries(
      (data.teacher_ratings as { sense_id: string; rating: 1 | 2 | 3 | 4 }[]).map((r) => [r.sense_id, r.rating]),
    ),
  };
}

export async function setTeacherRating(sessionId: string, senseId: string, rating: number | null) {
  const supabase = await createClient();
  const { error } = rating
    ? await supabase
        .from("teacher_ratings")
        .upsert({ session_id: sessionId, sense_id: senseId, rating, updated_at: new Date().toISOString() })
    : await supabase.from("teacher_ratings").delete().eq("session_id", sessionId).eq("sense_id", senseId);
  if (error) throw error;
}

export async function endSession(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}
