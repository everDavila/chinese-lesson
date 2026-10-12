// Actualiza frases curadas sin tocar sentidos o frases ya revisados. Mantiene
// los UUID existentes para no romper referencias de clases. Simula salvo --apply.
// Uso: node --env-file=.env.local scripts/sync-curated-hsk-examples.mjs <archivo> [--apply]
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
if (!path) throw new Error("Falta el archivo del lote curado.");
const batch = JSON.parse(readFileSync(path, "utf8"));
if (!batch.metadata?.curation) throw new Error("El archivo no declara metadata.curation.");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY.");

async function api(route, { method = "GET", body, prefer } = {}) {
  const response = await fetch(`${url}/rest/v1/${route}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const sourceId = encodeURIComponent(batch.metadata.sourceId);
const orders = batch.examples.map((row) => row.sourceOrder);
const minOrder = Math.min(...orders);
const maxOrder = Math.max(...orders);
const senses = await api(`senses?select=id,status,catalog_source_order&catalog_source_id=eq.${sourceId}&catalog_source_order=gte.${minOrder}&catalog_source_order=lte.${maxOrder}`);
const senseByOrder = new Map(senses.map((sense) => [sense.catalog_source_order, sense]));
const existing = [];
const ids = senses.map((sense) => sense.id);
for (let i = 0; i < ids.length; i += 100) {
  existing.push(...await api(`sentences?select=id,sense_id,position,zh,pinyin,translation_es,translation_en,origin,status&sense_id=in.(${ids.slice(i, i + 100).join(",")})&order=position`));
}
const bySense = Map.groupBy(existing, (sentence) => sentence.sense_id);
const updates = [];
const inserts = [];
const skipped = [];

for (const row of batch.examples) {
  const sense = senseByOrder.get(row.sourceOrder);
  if (!sense) throw new Error(`No existe el sentido oficial ${row.sourceOrder} (${row.hanzi}).`);
  const current = bySense.get(sense.id) ?? [];
  if (sense.status !== "unreviewed" || current.some((sentence) => sentence.status !== "unreviewed")) {
    skipped.push(`${row.hanzi}: contenido revisado`);
    continue;
  }
  const byPosition = new Map(current.map((sentence) => [sentence.position, sentence]));
  for (const [index, sentence] of row.sentences.entries()) {
    const position = index + 1;
    const fields = {
      zh: sentence.zh,
      pinyin: sentence.pinyin,
      translation_es: sentence.es,
      translation_en: sentence.en,
      computed_level: batch.metadata.level,
      origin: sentence.origin === "open_data" ? "open_data" : "ai",
      status: "unreviewed",
    };
    const old = byPosition.get(position);
    if (!old) inserts.push({ sense_id: sense.id, position, ...fields });
    else if (["zh", "pinyin", "translation_es", "translation_en", "origin"].some((field) => old[field] !== fields[field])) {
      updates.push({ id: old.id, ...fields });
    }
  }
}

console.log(`${apply ? "[aplicar]" : "[simulación]"} ${updates.length} actualizaciones, ${inserts.length} inserciones, ${skipped.length} sentidos curados respetados.`);
if (!apply) process.exit(0);

let cursor = 0;
const workers = Array.from({ length: 10 }, async () => {
  while (cursor < updates.length) {
    const update = updates[cursor++];
    const { id, ...fields } = update;
    await api(`sentences?id=eq.${id}&status=eq.unreviewed`, { method: "PATCH", body: fields, prefer: "return=minimal" });
  }
});
await Promise.all(workers);
for (let i = 0; i < inserts.length; i += 100) {
  await api("sentences", { method: "POST", body: inserts.slice(i, i + 100), prefer: "return=minimal" });
}
console.log("Lote aplicado sin cambiar estados de revisión ni UUID existentes.");
