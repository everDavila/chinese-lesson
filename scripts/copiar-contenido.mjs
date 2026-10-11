// Copia el contenido de producción a la base de desarrollo, con los mismos
// ids: palabras, sentidos, frases, caracteres, fuentes, niveles y las
// plantillas (colecciones sin dueña con sus lecciones). No copia nada de
// personas: cuentas, colecciones propias, frases de docentes ni clases.
//
// Las migraciones ya crean en desarrollo el catálogo y las plantillas, pero
// con ids aleatorios distintos de los de producción. Este script borra en
// desarrollo lo que no exista en producción y luego copia producción encima.
// Solo escribe en desarrollo; se niega si las dos bases son la misma.
//
// Uso: npm run db:dev:copiar            (copia)
//      npm run db:dev:copiar -- --prueba (solo lee y cuenta)
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const dryRun = process.argv.includes("--prueba");
const env = (file) =>
  Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
  );
const connect = (e) =>
  createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const prodEnv = env(".env.local");
const prod = connect(prodEnv);
const devEnv = existsSync(".env.dev.local") ? env(".env.dev.local") : null;
if (!devEnv && !dryRun) {
  console.error("Falta .env.dev.local: primero npm run db:dev:crear.");
  process.exit(1);
}
if (devEnv && devEnv.NEXT_PUBLIC_SUPABASE_URL === prodEnv.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Desarrollo y producción apuntan a la misma base. No copio nada.");
  process.exit(1);
}
const dev = devEnv ? connect(devEnv) : null;

async function readAll(db, table, select = "*", filter = (q) => q) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await filter(db.from(table).select(select)).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}
const chunks = (xs, n = 500) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

async function upsert(table, rows, onConflict) {
  for (const part of chunks(rows)) {
    const { error } = await dev.from(table).upsert(part, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}
// Borra en desarrollo las filas cuyo id no existe en producción.
async function prune(table, prodRows, filter = (q) => q) {
  const keep = new Set(prodRows.map((r) => r.id));
  const extra = (await readAll(dev, table, "id", filter)).map((r) => r.id).filter((id) => !keep.has(id));
  for (const part of chunks(extra, 200)) {
    const { error } = await dev.from(table).delete().in("id", part);
    if (error) throw new Error(`${table} (borrar): ${error.message}`);
  }
  return extra.length;
}

const templates = (q) => q.is("owner_id", null);
const data = {
  content_sources: await readAll(prod, "content_sources"),
  characters: await readAll(prod, "characters"),
  words: await readAll(prod, "words", "*", (q) => q.order("id")),
  senses: await readAll(prod, "senses", "*", (q) => q.order("id")),
  sentences: await readAll(prod, "sentences", "*", (q) => q.order("id")),
  word_levels: await readAll(prod, "word_levels", "word_id, sense_id, standard, level, source_id, source_order, source_label, source_level_label, pinyin, part_of_speech"),
  collections: await readAll(prod, "collections", "*", templates),
};
const templateIds = data.collections.map((c) => c.id);
data.lessons = templateIds.length ? await readAll(prod, "lessons", "*", (q) => q.in("collection_id", templateIds)) : [];
const lessonIds = data.lessons.map((l) => l.id);
data.lesson_items = [];
for (const part of chunks(lessonIds, 100)) data.lesson_items.push(...(await readAll(prod, "lesson_items", "*", (q) => q.in("lesson_id", part))));
// La base común no tiene revisor en desarrollo: esas cuentas no existen allí.
for (const t of ["words", "senses", "sentences"]) for (const r of data[t]) r.reviewed_by = null;

console.log("Producción:", Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
if (dryRun) {
  console.log("Modo prueba: no se escribió nada.");
  process.exit(0);
}

// 1. Fuera lo que las migraciones crearon con ids propios. Borrar una
//    plantilla arrastra sus lecciones e ítems; una palabra, sus sentidos,
//    frases y niveles.
console.log("Borrados en desarrollo:", {
  plantillas: await prune("collections", data.collections, templates),
  palabras: await prune("words", data.words),
  sentidos: await prune("senses", data.senses),
  frases: await prune("sentences", data.sentences),
});
{
  const { error } = await dev.from("word_levels").delete().gte("level", 0);
  if (error) throw new Error(`word_levels (borrar): ${error.message}`);
}

// 2. Producción encima, en orden de dependencias.
await upsert("content_sources", data.content_sources, "id");
await upsert("characters", data.characters, "char");
await upsert("words", data.words, "id");
await upsert("senses", data.senses, "id");
await upsert("sentences", data.sentences, "id");
for (const part of chunks(data.word_levels)) {
  const { error } = await dev.from("word_levels").insert(part);
  if (error) throw new Error(`word_levels: ${error.message}`);
}
await upsert("collections", data.collections, "id");
await upsert("lessons", data.lessons, "id");
await upsert("lesson_items", data.lesson_items, "lesson_id,sense_id");

console.log("Copiado a desarrollo:", Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
