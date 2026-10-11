import { readFile, writeFile } from "node:fs/promises";

const levels = [
  { level: 1, entryCount: 300, migrationOrder: "001000" },
  { level: 2, entryCount: 200, migrationOrder: "002000" },
  { level: 3, entryCount: 500, migrationOrder: "003000" },
];

const toPlainPinyin = (pinyin) =>
  pinyin
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const buildSql = (catalog, entries) => {
  const { level, sourceId } = catalog.metadata;
  const payload = JSON.stringify(entries);
  const sourceEntries = `create temporary table hsk_source_entries_temp (
    source_order integer,
    hanzi text,
    source_label text,
    source_level_label text,
    pinyin text,
    pinyin_plain text,
    part_of_speech text
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
  part_of_speech text
);`;

  return `-- Generado por npm run build:hsk-seed desde contenido/hsk3-level${level}.json.
-- Importa las entradas introducidas en HSK 3.0 nivel ${level}. Pinyin y
-- categoría crean sentidos provisionales; traducciones y ejemplos se curan después.

${sourceEntries}

insert into words (hanzi, hsk_level, hsk_version, origin, status)
select distinct hanzi, ${level}, '3.0', 'open_data'::content_origin, 'unreviewed'::review_status
from hsk_source_entries_temp
on conflict (hanzi) do nothing;

-- Vincula un sentido ya curado cuando hanzi+pinyin identifica una sola entrada
-- oficial. Si la fuente repite ambos, se mantienen borradores separados porque
-- representan usos distintos aunque se pronuncien igual (点1/点2, 花1/花2).
with matched_entries as (
  select
    words.id as word_id,
    source_entries.source_order,
    source_entries.pinyin,
    source_entries.pinyin_plain,
    source_entries.part_of_speech,
    count(*) over (
      partition by words.id, source_entries.pinyin
    ) as matching_entry_count
  from hsk_source_entries_temp as source_entries
  join words using (hanzi)
), reusable as (
  select
    matched_entries.*,
    matched_sense.id as sense_id
  from matched_entries
  left join lateral (
    select senses.id
    from senses
    where senses.word_id = matched_entries.word_id
      and senses.pinyin = matched_entries.pinyin
      and senses.catalog_source_id is null
    order by senses.position
    limit 1
  ) as matched_sense on true
  where matched_entries.matching_entry_count = 1
)
update senses
set
  catalog_source_id = '${sourceId}',
  catalog_source_order = reusable.source_order,
  pinyin_plain = coalesce(senses.pinyin_plain, reusable.pinyin_plain)
from reusable
where senses.id = reusable.sense_id
  and reusable.sense_id is not null;

with candidates as (
  select
    words.id as word_id,
    source_entries.source_order,
    source_entries.pinyin,
    source_entries.pinyin_plain,
    source_entries.part_of_speech
  from hsk_source_entries_temp as source_entries
  join words using (hanzi)
  where not exists (
    select 1 from senses
    where senses.catalog_source_id = '${sourceId}'
      and senses.catalog_source_order = source_entries.source_order
  )
), positioned as (
  select
    candidates.*,
    coalesce((
      select max(senses.position)
      from senses
      where senses.word_id = candidates.word_id
    ), 0) + row_number() over (
      partition by candidates.word_id order by candidates.source_order
    ) as position
  from candidates
)
insert into senses (
  word_id,
  position,
  pinyin,
  pinyin_plain,
  category,
  catalog_source_id,
  catalog_source_order,
  origin,
  status
)
select
  word_id,
  position,
  pinyin,
  pinyin_plain,
  part_of_speech,
  '${sourceId}',
  source_order,
  'open_data'::content_origin,
  'unreviewed'::review_status
from positioned
on conflict (word_id, position) do nothing;

-- Conserva cada entrada oficial. Un mismo hanzi puede reaparecer con otra
-- lectura o sentido en otro nivel (por ejemplo 点1/点2 o 只 zhī/zhǐ).
insert into word_levels (
  word_id,
  sense_id,
  standard,
  level,
  source_id,
  source_order,
  source_label,
  source_level_label,
  pinyin,
  part_of_speech
)
select
  words.id,
  matched_sense.id,
  'hsk-3.0',
  ${level},
  '${sourceId}',
  source_entries.source_order,
  source_entries.source_label,
  source_entries.source_level_label,
  source_entries.pinyin,
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
on conflict (standard, source_order) do update set
  word_id = excluded.word_id,
  sense_id = excluded.sense_id,
  level = excluded.level,
  source_id = excluded.source_id,
  source_label = excluded.source_label,
  source_level_label = excluded.source_level_label,
  pinyin = excluded.pinyin,
  part_of_speech = excluded.part_of_speech;

drop table hsk_source_entries_temp;
`;
};

for (const expected of levels) {
  const catalogUrl = new URL(
    `../contenido/hsk3-level${expected.level}.json`,
    import.meta.url,
  );
  const outputUrl = new URL(
    `../supabase/migrations/20261011${expected.migrationOrder}_hsk3_level${expected.level}_seed.sql`,
    import.meta.url,
  );
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));

  if (
    catalog.metadata.standard !== "hsk-3.0" ||
    catalog.metadata.level !== expected.level ||
    catalog.words.length !== expected.entryCount
  ) {
    throw new Error(`Catálogo HSK 3.0 nivel ${expected.level} inválido.`);
  }

  const entries = catalog.words.map(
    ({ sourceOrder, hanzi, sourceLabel, sourceLevelLabel, pinyin, partOfSpeech }) => ({
      source_order: sourceOrder,
      hanzi,
      source_label: sourceLabel,
      source_level_label: sourceLevelLabel,
      pinyin,
      pinyin_plain: toPlainPinyin(pinyin),
      part_of_speech: partOfSpeech,
    }),
  );

  await writeFile(outputUrl, buildSql(catalog, entries), "utf8");
  console.log(`Seed HSK ${expected.level}: ${entries.length} entradas nuevas.`);
}
