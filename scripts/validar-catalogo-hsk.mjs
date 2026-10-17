// Valida el catálogo HSK (hsk_catalog) contra el temario (word_levels): por
// cada nivel recorre todas las páginas y comprueba que la unión es exactamente
// la lista oficial, en orden, sin repetidos ni omisiones. Solo lee.
//   node --env-file=.env.dev.local scripts/validar-catalogo-hsk.mjs   (dev)
//   node --env-file=.env.local scripts/validar-catalogo-hsk.mjs       (producción)
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const PAGE = 50; // el tamaño que usa la biblioteca

async function official(level) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("word_levels")
      .select("source_order")
      .eq("standard", "hsk-3.0")
      .eq("level", level)
      .order("source_order")
      .range(from, from + 999);
    if (error) throw error;
    out.push(...data.map((r) => r.source_order));
    if (data.length < 1000) break;
  }
  return out;
}

let failed = false;
const { data: counts, error: countsError } = await db.rpc("hsk_catalog_counts");
if (countsError) throw countsError;

for (let level = 1; level <= 7; level++) {
  const expected = await official(level);
  const seen = [];
  let after = 0;
  let total = null;
  let pages = 0;
  const started = Date.now();
  for (;;) {
    const { data, error } = await db.rpc("hsk_catalog", { lvl: level, q: "", lim: PAGE, after_order: after });
    if (error) throw error;
    pages++;
    total ??= data.total;
    seen.push(...data.rows.map((r) => r.order));
    if (data.next == null) break;
    after = data.next;
  }
  const ms = Math.round((Date.now() - started) / pages);
  const exact = seen.length === expected.length && seen.every((o, i) => o === expected[i]);
  const ok = exact && total === expected.length && counts[level] === expected.length;
  if (!ok) failed = true;
  const name = level === 7 ? "7–9" : String(level);
  console.log(
    `${ok ? "✓" : "✗"} HSK ${name}: ${seen.length} filas en ${pages} páginas · temario ${expected.length} · ` +
      `únicas ${new Set(seen).size} · tarjeta ${counts[level]} · ~${ms} ms por página`,
  );
}
process.exit(failed ? 1 : 0);
