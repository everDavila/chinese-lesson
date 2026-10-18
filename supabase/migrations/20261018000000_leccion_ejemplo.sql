-- Lección de ejemplo (2026-10-18, decisión de Ever).
--
-- Una sola lección de demo, en la base: la original es una lección suelta del
-- admin marcada `public_demo`; la demo pública (/present, sin login) la lee por
-- una función `security definer` que devuelve solo esa lección, sin abrir el
-- catálogo a anon (mismo criterio que la votación de alumnos). Cada docente
-- recibe una copia suelta suya, una sola vez: si la borra no vuelve.
-- Sustituye a contenido/leccion-demo.json como fuente de la demo.

alter table lessons add column public_demo boolean not null default false;
comment on column lessons.public_demo is
  'La lección de ejemplo original: la muestra la demo pública y se copia a cada docente.';
create unique index lessons_one_public_demo on lessons (public_demo) where public_demo;
-- La original es del admin y nunca rápida (ni de colección).
alter table lessons add constraint lessons_public_demo_loose_check
  check (not public_demo or (collection_id is null and teacher_id is not null and not quick));

alter table profiles add column example_lesson_at timestamptz;
comment on column profiles.example_lesson_at is
  'Cuándo recibió su copia de la lección de ejemplo; con fecha no se vuelve a dar.';

-- ── La original: las palabras de la antigua demo local, primer sentido ──
do $$
declare
  admin_id uuid;
  demo_id uuid;
  hz text[] := array['家', '东西', '认识', '知道', '了解', '意思', '觉得', '关心', '习惯', '文化'];
begin
  select id into admin_id from public.profiles where role = 'admin' order by created_at limit 1;
  if admin_id is null or exists (select 1 from public.lessons where public_demo) then
    return;
  end if;
  -- Sin todas las palabras (base nueva o de pruebas) no se crea a medias.
  if (select count(*) from public.words w
        join public.senses s on s.word_id = w.id and s.position = 1
      where w.hanzi = any (hz)) < array_length(hz, 1) then
    return;
  end if;
  insert into public.lessons (teacher_id, title, public_demo)
  values (admin_id, 'Lección de ejemplo', true)
  returning id into demo_id;
  insert into public.lesson_items (lesson_id, sense_id, position)
  select demo_id, s.id, t.ord
  from unnest(hz) with ordinality as t(h, ord)
  join public.words w on w.hanzi = t.h
  join public.senses s on s.word_id = w.id and s.position = 1;
end;
$$;

-- ── Copia para una docente, una sola vez ────────────────────────────────
create function public.give_example_lesson(teacher uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  demo record;
  new_id uuid;
begin
  select id, title, examples_shown into demo from public.lessons where public_demo;
  if not found then
    return null;
  end if;
  -- Marca primero: si ya la recibió (aunque la haya borrado), no hay copia.
  update public.profiles set example_lesson_at = now()
  where id = teacher and role = 'teacher' and example_lesson_at is null;
  if not found then
    return null;
  end if;
  insert into public.lessons (teacher_id, title, examples_shown)
  values (teacher, demo.title, demo.examples_shown)
  returning id into new_id;
  insert into public.lesson_items (lesson_id, sense_id, position)
  select new_id, sense_id, position from public.lesson_items where lesson_id = demo.id;
  return new_id;
end;
$$;
revoke all on function public.give_example_lesson(uuid) from public;

-- Las docentes nuevas la reciben al crearse su perfil.
create function public.give_example_lesson_on_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'teacher' then
    perform public.give_example_lesson(new.id);
  end if;
  return new;
end;
$$;
create trigger profiles_give_example_lesson
  after insert on profiles
  for each row execute function public.give_example_lesson_on_profile();

-- Las que ya existen, ahora.
select public.give_example_lesson(id) from public.profiles where role = 'teacher';

-- ── La demo pública ─────────────────────────────────────────────────────
-- Solo la lección de ejemplo: sus palabras con sentidos y frases, los
-- caracteres que necesita la tarjeta y las palabras que citan sus notas
-- (fragmentos chinos de hasta 4 caracteres, como en las clases reales).
create function public.public_demo_lesson()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with demo as (
    select id, title from public.lessons where public_demo
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
      from public.words w where w.hanzi in (select p from pieces)), '[]'::jsonb)
  ) end;
$$;
revoke all on function public.public_demo_lesson() from public;
grant execute on function public.public_demo_lesson() to anon, authenticated;
