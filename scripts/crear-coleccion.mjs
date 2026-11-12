// Crea una colección plantilla (sin dueño) con sus lecciones desde un JSON de
// contenido/colecciones/. Cada palabra entra con su primer sentido. Nunca
// modifica ni borra: si ya existe una plantilla con ese título, se detiene.
// Por defecto simula.
// Uso: node --env-file=.env.local scripts/crear-coleccion.mjs contenido/colecciones/libro-salud-cuerpo.json [--apply]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
if (!file) throw new Error("Falta el archivo de la colección.");
const { collection, lessons } = JSON.parse(readFileSync(file, "utf8"));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

console.log(apply ? "[aplicar]" : "[simulación]", collection.title);
const { data: dup, error: de } = await db.from("collections").select("id").is("owner_id", null).eq("title", collection.title);
if (de) throw de;
if (dup.length) throw new Error(`Ya existe una plantilla «${collection.title}». No se crea otra.`);

const plan = [];
for (const l of lessons) {
  const { data: words, error } = await db.from("words").select("hanzi, senses(id, position)").in("hanzi", l.words);
  if (error) throw error;
  const byHanzi = new Map(words.map((w) => [w.hanzi, [...w.senses].sort((a, b) => a.position - b.position)[0]?.id]));
  const missing = l.words.filter((h) => !byHanzi.get(h));
  if (missing.length) throw new Error(`Faltan en el catálogo: ${missing.join(" ")}. Cárgalas antes.`);
  plan.push({ title: l.title, senses: l.words.map((h) => byHanzi.get(h)) });
  console.log(`  ${l.title}: ${l.words.length} palabras`);
}
if (!apply) process.exit(0);

const { data: col, error: ce } = await db
  .from("collections")
  .insert({ owner_id: null, title: collection.title, description: collection.description ?? null, source_note: collection.source_note ?? null })
  .select("id")
  .single();
if (ce) throw ce;
for (const [i, l] of plan.entries()) {
  const { data: lesson, error: le } = await db
    .from("lessons")
    .insert({ teacher_id: null, collection_id: col.id, position: i + 1, title: l.title })
    .select("id")
    .single();
  if (le) throw le;
  const { error: ie } = await db.from("lesson_items").insert(l.senses.map((sense_id, j) => ({ lesson_id: lesson.id, sense_id, position: j + 1 })));
  if (ie) throw ie;
  console.log(`✓ ${l.title}: ${l.senses.length} palabras`);
}
