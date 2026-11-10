"use server";

import { createClient } from "@/lib/supabase/server";

// Avance del alumno con cuenta (docs/DISENO-AVANCE-ESTUDIANTE.md). Sin sesión
// no se guarda nada y la tarjeta sigue funcionando con su avance local. RLS
// obliga a que cada fila sea del propio alumno; aquí solo se valida la forma.

export type PracticeEventInput = {
  sessionId: string;
  senseId: string;
  outcome: "correct" | "wrong" | "gave_up" | "known";
  rating: 1 | 2 | 3 | 4 | null;
  mistakes: number;
  strokesTotal: number | null;
  failedStrokes: number[];
  usedHelp: boolean;
  msToFirstAction: number | null;
  msTotal: number | null;
  /** Tiempo activo acumulado de la sesión, con corte de inactividad de 3 minutos. */
  activeMs: number;
  at?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OUTCOMES = ["correct", "wrong", "gave_up", "known"];
const int = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null);

function validate(e: PracticeEventInput): string | null {
  if (!UUID.test(e.sessionId) || !UUID.test(e.senseId)) return "id";
  if (!OUTCOMES.includes(e.outcome)) return "outcome";
  if (e.rating !== null && ![1, 2, 3, 4].includes(e.rating)) return "rating";
  if (int(e.mistakes, 10_000) === null || int(e.activeMs, 86_400_000) === null) return "números";
  if (!Array.isArray(e.failedStrokes) || e.failedStrokes.length > 500 || e.failedStrokes.some((n) => int(n, 1000) === null)) return "trazos";
  return null;
}

async function userId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, id: (data?.claims.sub as string | undefined) ?? null };
}

/** Guarda un intento y actualiza la sesión de tiempo activo. Devuelve false si no hay sesión o falla. */
export async function recordPracticeEvent(e: PracticeEventInput): Promise<boolean> {
  const bad = validate(e);
  if (bad) return false;
  const { supabase, id } = await userId();
  if (!id) return false;

  const session = await supabase.from("student_sessions").upsert(
    { id: e.sessionId, student_id: id, ended_at: new Date().toISOString(), active_ms: e.activeMs },
    { onConflict: "id" },
  );
  if (session.error) {
    console.error("Sesión del alumno:", session.error.message);
    return false;
  }
  const { error } = await supabase.from("student_events").insert({
    student_id: id,
    session_id: e.sessionId,
    sense_id: e.senseId,
    skill: "write",
    exercise: "strokes",
    outcome: e.outcome,
    rating: e.rating,
    mistakes: e.mistakes,
    strokes_total: int(e.strokesTotal, 5000),
    failed_strokes: e.failedStrokes,
    used_help: e.usedHelp,
    ms_to_first_action: int(e.msToFirstAction, 86_400_000),
    ms_total: int(e.msTotal, 86_400_000),
    ...(e.at ? { at: e.at } : {}),
  });
  if (error) console.error("Evento del alumno:", error.message);
  return !error;
}

export type LocalRecord = { senseId: string; rating: 1 | 2 | 3 | 4; mistakes: number; mode: "guide" | "free"; gaveUp: boolean; at: string };

/** Sube una sola vez lo que el alumno ya tenía guardado en el dispositivo. */
export async function importLocalProgress(records: LocalRecord[]): Promise<boolean> {
  const { supabase, id } = await userId();
  if (!id || !Array.isArray(records) || records.length > 2000) return false;
  const rows = records
    .filter((r) => UUID.test(r.senseId) && [1, 2, 3, 4].includes(r.rating) && int(r.mistakes, 10_000) !== null && !Number.isNaN(Date.parse(r.at)))
    .map((r) => ({
      student_id: id,
      sense_id: r.senseId,
      skill: "write",
      exercise: "strokes",
      outcome: r.gaveUp ? "gave_up" : r.rating >= 3 ? "correct" : "wrong",
      rating: r.rating,
      mistakes: r.mistakes,
      used_help: r.mode === "guide",
      at: new Date(r.at).toISOString(),
    }));
  if (!rows.length) return true;
  const { error } = await supabase.from("student_events").insert(rows);
  if (error) console.error("Importar avance:", error.message);
  return !error;
}
