"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { currentUserId } from "@/lib/lessons";
import { createClient } from "@/lib/supabase/server";

// Votación de los alumnos (DIAGNOSTICO-MODO-CLASE.md §E). Los alumnos no
// tienen cuenta: hablan con la base solo a través de dos funciones
// (migración 20261012010000) que validan clase activa y votación abierta.

export type StudentState =
  | { status: "invalid" }
  | { status: "waiting" }
  | { status: "open"; evaluation: string; hanzi: string; pinyin: string };

const VOTER_COOKIE = "hanzi_voter";

/** Qué ve el alumno ahora: código inválido, esperando o una palabra abierta. */
export async function studentStateAction(code: string): Promise<StudentState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("student_vote_state", { code });
  if (error) throw error;
  return data as StudentState;
}

/**
 * Registra (o cambia) el voto del alumno. Su identidad es un token aleatorio
 * en una cookie httpOnly; en la base solo queda su hash. Borrar la cookie o
 * usar otro navegador = un voto nuevo: es una señal de comprensión, no un
 * examen, y la docente ve los votos frente a los alumnos esperados.
 */
export async function castVoteAction(code: string, evaluation: string, rating: number): Promise<boolean> {
  if (![1, 2, 3, 4].includes(rating)) return false;
  const jar = await cookies();
  let token = jar.get(VOTER_COOKIE)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    jar.set(VOTER_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 6 * 60 * 60,
    });
  }
  const voter = createHash("sha256").update(token).digest("hex");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cast_student_vote", { code, evaluation, voter, rating });
  if (error) throw error;
  return data === true;
}

// ── Lado de la docente (RLS: solo sus sesiones) ─────────────────────────

export type VotingResults = { open: boolean; counts: [number, number, number, number] } | null;

/** Abre la votación de un sentido; cierra la que hubiera abierta en la sesión. */
export async function openVotingAction(sessionId: string, senseId: string): Promise<boolean> {
  if (!(await currentUserId())) return false;
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error: closeError } = await supabase
    .from("evaluations")
    .update({ status: "closed", closed_at: now })
    .eq("session_id", sessionId)
    .eq("status", "open");
  if (closeError) throw closeError;
  const { error } = await supabase.from("evaluations").insert({ session_id: sessionId, sense_id: senseId });
  if (error) throw error;
  return true;
}

export async function closeVotingAction(sessionId: string): Promise<boolean> {
  if (!(await currentUserId())) return false;
  const supabase = await createClient();
  const { error } = await supabase
    .from("evaluations")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("status", "open");
  if (error) throw error;
  return true;
}

/** Votos de la última ronda de ese sentido en la sesión (abierta o no). */
export async function votingResultsAction(sessionId: string, senseId: string): Promise<VotingResults> {
  if (!(await currentUserId())) return null;
  const supabase = await createClient();
  const { data: ev, error } = await supabase
    .from("evaluations")
    .select("id, status, votes(rating)")
    .eq("session_id", sessionId)
    .eq("sense_id", senseId)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!ev) return null;
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  for (const v of ev.votes as { rating: number }[]) counts[v.rating - 1]++;
  return { open: ev.status === "open", counts };
}
