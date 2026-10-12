-- Búsqueda del catálogo en la base. Con HSK 3.0 completo (≈11 000 palabras)
-- ya no se puede mandar todo al navegador y filtrar ahí: el editor de lección
-- y la tabla del admin piden solo lo que muestran. security invoker: RLS
-- decide qué lee cada cuenta (el catálogo es de lectura para authenticated).

-- "Rèn shi" → "renshi"; "lǜ" → "lv" (igual para la consulta y para los datos).
create or replace function public.plain_pinyin(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    lower(translate(coalesce(p, ''),
      'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ',
      'aaaaeeeeiiiioooouuuuvvvvvaaaaeeeeiiiioooouuuuvvvvv')),
    '[^a-z]', '', 'g');
$$;

-- Devuelve { total, rows, levels, statuses }:
--   rows: hasta `lim` palabras que cumplen los filtros, con sus sentidos;
--   total: cuántas cumplen; levels / statuses: conteos de toda la base
--   (para los filtros). Estado como en la app: curada (revisada), borrador
--   (significado en español o frases) o sin contenido.
-- Todo se agrupa una vez (frases por sentido, estado por palabra) y la
-- coincidencia de texto es una subconsulta sobre senses: con 11 000 filas,
-- comparar cada palabra con cada sentido no termina.
create or replace function public.search_words(
  q text default '',
  levels int[] default null,
  statuses text[] default null,
  lim int default 40
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select trim(coalesce(q, '')) as q, public.plain_pinyin(q) as p
  ),
  counts as (
    select sense_id, count(*) as n from public.sentences group by sense_id
  ),
  content as (
    select se.word_id, bool_or(coalesce(se.meaning_es, '') <> '' or c.n is not null) as has
    from public.senses se left join counts c on c.sense_id = se.id
    group by se.word_id
  ),
  ws as (
    select w.id, w.hanzi, w.hsk_level,
      case
        when w.status <> 'unreviewed' then 'curada'
        when coalesce(ct.has, false) then 'borrador'
        else 'sin contenido'
      end as status
    from public.words w left join content ct on ct.word_id = w.id
  ),
  -- Relevancia (menor = antes): pinyin exacto 1; pinyin o significado que
  -- empieza por lo escrito 2; lo contiene 3. "agua" → 水 antes que 伞 (paraguas).
  hits as (
    select se.word_id, min(
      case
        when params.p <> '' and public.plain_pinyin(se.pinyin) = params.p then 1
        when (params.p <> '' and public.plain_pinyin(se.pinyin) like params.p || '%')
          or se.meaning_es ~* ('(^|[;,/ (])' || regexp_replace(params.q, '([.*+?^${}()|\[\]\\])', '\\\1', 'g'))
          or se.meaning_en ~* ('(^|[;,/ (])' || regexp_replace(params.q, '([.*+?^${}()|\[\]\\])', '\\\1', 'g')) then 2
        else 3
      end) as rank
    from public.senses se, params
    where params.q <> '' and (
      (params.p <> '' and public.plain_pinyin(se.pinyin) like '%' || params.p || '%')
      or se.meaning_es ilike '%' || params.q || '%'
      or se.meaning_en ilike '%' || params.q || '%'
    )
    group by se.word_id
  ),
  m as (
    select ws.*,
      case
        when params.q = '' then 0
        when ws.hanzi = params.q then 0
        when ws.hanzi like params.q || '%' then least(2, coalesce(h.rank, 2))
        when ws.hanzi like '%' || params.q || '%' then least(3, coalesce(h.rank, 3))
        else h.rank
      end as rank
    from ws cross join params left join hits h on h.word_id = ws.id
    where (levels is null or cardinality(levels) = 0 or ws.hsk_level = any(levels))
      and (statuses is null or cardinality(statuses) = 0 or ws.status = any(statuses))
      and (params.q = '' or ws.hanzi like '%' || params.q || '%' or h.word_id is not null)
  ),
  page as (
    select m.* from m
    order by m.rank, m.hsk_level nulls last, char_length(m.hanzi), m.hanzi
    limit greatest(1, least(coalesce(lim, 40), 500))
  )
  select jsonb_build_object(
    'total', (select count(*) from m),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', page.id, 'hanzi', page.hanzi, 'hsk', page.hsk_level, 'status', page.status,
        'senses', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', se.id, 'pinyin', se.pinyin, 'category', coalesce(se.category, ''),
            'meaningEs', coalesce(se.meaning_es, ''), 'meaningEn', coalesce(se.meaning_en, ''),
            'sentences', coalesce(c.n, 0)) order by se.position)
          from public.senses se left join counts c on c.sense_id = se.id
          where se.word_id = page.id
        ), '[]'::jsonb)
      ) order by page.rank, page.hsk_level nulls last, char_length(page.hanzi), page.hanzi)
      from page
    ), '[]'::jsonb),
    'levels', (select coalesce(jsonb_object_agg(l, c), '{}'::jsonb) from (select hsk_level as l, count(*) as c from ws where hsk_level is not null group by hsk_level) x),
    'statuses', (select coalesce(jsonb_object_agg(s, c), '{}'::jsonb) from (select status as s, count(*) as c from ws group by status) y)
  );
$$;

revoke all on function public.search_words(text, int[], text[], int) from public, anon;
grant execute on function public.search_words(text, int[], text[], int) to authenticated, service_role;
grant execute on function public.plain_pinyin(text) to authenticated, service_role;
