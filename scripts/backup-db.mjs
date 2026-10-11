// Exporta todas las tablas públicas a un JSON con fecha y hora, por si hay que
// volver atrás tras aplicar migraciones. Uso:
//   node --env-file=.env.local scripts/backup-db.mjs
// No imprime correos ni identificadores de usuario.
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const TABLES = [
  "profiles",
  "words",
  "senses",
  "sentences",
  "characters",
  "revisions",
  "lessons",
  "lesson_items",
  "class_sessions",
  "teacher_ratings",
  "evaluations",
  "votes",
  "content_sources",
  "word_levels",
  "collections",
  "teacher_examples",
  "teacher_hidden_sentences",
];

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const dump = { takenAt: new Date().toISOString(), tables: {} };
tables: for (const table of TABLES) {
  const rows = [];
  // Supabase capa las lecturas en 1000 filas: se pagina con range.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select("*").range(from, from + 999);
    // Una tabla de una migración aún no aplicada no detiene el respaldo.
    if (error?.code === "PGRST205" || error?.code === "42P01") {
      console.log(`${table}: no existe todavía`);
      continue tables;
    }
    if (error) {
      console.error(`Fallo en ${table}:`, error.message);
      process.exit(1);
    }
    rows.push(...data);
    if (data.length < 1000) break;
  }
  dump.tables[table] = rows;
  console.log(`${table}: ${rows.length} filas`);
}

mkdirSync("backups", { recursive: true });
// Con hora: dos respaldos el mismo día no se pisan.
const file = `backups/supabase-${new Date().toISOString().slice(0, 16).replace(":", "")}.json`;
writeFileSync(file, JSON.stringify(dump, null, 2), "utf8");
console.log("Guardado en", file);
