import { createClient } from "@supabase/supabase-js";

// Solo lectura: compara la lección 1 de la copia HSK 1 de la docente con la
// lección 1 de la plantilla oficial HSK 1 (owner_id null).
// Uso: node --env-file=.env.local scripts/compare-template-order.mjs <collectionId>
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const colId = process.argv[2];
if (!colId) throw new Error("pasa el id de la colección copia");

const { data: col } = await db.from("collections").select("id, title, copied_from").eq("id", colId).single();
if (!col?.copied_from) throw new Error("la colección no es una copia");
const { data: template } = await db.from("collections").select("id, title").eq("id", col.copied_from).single();
console.log(`copia: ${col.title}  ←  plantilla: ${template.title}`);

async function lessonWords(collectionId, lessonPosition) {
  const { data: lessons } = await db.from("lessons").select("id, title, position").eq("collection_id", collectionId).order("position");
  const lesson = lessons[lessonPosition - 1];
  const { data: items } = await db
    .from("lesson_items")
    .select("position, senses!inner(words!inner(hanzi))")
    .eq("lesson_id", lesson.id)
    .order("position");
  return { title: lesson.title, position: lesson.position, words: items.map((i) => i.senses.words.hanzi) };
}

const a = await lessonWords(template.id, 1);
const b = await lessonWords(colId, 1);
console.log(`\nplantilla lección 1 ("${a.title}", position ${a.position}):\n  ${a.words.join(" ")}`);
console.log(`\ncopia lección 1 ("${b.title}", position ${b.position}):\n  ${b.words.join(" ")}`);
console.log("\npalabras iguales:", a.words.join("|") === b.words.join("|") ? "SÍ" : "NO");

const { data: tLessons } = await db.from("lessons").select("title, position").eq("collection_id", template.id).order("position");
const { data: cLessons } = await db.from("lessons").select("title, position").eq("collection_id", colId).order("position");
console.log("\nplantilla lecciones:", tLessons.map((l) => `${l.position}:${l.title}`).join(" | "));
console.log("\ncopia lecciones:", cLessons.map((l) => `${l.position}:${l.title}`).join(" | "));
console.log(
  "\norden de lecciones igual:",
  tLessons.map((l) => l.position).join("|") === cLessons.map((l) => l.position).join("|") ? "SÍ" : "NO",
);
