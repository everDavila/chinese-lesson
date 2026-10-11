// Arregla las glosas inglesas que build-catalogo.mjs dejó cortadas a 90
// caracteres a media palabra ("to tend to (happen"): corrige
// data/hsk-catalogo-1-3.json y genera la migración que hace lo mismo en
// Supabase. La migración solo toca la glosa si sigue siendo exactamente la
// cortada: lo que haya editado el admin o la carga de contenido no se pisa.
// Uso: node scripts/build-gloss-tidy.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { tidyGloss } from "./lib/gloss.mjs";

const DATA = "data/hsk-catalogo-1-3.json";
const OUT = "supabase/migrations/20261011030000_catalog_gloss_tidy.sql";
const q = (s) => `'${s.replaceAll("'", "''")}'`;

const catalog = JSON.parse(readFileSync(DATA, "utf8"));
const changes = new Map();
for (const e of catalog) {
  for (const s of e.s) {
    const tidy = tidyGloss(s.en);
    if (tidy !== s.en) {
      changes.set(s.en, tidy);
      s.en = tidy;
    }
  }
}
// Ya aplicado: no se reescribe la migración (quedaría vacía e inválida).
if (!changes.size) {
  console.log("No hay glosas cortadas: nada que hacer.");
  process.exit(0);
}
// Mismo formato que escribe build-catalogo.mjs (una sola línea).
writeFileSync(DATA, JSON.stringify(catalog));

writeFileSync(
  OUT,
  `-- Generado por scripts/build-gloss-tidy.mjs; no editar a mano.
-- Glosas del catálogo HSK 3.0 que quedaron cortadas a 90 caracteres a media
-- palabra. Solo cambia las que siguen exactamente como se importaron.

update senses s
set meaning_en = g.tidy
from (values
  ${[...changes].map(([old, tidy]) => `(${q(old)}, ${q(tidy)})`).join(",\n  ")}
) as g (old, tidy)
where s.catalog_source_id = 'cti-hsk3-2026' and s.meaning_en = g.old;
`,
);
console.log(`${changes.size} glosas → ${DATA} y ${OUT}`);
