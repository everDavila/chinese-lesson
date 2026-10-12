// Genera migraciones idempotentes del catálogo HSK 4–9. Solo crea datos
// ausentes o completa sentidos sin revisar; nunca reemplaza contenido curado.
import { readFile, writeFile } from "node:fs/promises";

const levels = [
  { key: "4", level: 4, count: 1000, order: "020000" },
  { key: "5", level: 5, count: 1600, order: "021000" },
  { key: "6", level: 6, count: 1800, order: "022000" },
  { key: "7-9", level: 7, count: 5600, order: "023000" },
];

const plainPinyin = (pinyin) => pinyin
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z]/g, "");

function buildSql(catalog, rows) {
  const { level, levelLabel, sourceId } = catalog.metadata;
  const payload = JSON.stringify(rows);
  const sources = level === 4 ? `
insert into content_sources (
  id, name, publisher, kind, source_url, version_label, license_name,
  license_url, redistribution_allowed, retrieved_at, notes
) values (
  'gushi',
  'Gushi HSK 3.0 downloads',
  'Gushi',
  'open_data',
  'https://gushichinese.com/es/hsk-3.0/downloads',
  'actualizado 2026-10-09',
  'CC BY-SA 4.0',
  'https://creativecommons.org/licenses/by-sa/4.0/',
  true,
  date '2026-10-12',
  'Glosas españolas traducidas a mano a partir de CC-CEDICT; esta migración no importa ejemplos ni audio.'
) on conflict (id) do nothing;
` : "";

  return `-- Generado por npm run build:hsk-seed:4-9 desde contenido/hsk3-level${levelLabel}.json.
-- Lista y pinyin: temario oficial 2025/2026. Glosas españolas: Gushi,
-- CC BY-SA 4.0. No importa oraciones, audio, matices ni notas culturales.
-- Solo crea filas ausentes y respeta todo contenido revisado.
${sources}
create temporary table hsk_source_entries_temp (
  source_order integer,
  hanzi text,
  source_label text,
  source_level_label text,
  pinyin text,
  pinyin_plain text,
  part_of_speech text,
  meaning_es text
) on commit drop;

insert into hsk_source_entries_temp
select *
from jsonb_to_recordset($catalog$${payload}$catalog$::jsonb) as entry (
  source_order integer,
  hanzi text,
  source_label text,
  source_level_label text,
  pinyin text,
  pinyin_plain text,
  part_of_speech text,
  meaning_es text
);

insert into words (hanzi, hsk_level, hsk_version, origin, status)
select distinct hanzi, ${level}, '3.0', 'open_data'::content_origin, 'unreviewed'::review_status
from hsk_source_entries_temp
on conflict (hanzi) do nothing;

-- Reutiliza únicamente un sentido previo sin catálogo y todavía sin revisar.
-- Si el sentido fue curado, crea otro borrador en vez de apropiárselo.
with matched_entries as (
  select
    words.id as word_id,
    source_entries.*,
    count(*) over (partition by words.id, source_entries.pinyin) as matching_entry_count
  from hsk_source_entries_temp as source_entries
  join words using (hanzi)
), reusable as (
  select matched_entries.*, matched_sense.id as sense_id
  from matched_entries
  left join lateral (
    select senses.id
    from senses
    where senses.word_id = matched_entries.word_id
      and senses.pinyin = matched_entries.pinyin
      and senses.catalog_source_id is null
      and senses.status = 'unreviewed'
    order by senses.position
    limit 1
  ) as matched_sense on true
  where matched_entries.matching_entry_count = 1
)
update senses
set
  catalog_source_id = '${sourceId}',
  catalog_source_order = reusable.source_order,
  pinyin_plain = coalesce(senses.pinyin_plain, reusable.pinyin_plain),
  category = coalesce(senses.category, reusable.part_of_speech),
  meaning_es = coalesce(senses.meaning_es, reusable.meaning_es)
from reusable
where senses.id = reusable.sense_id
  and reusable.sense_id is not null
  and senses.status = 'unreviewed';

with candidates as (
  select words.id as word_id, source_entries.*
  from hsk_source_entries_temp as source_entries
  join words using (hanzi)
  where not exists (
    select 1 from senses
    where senses.catalog_source_id = '${sourceId}'
      and senses.catalog_source_order = source_entries.source_order
  )
), positioned as (
  select candidates.*,
    coalesce((select max(senses.position) from senses where senses.word_id = candidates.word_id), 0)
      + row_number() over (partition by candidates.word_id order by candidates.source_order) as position
  from candidates
)
insert into senses (
  word_id, position, pinyin, pinyin_plain, category, meaning_es,
  catalog_source_id, catalog_source_order, origin, status
)
select
  word_id, position, pinyin, pinyin_plain, part_of_speech, meaning_es,
  '${sourceId}', source_order, 'open_data'::content_origin, 'unreviewed'::review_status
from positioned
on conflict (word_id, position) do nothing;

insert into word_levels (
  word_id, sense_id, standard, level, source_id, source_order,
  source_label, source_level_label, pinyin, part_of_speech
)
select
  words.id, matched_sense.id, 'hsk-3.0', ${level}, '${sourceId}',
  source_entries.source_order, source_entries.source_label,
  source_entries.source_level_label, source_entries.pinyin,
  source_entries.part_of_speech
from hsk_source_entries_temp as source_entries
join words using (hanzi)
left join lateral (
  select senses.id
  from senses
  where senses.catalog_source_id = '${sourceId}'
    and senses.catalog_source_order = source_entries.source_order
  order by senses.position
  limit 1
) as matched_sense on true
on conflict (standard, source_order) do nothing;

drop table hsk_source_entries_temp;
`;
}

for (const expected of levels) {
  const catalog = JSON.parse(await readFile(`contenido/hsk3-level${expected.key}.json`, "utf8"));
  if (catalog.metadata.level !== expected.level || catalog.words.length !== expected.count) {
    throw new Error(`Catálogo HSK ${expected.key} inválido.`);
  }
  const rows = catalog.words.map((word) => ({
    source_order: word.sourceOrder,
    hanzi: word.hanzi,
    source_label: word.sourceLabel,
    source_level_label: word.sourceLevelLabel,
    pinyin: word.pinyin,
    pinyin_plain: plainPinyin(word.pinyin),
    part_of_speech: word.partOfSpeech,
    meaning_es: word.meaningEs,
  }));
  const file = `supabase/migrations/20261012${expected.order}_hsk3_level${expected.key.replace("-", "_")}_seed.sql`;
  await writeFile(file, buildSql(catalog, rows), "utf8");
  console.log(`Seed HSK ${expected.key}: ${rows.length} entradas.`);
}

