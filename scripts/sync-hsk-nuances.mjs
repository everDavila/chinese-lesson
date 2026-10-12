// Rellena matices bilingües únicamente en sentidos oficiales vacíos y
// unreviewed. Por defecto simula; exige --apply para escribir.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
if (!path) throw new Error("Falta el archivo del lote.");
const batch = JSON.parse(readFileSync(path, "utf8"));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const orders = batch.nuances.map((row) => row.sourceOrder);
const { data: senses, error } = await db.from("senses").select("id,status,nuance_es,nuance_en,catalog_source_order").in("catalog_source_order", orders).eq("catalog_source_id", "cti-hsk3-2026");
if (error) throw error;
const byOrder = new Map(senses.map((sense) => [sense.catalog_source_order, sense]));
const updates = [];
const skipped = [];
for (const row of batch.nuances) {
  const sense = byOrder.get(row.sourceOrder);
  if (!sense) throw new Error(`No existe el sentido oficial ${row.sourceOrder} (${row.hanzi}).`);
  if (sense.status !== "unreviewed" || sense.nuance_es?.trim() || sense.nuance_en?.trim()) { skipped.push(row.hanzi); continue; }
  updates.push({ id: sense.id, nuance_es: row.es, nuance_en: row.en });
}
console.log(`${apply ? "[aplicar]" : "[simulación]"} ${updates.length} matices nuevos; ${skipped.length} existentes o revisados intactos.`);
if (!apply) process.exit(0);
for (let from = 0; from < updates.length; from += 10) {
  await Promise.all(updates.slice(from, from + 10).map(async (update) => {
    const { id, ...fields } = update;
    const { error: updateError } = await db.from("senses").update(fields).eq("id", id).eq("status", "unreviewed").is("nuance_es", null).is("nuance_en", null);
    if (updateError) throw updateError;
  }));
}
console.log(`Actualizados ${updates.length} sentidos sin tocar contenido existente.`);

