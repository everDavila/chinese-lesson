"use server";

import { currentUserId } from "@/lib/lessons";
import { createClient } from "@/lib/supabase/server";
import { voterHash } from "@/lib/voter";
import { DEFAULT_WRITE_CONFIG, parseAttempt, parseConfig, summarize, type ClassSummary, type WriteConfig } from "@/lib/write-stats";

// Votación de los alumnos (DIAGNOSTICO-MODO-CLASE.md §E). Los alumnos no
// tienen cuenta: hablan con la base solo a través de dos funciones
// (migración 20261012010000) que validan clase activa y votación abierta.

export type StudentState =
  | { status: "invalid" }
  | { status: "waiting" }
  | {
      status: "open";
      evaluation: string;
      hanzi: string;
      pinyin: string;
      /** Votar (1 a 4) o Escritura en clase. */
      kind: "vote" | "write";
      /** Límites de la ronda de escribir; null en una ronda de votar. */
      config: WriteConfig | null;
    };

/** Qué ve el alumno ahora: código inválido, esperando o una palabra abierta. */
export async function studentStateAction(code: string): Promise<StudentState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("student_vote_state", { code });
  if (error) throw error;
  const state = data as Record<string, unknown>;
  if (state.status !== "open") return state as StudentState;
  const kind = state.kind === "write" ? "write" : "vote";
  // Una ronda de escribir sin límites válidos usa los iniciales, no se queda sin poder escribir.
  const config = kind === "write" ? (parseConfig(state.config) ?? DEFAULT_WRITE_CONFIG) : null;
  return { status: "open", evaluation: state.evaluation as string, hanzi: state.hanzi as string, pinyin: state.pinyin as string, kind, config };
}

/**
 * Registra (o cambia) el voto del alumno. Su identidad es un token aleatorio
 * en una cookie httpOnly; en la base solo queda su hash. Borrar la cookie o
 * usar otro navegador = un voto nuevo: es una señal de comprensión, no un
 * examen, y la docente ve los votos frente a los alumnos esperados.
 */
export async function castVoteAction(code: string, evaluation: string, rating: number): Promise<boolean> {
  if (![1, 2, 3, 4].includes(rating)) return false;
  const voter = await voterHash();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cast_student_vote", { code, evaluation, voter, rating });
  if (error) throw error;
  return data === true;
}

// ── Lado de la docente (RLS: solo sus sesiones) ─────────────────────────

export type VotingResults = { open: boolean; counts: [number, number, number, number] } | null;

/**
 * Abre la votación de un sentido y cierra la que hubiera abierta en la sesión.
 * Si ese sentido ya tuvo una ronda en esta clase, la reabre: volver a una
 * palabra no borra los votos que ya tenía.
 */
export async function openVotingAction(sessionId: string, senseId: string): Promise<boolean> {
  if (!(await currentUserId())) return false;
  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_sessions")
    .select("live_mode, write_config")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) return false;
  // La ronda es de votar o de escribir según el modo de la clase en este momento;
  // si es de escribir, guarda una COPIA de los límites: no cambian a mitad de ella.
  const kind = session.live_mode === "write" ? "write" : "vote";
  const config = kind === "write" ? (parseConfig(session.write_config) ?? DEFAULT_WRITE_CONFIG) : null;
  const now = new Date().toISOString();
  const { error: closeError } = await supabase
    .from("evaluations")
    .update({ status: "closed", closed_at: now })
    .eq("session_id", sessionId)
    .eq("status", "open");
  if (closeError) throw closeError;
  // Volver a una palabra reabre su última ronda del MISMO tipo (con sus límites y sus intentos).
  const { data: last, error: lastError } = await supabase
    .from("evaluations")
    .select("id")
    .eq("session_id", sessionId)
    .eq("sense_id", senseId)
    .eq("kind", kind)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;
  const { error } = last
    ? await supabase.from("evaluations").update({ status: "open", closed_at: null }).eq("id", last.id)
    : await supabase.from("evaluations").insert({ session_id: sessionId, sense_id: senseId, kind, write_config: config });
  if (error) throw error;
  return true;
}

/** ¿Hay una votación abierta en la sesión? Al recargar, la clase sigue votando. */
export async function votingLiveAction(sessionId: string): Promise<boolean> {
  if (!(await currentUserId())) return false;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("evaluations")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "open");
  if (error) throw error;
  return (count ?? 0) > 0;
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
    .eq("kind", "vote")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!ev) return null;
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  for (const v of ev.votes as { rating: number }[]) counts[v.rating - 1]++;
  return { open: ev.status === "open", counts };
}

// ── Escritura en clase (docs/DISENO-ESCRITURA-EN-CLASE.md) ──────────────

export type LiveState = { live: boolean; mode: "vote" | "write"; config: WriteConfig };

/** Estado de la clase en vivo: si hay ronda abierta, el modo y los límites vigentes. Al recargar, todo sigue donde estaba. */
export async function liveStateAction(sessionId: string): Promise<LiveState | null> {
  if (!(await currentUserId())) return null;
  const supabase = await createClient();
  const [{ count, error }, { data: session, error: sessionError }] = await Promise.all([
    supabase.from("evaluations").select("id", { count: "exact", head: true }).eq("session_id", sessionId).eq("status", "open"),
    supabase.from("class_sessions").select("live_mode, write_config").eq("id", sessionId).maybeSingle(),
  ]);
  if (error) throw error;
  if (sessionError) throw sessionError;
  if (!session) return null;
  return {
    live: (count ?? 0) > 0,
    mode: session.live_mode === "write" ? "write" : "vote",
    config: parseConfig(session.write_config) ?? DEFAULT_WRITE_CONFIG,
  };
}

/** Elige si las siguientes rondas son de votar o de escribir, y con qué límites. Vale desde la siguiente palabra. */
export async function setLiveModeAction(sessionId: string, mode: "vote" | "write", config: unknown): Promise<boolean> {
  if (!(await currentUserId()) || (mode !== "vote" && mode !== "write")) return false;
  const valid = parseConfig(config);
  if (!valid) return false;
  const supabase = await createClient();
  const { error } = await supabase.from("class_sessions").update({ live_mode: mode, write_config: valid }).eq("id", sessionId);
  if (error) throw error;
  return true;
}

export type JoinResult = { status: "ok"; name: string } | { status: "name_required" | "invalid" };

/** El alumno entra a la clase con su cuenta o con un apodo. */
export async function joinClassAction(code: string, nickname: string, useAccount: boolean): Promise<JoinResult> {
  const voter = await voterHash();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_class", { code, voter, nickname: nickname.slice(0, 60), use_account: useAccount });
  if (error) throw error;
  const r = data as { status?: string; name?: string };
  if (r.status === "ok" && typeof r.name === "string") return { status: "ok", name: r.name };
  return { status: r.status === "name_required" ? "name_required" : "invalid" };
}

export type WriteSubmitStatus = "ok" | "duplicate" | "closed" | "not_joined" | "invalid";

/** Entrega el intento de escribir. La base solo guarda el primero de cada alumno por palabra. */
export async function submitWriteAction(code: string, evaluation: string, attempt: unknown): Promise<WriteSubmitStatus> {
  const parsed = parseAttempt(attempt);
  if (!parsed) return "invalid";
  const voter = await voterHash();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_student_write", { code, evaluation, voter, attempt: parsed });
  if (error) throw error;
  return (["ok", "duplicate", "closed", "not_joined"] as const).find((s) => s === data) ?? "invalid";
}

export type WriteResults = {
  open: boolean;
  config: WriteConfig;
  summary: ClassSummary;
  /** Alumnos que entraron a la clase con nombre. */
  joined: number;
  /** Alumnos esperados que anotó la profesora al abrir la clase; null si no lo anotó. */
  expected: number | null;
};

/** Lo que escribió la clase en la última ronda de escribir de esa palabra (RLS: solo sus sesiones). */
export async function writeResultsAction(sessionId: string, senseId: string): Promise<WriteResults | null> {
  if (!(await currentUserId())) return null;
  const supabase = await createClient();
  const { data: ev, error } = await supabase
    .from("evaluations")
    .select("id, status, write_config, evaluation_writes(voter_hash, attempt)")
    .eq("session_id", sessionId)
    .eq("sense_id", senseId)
    .eq("kind", "write")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!ev) return null;
  const [people, session] = await Promise.all([
    supabase.from("session_participants").select("voter_hash, display_name").eq("session_id", sessionId),
    supabase.from("class_sessions").select("expected_students").eq("id", sessionId).maybeSingle(),
  ]);
  if (people.error) throw people.error;
  const names = new Map((people.data ?? []).map((p) => [p.voter_hash as string, p.display_name as string]));
  const items = (ev.evaluation_writes as { voter_hash: string; attempt: unknown }[]).flatMap((w) => {
    const attempt = parseAttempt(w.attempt);
    return attempt ? [{ name: names.get(w.voter_hash) ?? "Alumno", attempt }] : [];
  });
  const config = parseConfig(ev.write_config) ?? DEFAULT_WRITE_CONFIG;
  return {
    open: ev.status === "open",
    config,
    summary: summarize(items, config),
    joined: names.size,
    expected: (session.data?.expected_students as number | null | undefined) ?? null,
  };
}

/** ¿Quien abrió /v tiene cuenta? Para ofrecerle entrar con su nombre de cuenta. */
export async function whoAmIAction(): Promise<{ loggedIn: boolean; displayName: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub as string | undefined;
  if (!id) return { loggedIn: false, displayName: null };
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", id).maybeSingle();
  return { loggedIn: true, displayName: (profile?.display_name as string | null | undefined)?.trim() || null };
}
