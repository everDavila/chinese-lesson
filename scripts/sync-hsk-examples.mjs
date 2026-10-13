// Inserta ejemplos faltantes sin modificar contenido existente. Solo actúa
// sobre sentidos unreviewed del catálogo oficial y exige --apply para escribir.
// Uso: node --env-file=.env.local scripts/sync-hsk-examples.mjs <archivo> [--apply]
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const path = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
if (!path) throw new Error("Falta el archivo del lote.");
const batch = JSON.parse(readFileSync(path, "utf8"));
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
// Los lotes temáticos tienen órdenes dispersos: leer un intervalo puede
// superar el límite de 1000 filas de Supabase y ocultar sentidos existentes.
const orders = [...new Set(batch.examples.map((row) => row.sourceOrder))];
const senses = [];
for (let i = 0; i < orders.length; i += 100) {
  const selected = orders.slice(i, i + 100).join(",");
  senses.push(...await api(`senses?select=id,status,catalog_source_order,pinyin,words(hanzi)&catalog_source_id=eq.${sourceId}&catalog_source_order=in.(${selected})`));
}
const senseByOrder = new Map(senses.map((sense) => [sense.catalog_source_order, sense]));
const senseIds = senses.map((sense) => sense.id);
const existing = [];
for (let i = 0; i < senseIds.length; i += 100) {
  const ids = senseIds.slice(i, i + 100).join(",");
  existing.push(...await api(`sentences?select=id,sense_id,position,zh,status&sense_id=in.(${ids})&order=position`));
}
const existingBySense = Map.groupBy(existing, (sentence) => sentence.sense_id);
const inserts = [];
const skipped = [];
for (const row of batch.examples) {
  const sense = senseByOrder.get(row.sourceOrder);
  if (!sense) throw new Error(`No existe el sentido oficial ${row.sourceOrder} (${row.hanzi}).`);
  // Los UUID cambian entre bases creadas con seeds. La identidad editorial
  // es fuente + orden + hanzi + lectura, no el UUID del entorno de origen.
  if (sense.words?.hanzi !== row.hanzi || (row.targetPinyin && sense.pinyin !== row.targetPinyin)) {
    throw new Error(`La identidad de ${row.hanzi} no coincide con el sentido oficial ${row.sourceOrder}.`);
  }
  if (sense.status !== "unreviewed") {
    skipped.push(`${row.hanzi}: ${sense.status}`);
    continue;
  }
  const current = existingBySense.get(sense.id) ?? [];
  const usedZh = new Set(current.map((sentence) => sentence.zh));
  const usedPositions = new Set(current.map((sentence) => sentence.position));
  let position = 1;
  for (const sentence of row.sentences) {
    if (current.length + inserts.filter((item) => item.sense_id === sense.id).length >= 3) break;
    if (usedZh.has(sentence.zh)) continue;
    while (usedPositions.has(position)) position++;
    inserts.push({
      sense_id: sense.id, position, zh: sentence.zh, pinyin: sentence.pinyin,
      translation_es: sentence.es, translation_en: sentence.en,
      computed_level: batch.metadata.level, origin: sentence.origin, status: "unreviewed",
    });
    usedZh.add(sentence.zh);
    usedPositions.add(position++);
  }
}

console.log(`${apply ? "[aplicar]" : "[simulación]"} ${inserts.length} frases nuevas; ${skipped.length} sentidos curados respetados.`);
if (!apply || inserts.length === 0) process.exit(0);
for (let i = 0; i < inserts.length; i += 100) {
  await api("sentences", { method: "POST", body: inserts.slice(i, i + 100), prefer: "return=minimal" });
}
console.log(`Insertadas ${inserts.length} frases sin actualizar ninguna existente.`);
