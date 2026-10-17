-- Catálogo oficial HSK por nivel, sin lecciones artificiales. Lee el temario
-- (word_levels) por ENTRADA, no por palabra: 71 palabras están en más de un
-- nivel (得 de en HSK 2; dé y děi en HSK 3) y words.hsk_level guarda uno solo,
-- así que search_words omitiría entradas. Cada fila es una entrada con su
-- sentido exacto, en el orden oficial (source_order, único). Solo lectura;
-- security invoker: RLS decide (el catálogo es de lectura para authenticated).

-- Entradas por nivel, para las tarjetas de la biblioteca.
create or replace function public.hsk_catalog_counts()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(level, n), '{}'::jsonb)
  from (
    select level, count(*) as n from public.word_levels
    where standard = 'hsk-3.0'
    group by level
  ) x;
$$;

-- Una página del nivel `lvl` (7 = banda 7–9), después de `after_order`.
-- Búsqueda por hanzi, significado o pinyin: sin tonos busca amplio ("dei" →
-- děi); con tonos, exacto ("dé" no trae děi). Paginación por cursor: la
-- siguiente página pide after_order = next. Devuelve { total, next, rows }:
-- total = entradas del nivel que cumplen la búsqueda; next = null al final.
-- En cada fila, `levels` son todos los niveles del temario donde aparece la
-- palabra (la entrada sigue siendo una sola fila, en su nivel).
create or replace function public.hsk_catalog(
  lvl int,
  q text default '',
  lim int default 50,
  after_order int default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      trim(coalesce(q, '')) as q,
      public.plain_pinyin(q) as p,
      coalesce(q, '') ~ '[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]' as toned,
      lower(regexp_replace(trim(coalesce(q, '')), '\s', '', 'g')) as qt
  ),
  matched as (
    select wl.source_order, wl.word_id, wl.sense_id, w.hanzi,
      coalesce(se.pinyin, wl.pinyin) as pinyin,
      coalesce(se.category, wl.part_of_speech) as category,
      se.meaning_es, se.meaning_en
    from public.word_levels wl
    join public.words w on w.id = wl.word_id
    left join public.senses se on se.id = wl.sense_id
    cross join params
    where wl.standard = 'hsk-3.0' and wl.level = hsk_catalog.lvl
      and (
        params.q = ''
        or w.hanzi like '%' || params.q || '%'
        or (params.toned and lower(regexp_replace(coalesce(se.pinyin, wl.pinyin, ''), '\s', '', 'g')) like '%' || params.qt || '%')
        or (not params.toned and params.p <> '' and public.plain_pinyin(coalesce(se.pinyin, wl.pinyin)) like '%' || params.p || '%')
        or se.meaning_es ilike '%' || params.q || '%'
        or se.meaning_en ilike '%' || params.q || '%'
      )
  ),
  page as (
    select * from matched
    where source_order > coalesce(after_order, 0)
    order by source_order
    limit greatest(1, least(coalesce(lim, 50), 200))
  )
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'next', (
      select case
        when exists (select 1 from matched where source_order > (select max(source_order) from page))
        then (select max(source_order) from page)
      end
    ),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'order', page.source_order,
        'wordId', page.word_id,
        'senseId', page.sense_id,
        'hanzi', page.hanzi,
        'pinyin', coalesce(page.pinyin, ''),
        'category', coalesce(page.category, ''),
        'meaningEs', coalesce(page.meaning_es, ''),
        'meaningEn', coalesce(page.meaning_en, ''),
        'sentences', (select count(*) from public.sentences x where x.sense_id = page.sense_id),
        'levels', (
          select coalesce(jsonb_agg(distinct o.level), '[]'::jsonb)
          from public.word_levels o
          where o.standard = 'hsk-3.0' and o.word_id = page.word_id
        )
      ) order by page.source_order)
      from page
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.hsk_catalog(int, text, int, int) from public, anon;
revoke all on function public.hsk_catalog_counts() from public, anon;
grant execute on function public.hsk_catalog(int, text, int, int) to authenticated, service_role;
grant execute on function public.hsk_catalog_counts() to authenticated, service_role;
