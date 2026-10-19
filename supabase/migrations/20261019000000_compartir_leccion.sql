-- Compartir una lección con un enlace público (2026-10-19, pedido de Ever).
--
-- La profesora genera un código secreto para su lección y comparte
-- /l/<código>: quien lo abra ve la lección en modo presentación, con todo lo
-- que ella puso (sus frases propias y sin las que ocultó), sin votación y sin
-- acceso a nada más de la base. «Dejar de compartir» borra el código y el
-- enlace muere. El armado sale de la demo pública (20261018000000), que pasa a
-- usar la misma función interna.

alter table lessons add column share_token text unique;
comment on column lessons.share_token is
  'Código del enlace público de la lección (/l/<código>); null = no compartida.';
alter table lessons add constraint lessons_share_token_check
  check (share_token is null or char_length(share_token) >= 16);

-- Armado de una lección para mostrarla sin sesión. Interna: no se concede a
-- nadie; la llaman public_demo_lesson y shared_lesson.
create function public.lesson_payload(target uuid)
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
              'status', t.status) order by t.position)
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
revoke all on function public.lesson_payload(uuid) from public;

-- La demo pública, ahora con la función común.
create or replace function public.public_demo_lesson()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.lesson_payload(id) from public.lessons where public_demo;
$$;

-- Una lección compartida, por su código. Las archivadas no se muestran.
create function public.shared_lesson(code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.lesson_payload(id) from public.lessons
  where share_token = code and archived_at is null;
$$;
revoke all on function public.shared_lesson(text) from public;
grant execute on function public.shared_lesson(text) to anon, authenticated;
