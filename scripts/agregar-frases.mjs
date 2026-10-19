// Agrega frases (y notas, solo si el campo está vacío) a palabras que ya
// existen en el catálogo, en su sentido principal. Nunca borra ni reemplaza:
// salta las frases cuyo chino ya exista en ese sentido. Por defecto simula.
// Uso: node --env-file=.env.local scripts/agregar-frases.mjs contenido/frases-extra-2026-10-19.json [--apply]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
if (!file) throw new Error("Falta el archivo de frases.");
const { palabras } = JSON.parse(readFileSync(file, "utf8"));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

console.log(apply ? "[aplicar]" : "[simulación]");
for (const p of palabras) {
  const { data: word, error } = await db
    .from("words")
    .select("id, cultural_note_es, cultural_note_en, senses(id, position, nuance_es, nuance_en, sentences(zh, position))")
    .eq("hanzi", p.hanzi)
    .maybeSingle();
  if (error) throw error;
  if (!word) {
    console.log(`✗ ${p.hanzi}: no está en el catálogo (usar cargar-palabras-extra.mjs)`);
    continue;
  }
  const sense = [...word.senses].sort((a, b) => a.position - b.position)[0];
  const have = new Set(sense.sentences.map((s) => s.zh));
  const fresh = p.sentences.filter((s) => !have.has(s.zh));
  let next = Math.max(0, ...sense.sentences.map((s) => s.position));
  const notes = {};
  if (p.nuance_es && !sense.nuance_es) notes.nuance_es = p.nuance_es;
  if (p.nuance_en && !sense.nuance_en) notes.nuance_en = p.nuance_en;
  const wordNotes = {};
  if (p.cultural_es && !word.cultural_note_es) wordNotes.cultural_note_es = p.cultural_es;
  if (p.cultural_en && !word.cultural_note_en) wordNotes.cultural_note_en = p.cultural_en;
  console.log(`${p.hanzi}: ${fresh.length} frases nuevas (ya tenía ${sense.sentences.length})${Object.keys(notes).length ? " · matiz" : ""}${Object.keys(wordNotes).length ? " · nota cultural" : ""}`);
  if (!apply) continue;
  if (fresh.length) {
    const { error: e } = await db.from("sentences").insert(
      fresh.map((s) => ({ sense_id: sense.id, position: ++next, zh: s.zh, pinyin: s.pinyin, translation_es: s.es, translation_en: s.en, origin: "ai", status: "unreviewed" })),
    );
    if (e) throw e;
  }
  if (Object.keys(notes).length) {
    const { error: e } = await db.from("senses").update(notes).eq("id", sense.id);
    if (e) throw e;
  }
  if (Object.keys(wordNotes).length) {
    const { error: e } = await db.from("words").update(wordNotes).eq("id", word.id);
    if (e) throw e;
  }
}
