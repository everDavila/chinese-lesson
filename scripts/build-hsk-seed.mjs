import { readFile, writeFile } from "node:fs/promises";

const catalogUrl = new URL("../contenido/hsk3-level1.json", import.meta.url);
const outputUrl = new URL(
  "../supabase/migrations/20261011001000_hsk3_level1_seed.sql",
  import.meta.url,
);
const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));

if (
  catalog.metadata.standard !== "hsk-3.0" ||
  catalog.metadata.level !== 1 ||
  catalog.words.length !== 300
) {
  throw new Error("El generador solo acepta el catálogo HSK 3.0 nivel 1 validado.");
}

const toPlainPinyin = (pinyin) =>
  pinyin
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const entries = catalog.words.map(
  ({ sourceOrder, hanzi, sourceLabel, sourceLevelLabel, pinyin, partOfSpeech }) => ({
    source_order: sourceOrder,
    hanzi,
    source_label: sourceLabel,
    source_level_label: sourceLevelLabel,
    pinyin,
    pinyin_plain: toPlainPinyin(pinyin),
    category: partOfSpeech,
  }),
);
const payload = JSON.stringify(entries);

const sql = `-- Generado por npm run build:hsk-seed desde contenido/hsk3-level1.json.
-- Importa identificación y clasificación oficiales; no inventa sentidos ni
-- traducciones. Esos campos entran después por el flujo editorial.

with source_entries as (
  select *
  from jsonb_to_recordset($catalog$${payload}$catalog$::jsonb) as entry (
    source_order integer,
    hanzi text,
    source_label text,
    source_level_label text,
    pinyin text,
    pinyin_plain text,
    category text
  )
)
insert into words (hanzi, hsk_level, hsk_version, origin, status)
select hanzi, 1, '3.0', 'open_data', 'unreviewed'
from source_entries
on conflict (hanzi) do nothing;

with source_entries as (
  select *
  from jsonb_to_recordset($catalog$${payload}$catalog$::jsonb) as entry (
    source_order integer,
    hanzi text,
    source_label text,
    source_level_label text,
    pinyin text,
    pinyin_plain text,
    category text
  )
)
insert into word_levels (
  word_id,
  standard,
  level,
  source_id,
  source_order,
  source_label,
  source_level_label
)
select
  words.id,
  'hsk-3.0',
  1,
  '${catalog.metadata.sourceId}',
  source_entries.source_order,
  source_entries.source_label,
  source_entries.source_level_label
from source_entries
join words using (hanzi)
on conflict (word_id, standard) do update set
  level = excluded.level,
  source_id = excluded.source_id,
  source_order = excluded.source_order,
  source_label = excluded.source_label,
  source_level_label = excluded.source_level_label;

-- Un sentido provisional hace que cada palabra se pueda buscar y seleccionar
-- al armar una colección. No pisa contenido ya curado y sigue marcado como
-- unreviewed hasta separar acepciones, traducir y añadir ejemplos.
with source_entries as (
  select *
  from jsonb_to_recordset($catalog$${payload}$catalog$::jsonb) as entry (
    source_order integer,
    hanzi text,
    source_label text,
    source_level_label text,
    pinyin text,
    pinyin_plain text,
    category text
  )
)
insert into senses (
  word_id,
  position,
  pinyin,
  pinyin_plain,
  category,
  origin,
  status
)
select
  words.id,
  1,
  source_entries.pinyin,
  source_entries.pinyin_plain,
  source_entries.category,
  'open_data',
  'unreviewed'
from source_entries
join words using (hanzi)
on conflict (word_id, position) do nothing;
`;

await writeFile(outputUrl, sql, "utf8");
console.log(`Seed HSK generado: ${entries.length} entradas.`);
