// Rellena únicamente notas culturales vacías de palabras unreviewed.
// Por defecto simula; exige --apply para escribir en Supabase.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const batch = JSON.parse(readFileSync("contenido/notas-culturales-hsk1-3-sin-curar.json", "utf8"));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const hanzi = batch.notes.map((note) => note.hanzi);
const { data: words, error } = await db.from("words").select("id,hanzi,status,cultural_note_es,cultural_note_en").in("hanzi", hanzi);
if (error) throw error;
const byHanzi = new Map(words.map((word) => [word.hanzi, word]));
const updates = [];
const skipped = [];
for (const note of batch.notes) {
  const word = byHanzi.get(note.hanzi);
  if (!word) throw new Error(`No existe la palabra ${note.hanzi}.`);
  if (word.status !== "unreviewed" || word.cultural_note_es || word.cultural_note_en) {
    skipped.push(note.hanzi);
    continue;
  }
  updates.push({ id: word.id, cultural_note_es: note.es, cultural_note_en: note.en });
}
console.log(`${apply ? "[aplicar]" : "[simulación]"} ${updates.length} notas nuevas; ${skipped.length} existentes o revisadas intactas.`);
if (!apply) process.exit(0);
for (const update of updates) {
  const { id, ...fields } = update;
  const { error: updateError } = await db.from("words").update(fields).eq("id", id).eq("status", "unreviewed").is("cultural_note_es", null).is("cultural_note_en", null);
  if (updateError) throw updateError;
}
console.log(`Actualizadas ${updates.length} palabras sin tocar contenido existente.`);

