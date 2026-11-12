import { createClient } from "@/lib/supabase/server";

// Descarga de todo el avance del alumno en un JSON. Es su dato: lo ve y se lo
// lleva. RLS limita cada tabla a sus propias filas, así que basta pedir todo.
const TABLES = ["student_sessions", "student_events", "student_word_state", "student_known_flags", "student_bookmarks", "student_settings"] as const;

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) return new Response("Inicia sesión para exportar tu avance.", { status: 401 });

  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 1 };
  for (const table of TABLES) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data: page } = await supabase.from(table).select("*").range(from, from + 999);
      rows.push(...(page ?? []));
      if (!page || page.length < 1000) break;
    }
    out[table] = rows;
  }
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="renshi-avance-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
