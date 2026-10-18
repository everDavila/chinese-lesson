import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import type { Lesson } from "./lesson-types";
import { demoLessonFrom, type DemoPayload } from "./lessons";

// La demo pública es la lección de ejemplo de la base (la misma que recibe
// cada docente). Sin sesión: la lee public_demo_lesson(), que devuelve solo
// esa lección. Se guarda en caché unas horas; un cambio de contenido llega solo.

export async function getDemoLesson(): Promise<Lesson | null> {
  "use cache";
  cacheLife("hours");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("public_demo_lesson");
  if (error) throw error;
  return data ? demoLessonFrom(data as DemoPayload) : null;
}
