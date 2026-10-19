import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import type { Lesson } from "./lesson-types";
import { demoLessonFrom, type DemoPayload } from "./lessons";

// La demo pública es la lección de ejemplo de la base (la misma que recibe
// cada docente). Sin sesión: la lee public_demo_lesson(), que devuelve solo
// esa lección. En caché unos minutos: un cambio de contenido llega solo y, si
// la base falla, la portada y /present siguen en pie sin la demo.

export async function getDemoLesson(): Promise<Lesson | null> {
  "use cache";
  cacheLife("minutes");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("public_demo_lesson");
  if (error) {
    console.error("Demo pública:", error.message);
    return null;
  }
  return data ? demoLessonFrom(data as DemoPayload) : null;
}

/**
 * Una lección compartida por su docente (/l/<código>). Sin caché: si deja de
 * compartirla, el enlace muere al instante. null si el código no existe.
 */
export async function getSharedLesson(code: string): Promise<Lesson | null> {
  await connection();
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(code)) return null;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("shared_lesson", { code });
  if (error) {
    console.error("Lección compartida:", error.message);
    return null;
  }
  return data ? demoLessonFrom(data as DemoPayload) : null;
}
