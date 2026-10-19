// Carga palabras que no están en el temario HSK 3.0 (sin nivel), con su
// sentido, frases y notas, desde contenido/palabras-extra-*.json. Nunca
// duplica ni modifica: si la palabra ya existe, la salta. Completa los
// caracteres que falten (datos del repositorio). Por defecto simula.
// Uso: node --env-file=.env.local scripts/cargar-palabras-extra.mjs contenido/palabras-extra-2026-10-19.json [--apply]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
if (!file) throw new Error("Falta el archivo de palabras.");
const { palabras } = JSON.parse(readFileSync(file, "utf8"));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// Pinyin para buscar sin tonos, como el catálogo: "dǎ lánqiú" → "dalanqiu".
const plain = (p) => p.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ü/g, "v").replace(/[^a-zA-Z]/g, "").toLowerCase();

const hanzi = palabras.map((p) => p.hanzi);
const { data: existing, error } = await db.from("words").select("hanzi").in("hanzi", hanzi);
if (error) throw error;
const skip = new Set(existing.map((w) => w.hanzi));
const nuevas = palabras.filter((p) => !skip.has(p.hanzi));

// Caracteres: los que falten se completan desde data/characters.json; si no
// hay datos, solo el pinyin (sin «Cómo se forma», pero con trazos si existen).
const chars = [...new Set(nuevas.flatMap((p) => [...p.hanzi]))];
const { data: haveChars, error: charError } = await db.from("characters").select("char").in("char", chars);
if (charError) throw charError;
const have = new Set(haveChars.map((c) => c.char));
const local = JSON.parse(readFileSync("data/characters.json", "utf8"));
const MANUAL = { 韩: { pinyin: ["hán"] } };
const charRows = chars
  .filter((c) => !have.has(c))
  .map((c) => {
    const row = local[c];
    if (row)
      return { char: c, pinyin: row.pinyin, radical: row.radical, decomposition: row.decomposition, components: row.components, etymology: row.etymology, stroke_roles: row.strokeRoles };
    // Mismas columnas que las demás filas: en un lote, una columna ausente llega como null.
    if (MANUAL[c]) return { char: c, pinyin: MANUAL[c].pinyin, radical: null, decomposition: null, components: [], etymology: null, stroke_roles: [] };
    return null;
  });
const sinDatos = chars.filter((c, i) => !have.has(c) && !charRows[chars.filter((x) => !have.has(x)).indexOf(c)]);

console.log(`${apply ? "[aplicar]" : "[simulación]"} ${nuevas.length} palabras nuevas; ya existían: ${[...skip].join(" ") || "ninguna"}.`);
console.log(`Caracteres a completar: ${charRows.filter(Boolean).map((r) => r.char).join(" ") || "ninguno"}${sinDatos.length ? ` · sin datos: ${sinDatos.join(" ")}` : ""}.`);
if (!apply) process.exit(0);

const toInsert = charRows.filter(Boolean);
if (toInsert.length) {
  const { error: e } = await db.from("characters").insert(toInsert);
  if (e) throw e;
}
for (const p of nuevas) {
  const { data: word, error: we } = await db
    .from("words")
    .insert({ hanzi: p.hanzi, hsk_level: null, hsk_version: "3.0", cultural_note_es: p.cultural_es ?? null, cultural_note_en: p.cultural_en ?? null, origin: "ai", status: "unreviewed" })
    .select("id")
    .single();
  if (we) throw we;
  const { data: sense, error: se } = await db
    .from("senses")
    .insert({
      word_id: word.id,
      position: 1,
      pinyin: p.pinyin,
      pinyin_plain: plain(p.pinyin),
      category: p.category,
      meaning_es: p.es,
      meaning_en: p.en,
      nuance_es: p.nuance_es ?? null,
      nuance_en: p.nuance_en ?? null,
      origin: "ai",
      status: "unreviewed",
    })
    .select("id")
    .single();
  if (se) throw se;
  const { error: te } = await db.from("sentences").insert(
    p.sentences.map((t, i) => ({ sense_id: sense.id, position: i + 1, zh: t.zh, pinyin: t.pinyin, translation_es: t.es, translation_en: t.en, origin: "ai", status: "unreviewed" })),
  );
  if (te) throw te;
  console.log(`✓ ${p.hanzi} · ${p.pinyin} · ${p.sentences.length} frases`);
}
