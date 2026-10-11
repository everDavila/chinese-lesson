// Genera la migración que pasa a Supabase las glosas inglesas y la categoría
// del catálogo del prototipo (data/hsk-catalogo-1-3.json). El seed HSK 3.0
// dejó los sentidos sin significado y con la categoría del temario en chino
// ("量、（名）"); sin esto, la vista de admin no tiene nada que mostrar.
//
// Cada hanzi del catálogo trae sus sentidos en orden del temario, el mismo
// orden que senses.catalog_source_order: se emparejan por hanzi y posición.
// Solo rellena lo vacío: no pisa significados ni categorías ya curados.
// Uso: node scripts/build-catalog-glosses.mjs
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "supabase/migrations/20261011020000_catalog_glosses.sql";
const catalog = JSON.parse(readFileSync("data/hsk-catalogo-1-3.json", "utf8"));
const q = (s) => (s ? `'${s.replaceAll("'", "''")}'` : "null");

const rows = catalog.flatMap((e) => e.s.map((s, i) => `(${q(e.h)}, ${i + 1}, ${q(s.c)}, ${q(s.en)})`));

writeFileSync(
  OUT,
  `-- Generado por scripts/build-catalog-glosses.mjs; no editar a mano.
-- Glosa inglesa (complete-hsk-vocabulary, MIT) y categoría normalizada para
-- los sentidos del temario HSK 3.0. Solo rellena lo vacío o lo que sigue con
-- la categoría del temario en chino.

with g (hanzi, rank, category, meaning_en) as (
  values
  ${rows.join(",\n  ")}
),
ranked as (
  select s.id, w.hanzi,
         row_number() over (partition by w.hanzi order by s.catalog_source_order) as rank
  from senses s
  join words w on w.id = s.word_id
  where s.catalog_source_id = 'cti-hsk3-2026'
)
update senses s
set meaning_en = coalesce(nullif(s.meaning_en, ''), g.meaning_en),
    category = case
      when s.category is null or s.category ~ '[^\\x01-\\x7F]' then coalesce(g.category, s.category)
      else s.category
    end
from ranked r
join g on g.hanzi = r.hanzi and g.rank = r.rank
where s.id = r.id;
`,
);
console.log(`${rows.length} sentidos → ${OUT}`);
