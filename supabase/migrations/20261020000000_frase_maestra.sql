-- Frase maestra: la que el admin marca con una estrella en cada sentido.
-- Sale siempre en clase (la rotación la incluye primero) y la tarjeta la
-- señala. Como mucho una por sentido. Decisión de Ever (2026-10-20).

alter table public.sentences add column is_master boolean not null default false;
create unique index sentences_one_master_per_sense on public.sentences (sense_id) where is_master;

-- save_word guarda la estrella (el orden ya lo guardaba: posición = orden recibido).
create or replace function save_word(p jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  w_id uuid := (p ->> 'id')::uuid;
  new_status review_status := coalesce((p ->> 'status')::review_status, 'unreviewed');
  s jsonb;
  t jsonb;
  s_id uuid;
  s_pos int := 0;
  t_pos int;
begin
  if not is_admin() then
    raise exception 'Solo admin edita la base común';
  end if;

  update words set
    hsk_level = nullif(p ->> 'hsk_level', '')::smallint,
    cultural_note_es = nullif(trim(p ->> 'cultural_note_es'), ''),
    cultural_note_en = nullif(trim(p ->> 'cultural_note_en'), ''),
    status = new_status,
    reviewed_by = case when new_status = 'unreviewed' then null else auth.uid() end,
    reviewed_at = case when new_status = 'unreviewed' then null else now() end
  where id = w_id;
  if not found then
    raise exception 'Palabra no encontrada';
  end if;

  delete from senses
  where word_id = w_id
    and id not in (
      select (x ->> 'id')::uuid from jsonb_array_elements(p -> 'senses') x where x ->> 'id' is not null
    );
  -- Aparta las posiciones para reordenar sin chocar con unique(word_id, position).
  update senses set position = position + 1000 where word_id = w_id;

  for s in select * from jsonb_array_elements(p -> 'senses') loop
    s_pos := s_pos + 1;
    if s ->> 'id' is null then
      insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
      values (
        w_id, s_pos, coalesce(s ->> 'pinyin', ''), nullif(s ->> 'category', ''),
        nullif(trim(s ->> 'meaning_es'), ''), nullif(trim(s ->> 'meaning_en'), ''),
        nullif(trim(s ->> 'nuance_es'), ''), nullif(trim(s ->> 'nuance_en'), ''), 'person'
      )
      returning id into s_id;
    else
      s_id := (s ->> 'id')::uuid;
      update senses set
        position = s_pos,
        pinyin = coalesce(s ->> 'pinyin', ''),
        category = nullif(s ->> 'category', ''),
        meaning_es = nullif(trim(s ->> 'meaning_es'), ''),
        meaning_en = nullif(trim(s ->> 'meaning_en'), ''),
        nuance_es = nullif(trim(s ->> 'nuance_es'), ''),
        nuance_en = nullif(trim(s ->> 'nuance_en'), '')
      where id = s_id and word_id = w_id;
      if not found then
        raise exception 'Sentido no encontrado';
      end if;
    end if;

    -- Frases: las vacías se descartan (y si existían, se borran).
    delete from sentences
    where sense_id = s_id
      and id not in (
        select (x ->> 'id')::uuid from jsonb_array_elements(s -> 'sentences') x
        where x ->> 'id' is not null and trim(coalesce(x ->> 'zh', '')) <> ''
      );
    -- La estrella se reasigna desde cero: así nunca hay dos maestras a la vez
    -- (índice único parcial) mientras se recorren las frases.
    update sentences set position = position + 1000, is_master = false where sense_id = s_id;
    t_pos := 0;
    for t in select * from jsonb_array_elements(s -> 'sentences') loop
      continue when trim(coalesce(t ->> 'zh', '')) = '';
      t_pos := t_pos + 1;
      if t ->> 'id' is null then
        insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin, is_master)
        values (
          s_id, t_pos, trim(t ->> 'zh'), coalesce(trim(t ->> 'pinyin'), ''),
          nullif(trim(t ->> 'translation_es'), ''), nullif(trim(t ->> 'translation_en'), ''), 'person',
          coalesce((t ->> 'is_master')::boolean, false)
        );
      else
        update sentences set
          position = t_pos,
          zh = trim(t ->> 'zh'),
          pinyin = coalesce(trim(t ->> 'pinyin'), ''),
          translation_es = nullif(trim(t ->> 'translation_es'), ''),
          translation_en = nullif(trim(t ->> 'translation_en'), ''),
          is_master = coalesce((t ->> 'is_master')::boolean, false)
        where id = (t ->> 'id')::uuid and sense_id = s_id;
      end if;
    end loop;
  end loop;

  -- Publicar la palabra marca como revisado lo que ella contiene.
  if new_status <> 'unreviewed' then
    perform set_word_status(w_id, new_status);
  end if;
end;
$$;

-- Clases compartidas y demo pública: la frase trae su estrella.
create or replace function public.lesson_payload(target uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with demo as (
    select id, title, teacher_id from public.lessons where id = target
  ),
  items as (
    select li.position, li.sense_id, w.id as word_id, w.hanzi
    from demo d
    join public.lesson_items li on li.lesson_id = d.id
    join public.senses s on s.id = li.sense_id
    join public.words w on w.id = s.word_id
  ),
  word_json as (
    select w.id as word_id, jsonb_build_object(
      'hanzi', w.hanzi,
      'hsk_level', w.hsk_level,
      'cultural_note_es', w.cultural_note_es,
      'cultural_note_en', w.cultural_note_en,
      'senses', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', s.id, 'position', s.position, 'pinyin', s.pinyin, 'category', s.category,
          'meaning_es', s.meaning_es, 'meaning_en', s.meaning_en,
          'nuance_es', s.nuance_es, 'nuance_en', s.nuance_en,
          'sentences', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', t.id, 'position', t.position, 'zh', t.zh, 'pinyin', t.pinyin,
              'translation_es', t.translation_es, 'translation_en', t.translation_en,
              'status', t.status, 'is_master', t.is_master) order by t.position)
            from public.sentences t where t.sense_id = s.id), '[]'::jsonb)
        ) order by s.position)
        from public.senses s where s.word_id = w.id), '[]'::jsonb)
    ) as word
    from public.words w where w.id in (select word_id from items)
  ),
  texts as (
    select unnest(array[w.cultural_note_es, w.cultural_note_en]) as t
    from public.words w where w.id in (select word_id from items)
    union all
    select unnest(array[s.nuance_es, s.nuance_en])
    from public.senses s where s.word_id in (select word_id from items)
  ),
  runs as (
    select (regexp_matches(t, '[㐀-䶿一-鿿]+', 'g'))[1] as r from texts where t is not null
  ),
  pieces as (
    select distinct substr(r, i, l) as p
    from runs, generate_series(1, char_length(r)) as i, generate_series(1, 4) as l
    where i + l - 1 <= char_length(r)
  ),
  needed_chars as (
    select ch from items, regexp_split_to_table(hanzi, '') as ch
    union
    select p from pieces where char_length(p) = 1
  )
  select case when not exists (select 1 from demo) then null else jsonb_build_object(
    'title', (select title from demo),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('sense_id', i.sense_id, 'word', wj.word) order by i.position)
      from items i join word_json wj on wj.word_id = i.word_id), '[]'::jsonb),
    'characters', coalesce((
      select jsonb_agg(jsonb_build_object(
        'char', c.char, 'pinyin', c.pinyin, 'radical', c.radical, 'decomposition', c.decomposition,
        'components', c.components, 'etymology', c.etymology, 'stroke_roles', c.stroke_roles))
      from public.characters c where c.char in (select ch from needed_chars)), '[]'::jsonb),
    'note_words', coalesce((
      select jsonb_agg(jsonb_build_object(
        'hanzi', w.hanzi,
        'senses', (select jsonb_agg(jsonb_build_object(
            'position', s.position, 'pinyin', s.pinyin, 'meaning_es', s.meaning_es, 'meaning_en', s.meaning_en))
          from public.senses s where s.word_id = w.id)))
      from public.words w where w.hanzi in (select p from pieces)), '[]'::jsonb),
    -- Lo que puso la profesora: sus frases (nuevas o copias editadas de una
    -- original) y las originales que ocultó. src/lib/lessons.ts las combina
    -- igual que en sus clases.
    'own_examples', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'sense_id', e.sense_id, 'zh', e.zh, 'pinyin', e.pinyin,
        'translation_es', e.translation_es, 'translation_en', e.translation_en,
        'based_on_sentence_id', e.based_on_sentence_id, 'created_at', e.created_at) order by e.created_at)
      from public.teacher_examples e
      where e.teacher_id = (select teacher_id from demo)
        and e.status <> 'accepted'
        and e.sense_id in (select sense_id from items)), '[]'::jsonb),
    'hidden', coalesce((
      select jsonb_agg(h.sentence_id) from public.teacher_hidden_sentences h
      where h.teacher_id = (select teacher_id from demo)), '[]'::jsonb)
  ) end;
$$;

-- create or replace conserva los permisos; se repite el cierre por si acaso.
revoke execute on function public.lesson_payload(uuid) from anon, authenticated;
