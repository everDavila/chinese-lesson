// Rellena meaning_es únicamente si el sentido oficial sigue vacío y
// unreviewed. Por defecto simula; exige --apply para escribir.
// Uso: node --env-file=.env.local scripts/sync-hsk-meanings-es.mjs <archivo> [--apply]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
if (!path) throw new Error("Falta el archivo del lote.");
const batch = JSON.parse(readFileSync(path, "utf8"));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const min = Math.min(...batch.meanings.map((row) => row.sourceOrder));
const max = Math.max(...batch.meanings.map((row) => row.sourceOrder));
const { data: senses, error } = await db.from("senses")
  .select("id,status,meaning_es,catalog_source_order")
  .eq("catalog_source_id", "cti-hsk3-2026")
  .gte("catalog_source_order", min).lte("catalog_source_order", max);
if (error) throw error;
const byOrder = new Map(senses.map((sense) => [sense.catalog_source_order, sense]));
const updates = [];
const skipped = [];
for (const row of batch.meanings) {
  const sense = byOrder.get(row.sourceOrder);
  if (!sense) throw new Error(`No existe el sentido oficial ${row.sourceOrder} (${row.hanzi}).`);
  if (sense.status !== "unreviewed" || sense.meaning_es?.trim()) {
    skipped.push(row.hanzi);
    continue;
  }
  updates.push({ id: sense.id, meaning_es: row.meaningEs });
}
console.log(`${apply ? "[aplicar]" : "[simulación]"} ${updates.length} glosas nuevas; ${skipped.length} existentes o revisadas intactas.`);
if (!apply) process.exit(0);
for (let from = 0; from < updates.length; from += 10) {
  await Promise.all(updates.slice(from, from + 10).map(async (update) => {
    const { error: updateError } = await db.from("senses").update({ meaning_es: update.meaning_es })
      .eq("id", update.id).eq("status", "unreviewed").is("meaning_es", null);
    if (updateError) throw updateError;
  }));
}
console.log(`Actualizados ${updates.length} sentidos sin tocar contenido existente.`);

