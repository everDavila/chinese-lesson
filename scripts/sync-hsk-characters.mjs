// Completa caracteres ausentes en Supabase sin reemplazar ningún campo ya
// poblado. Por defecto simula; exige --apply para escribir.
// Uso: node --env-file=.env.local scripts/sync-hsk-characters.mjs [--apply]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const rows = Object.entries(JSON.parse(readFileSync("data/characters.json", "utf8"))).map(([char, row]) => ({
  char,
  pinyin: row.pinyin,
  radical: row.radical,
  decomposition: row.decomposition,
  components: row.components,
  etymology: row.etymology,
  stroke_roles: row.strokeRoles,
}));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const { data: existing, error } = await db.from("characters").select("char");
if (error) throw error;
const existingChars = new Set(existing.map((row) => row.char));
const inserts = rows.filter((row) => !existingChars.has(row.char));

console.log(`${apply ? "[aplicar]" : "[simulación]"} ${inserts.length} caracteres nuevos; ${rows.length - inserts.length} existentes intactos.`);
if (!apply || inserts.length === 0) process.exit(0);
for (let from = 0; from < inserts.length; from += 100) {
  const { error: insertError } = await db.from("characters").insert(inserts.slice(from, from + 100));
  if (insertError) throw insertError;
}
console.log(`Insertados ${inserts.length} caracteres sin actualizar filas existentes.`);

