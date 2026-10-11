-- Vistas reales de admin y docente (sustituyen al prototipo de /prototipo).
-- Depende de la gobernanza (20261011000000: teacher_examples, rol admin) y de
-- colecciones (20261011010000: collections, is_admin()).

-- ── Frases de la docente ────────────────────────────────────────────────
-- Una frase propia puede partir de una original ("editar una copia"): en sus
-- clases la sustituye. review_note: lo que contesta el admin al rechazarla.
alter table teacher_examples
  add column based_on_sentence_id uuid references sentences on delete set null,
  add column review_note text;

-- Si el admin borra la frase en la que se convirtió una sugerencia aceptada,
-- promoted_sentence_id pasa a null; el check original lo impedía.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'teacher_examples'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%promoted_sentence_id%'
  loop
    execute format('alter table teacher_examples drop constraint %I', c);
  end loop;
end $$;

-- La docente edita, retira o borra sus frases mientras no estén aceptadas
-- (una rechazada sigue siendo suya y puede corregirla y volver a enviarla).
drop policy if exists "docentes editan borradores" on teacher_examples;
create policy "docentes editan sus frases" on teacher_examples
  for update to authenticated
  using (teacher_id = auth.uid() and status <> 'accepted')
  with check (teacher_id = auth.uid() and status in ('draft', 'submitted'));
drop policy if exists "docentes eliminan borradores" on teacher_examples;
create policy "docentes eliminan sus frases" on teacher_examples
  for delete to authenticated
  using (teacher_id = auth.uid() and status <> 'accepted');

-- Frases originales que una docente no quiere en sus clases.
create table teacher_hidden_sentences (
  teacher_id uuid not null references profiles on delete cascade default auth.uid(),
  sentence_id uuid not null references sentences on delete cascade,
  primary key (teacher_id, sentence_id)
);
alter table teacher_hidden_sentences enable row level security;
create policy "mis frases ocultas" on teacher_hidden_sentences
  for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- El admin ve quién sugiere cada frase.
create policy "admin lee perfiles" on profiles for select to authenticated using (is_admin());

-- ── Base común: solo admin borra ────────────────────────────────────────
create policy "admin borra palabras" on words for delete to authenticated using (is_admin());
create policy "admin borra sentidos" on senses for delete to authenticated using (is_admin());
create policy "admin borra frases" on sentences for delete to authenticated using (is_admin());

-- ── Guardar una palabra entera (editor del admin) ───────────────────────
-- p = { id, hsk_level, cultural_note_es, cultural_note_en, status,
--       senses: [{ id?, pinyin, category, meaning_es, meaning_en, nuance_es,
--                  nuance_en, sentences: [{ id?, zh, pinyin, translation_es,
--                  translation_en }] }] }
-- El orden del arreglo es el orden de enseñanza. Lo que no viene se borra
-- (falla si un sentido está en lecciones o valoraciones: se avisa arriba).
-- security invoker: las políticas de RLS siguen mandando.
create function save_word(p jsonb)
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
    update sentences set position = position + 1000 where sense_id = s_id;
    t_pos := 0;
    for t in select * from jsonb_array_elements(s -> 'sentences') loop
      continue when trim(coalesce(t ->> 'zh', '')) = '';
      t_pos := t_pos + 1;
      if t ->> 'id' is null then
        insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
        values (
          s_id, t_pos, trim(t ->> 'zh'), coalesce(trim(t ->> 'pinyin'), ''),
          nullif(trim(t ->> 'translation_es'), ''), nullif(trim(t ->> 'translation_en'), ''), 'person'
        );
      else
        update sentences set
          position = t_pos,
          zh = trim(t ->> 'zh'),
          pinyin = coalesce(trim(t ->> 'pinyin'), ''),
          translation_es = nullif(trim(t ->> 'translation_es'), ''),
          translation_en = nullif(trim(t ->> 'translation_en'), '')
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

-- Publicar / pasar a borrador desde la tabla del admin.
create function set_word_status(word uuid, new_status review_status)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Solo admin edita la base común';
  end if;
  update words set
    status = new_status,
    reviewed_by = case when new_status = 'unreviewed' then null else auth.uid() end,
    reviewed_at = case when new_status = 'unreviewed' then null else now() end
  where id = word;
  if new_status <> 'unreviewed' then
    update senses set status = 'reviewed', reviewed_by = auth.uid(), reviewed_at = now()
    where word_id = word and status = 'unreviewed';
    update sentences set status = 'reviewed', reviewed_by = auth.uid(), reviewed_at = now()
    where sense_id in (select id from senses where word_id = word) and status = 'unreviewed';
  end if;
end;
$$;

-- ── Aceptar una sugerencia ──────────────────────────────────────────────
-- replace_original: si la frase partía de una original, la reemplaza (queda
-- en revisions el texto anterior); si no, se añade como frase nueva.
create function accept_teacher_example(example_id uuid, replace_original boolean)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  e teacher_examples;
  old_zh text;
  new_id uuid;
begin
  if not is_admin() then
    raise exception 'Solo admin acepta sugerencias';
  end if;
  select * into e from teacher_examples where id = example_id and status = 'submitted' for update;
  if not found then
    raise exception 'La sugerencia ya no está pendiente';
  end if;
  if coalesce(trim(e.pinyin), '') = '' then
    raise exception 'La frase no tiene pinyin';
  end if;

  if replace_original and e.based_on_sentence_id is not null then
    select zh into old_zh from sentences where id = e.based_on_sentence_id;
    update sentences set
      zh = e.zh, pinyin = e.pinyin,
      translation_es = coalesce(e.translation_es, translation_es),
      translation_en = coalesce(e.translation_en, translation_en),
      origin = 'person', status = 'corrected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = e.based_on_sentence_id
    returning id into new_id;
    if new_id is not null then
      insert into revisions (entity, entity_id, field, old_value, new_value, author)
      values ('sentences', new_id, 'zh', old_zh, e.zh, auth.uid());
    end if;
  end if;

  if new_id is null then
    insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin, status, reviewed_by, reviewed_at)
    values (
      e.sense_id,
      coalesce((select max(position) from sentences where sense_id = e.sense_id), 0) + 1,
      e.zh, e.pinyin, e.translation_es, e.translation_en, 'person', 'reviewed', auth.uid(), now()
    )
    returning id into new_id;
  end if;

  update teacher_examples set
    status = 'accepted', promoted_sentence_id = new_id, review_note = null,
    reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = example_id;
  return new_id;
end;
$$;

-- ── Plantillas HSK 1–3 ──────────────────────────────────────────────────
-- Una por nivel del temario HSK 3.0, en lecciones de 15 entradas en el orden
-- oficial. Cada ítem es el sentido exacto de la entrada (点 clasificador y 点
-- verbo son ítems distintos). Si ya existe una plantilla con ese nombre, no
-- se toca.
do $$
declare
  lvl int;
  col uuid;
  les uuid;
  n int;
  k int;
begin
  for lvl in 1..3 loop
    continue when exists (select 1 from collections where owner_id is null and title = 'HSK ' || lvl);
    insert into collections (owner_id, title, source_note)
    values (null, 'HSK ' || lvl, 'Temario oficial HSK 3.0, nivel ' || lvl || ', en lecciones de 15 palabras')
    returning id into col;

    select count(*) into n from word_levels
    where standard = 'hsk-3.0' and level = lvl and sense_id is not null;
    for k in 1..ceil(n / 15.0)::int loop
      insert into lessons (teacher_id, collection_id, title, position)
      values (null, col, 'HSK ' || lvl || ' · ' || k, k)
      returning id into les;
      insert into lesson_items (lesson_id, sense_id, position)
      select les, sense_id, row_number() over (order by source_order)
      from (
        select sense_id, source_order from word_levels
        where standard = 'hsk-3.0' and level = lvl and sense_id is not null
        order by source_order
        offset (k - 1) * 15 limit 15
      ) chunk
      on conflict do nothing;
    end loop;
  end loop;
end $$;
