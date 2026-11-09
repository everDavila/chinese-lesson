-- Plantillas de estudio por categoría gramatical y por lista corta.
-- Cada colección con owner_id null es una plantilla que la docente copia con
-- un clic (copy_collection). No duplica vocabulario: los ítems apuntan a los
-- sentidos que ya existen, con sus frases curadas.
--
-- Dos familias:
--   1. Por regla: todos los sentidos HSK 3.0 niveles 1–3 cuya
--      senses.category cae en una lista. Una lección por nivel; si el nivel
--      pasa de 25 sentidos se parte en lecciones de 25 ("HSK 3 · 2").
--   2. Por lista manual: grupos que el temario no distingue (interrogativas,
--      modales, palabras de lugar). Una sola lección "Vocabulario".
--
-- Portable: los sentidos se resuelven por categoría o por words->senses
-- (position 1), sin UUIDs fijos, así corre igual en dev y prod. Idempotente:
-- si la plantilla existe (mismo título, sin dueño), no se toca. Una palabra de
-- la lista manual que no exista en la base se omite.
-- Las plantillas "Nombres" no se crean: 425 sentidos no son un tema de estudio.

do $$
declare
  chunk_size constant int := 25;
  spec record;
  col uuid;
  les uuid;
  lvl int;
  k int;
  n int;
  pos int;
  ids uuid[];
begin
  -- ── 1. Por regla (categoría del temario) ───────────────────────────────
  for spec in
    select * from (values
      ('Pronombres',
       'Quién y qué: yo, tú, esto, qué, quién.',
       array['pronoun']::text[]),
      ('Números',
       'Contar y decir cantidades.',
       array['numeral']::text[]),
      ('Clasificadores',
       'Las palabras que acompañan a los números: 个, 本, 杯, 张.',
       array['measure word']::text[]),
      ('Partículas y conectores',
       'Las palabras que unen ideas y marcan la gramática: 的, 了, 吗, 和, 但是, 因为.',
       array['particle', 'conjunction', 'preposition']::text[]),
      ('Adverbios',
       'Cómo, cuánto y con qué frecuencia: 很, 都, 也, 常常, 已经.',
       array['adverb']::text[]),
      ('Adjetivos',
       'Describir personas, cosas y situaciones.',
       array['adjective']::text[]),
      ('Verbos',
       'Lo que se hace, se tiene o se quiere: los verbos del temario.',
       array['verb']::text[])
    ) as t(title, note, cats)
  loop
    if exists (select 1 from collections where owner_id is null and title = spec.title) then
      continue;
    end if;
    insert into collections (owner_id, title, source_note)
    values (null, spec.title,
            'Generada por regla desde la categoría del temario HSK 3.0 (niveles 1–3). ' || spec.note
            || ' Las frases de ejemplo son las ya curadas de cada sentido.')
    returning id into col;

    pos := 0;
    for lvl in 1..3 loop
      select coalesce(array_agg(q.sid order by q.ord nulls last, q.sid), '{}')
        into ids
      from (
        select s.id as sid, min(wl.source_order) as ord
        from word_levels wl
        join senses s on s.id = wl.sense_id
        where wl.standard = 'hsk-3.0' and wl.level = lvl and s.category = any (spec.cats)
        group by s.id
      ) q;
      n := coalesce(array_length(ids, 1), 0);
      continue when n = 0;

      for k in 0..((n - 1) / chunk_size) loop
        pos := pos + 1;
        insert into lessons (teacher_id, collection_id, title, position)
        values (null, col,
                'HSK ' || lvl || case when n > chunk_size then ' · ' || (k + 1) else '' end,
                pos)
        returning id into les;
        insert into lesson_items (lesson_id, sense_id, position)
        select les, u.sid, u.o::smallint
        from unnest(ids[k * chunk_size + 1 : k * chunk_size + chunk_size]) with ordinality as u(sid, o)
        on conflict do nothing;
      end loop;
    end loop;

    -- Una categoría sin sentidos en HSK 1–3 no deja una colección vacía.
    if pos = 0 then
      delete from collections where id = col;
    end if;
  end loop;

  -- ── 2. Por lista manual (lo que el temario no distingue) ───────────────
  for spec in
    select * from (values
      ('Palabras interrogativas',
       'Preguntar: qué, quién, dónde, cómo, cuánto, por qué.',
       array['什么', '谁', '哪', '哪儿', '哪里', '怎么', '怎么样', '几', '多少', '为什么', '吗', '呢']::text[]),
      ('Verbos modales',
       'Poder, deber y querer: 会, 能, 可以, 应该, 要, 想.',
       array['会', '能', '可以', '应该', '要', '想', '必须', '需要', '愿意', '可能']::text[]),
      ('Lugar y dirección',
       'Dónde está algo y hacia dónde va: 上, 下, 里, 外, 前, 后, 左, 右.',
       array['上', '下', '里', '外', '前', '后', '左', '右', '旁边', '中间', '东', '南', '西', '北',
             '上面', '下面', '里面', '外面', '前面', '后面', '左边', '右边', '对面', '附近']::text[])
    ) as t(title, note, hanzi)
  loop
    if exists (select 1 from collections where owner_id is null and title = spec.title) then
      continue;
    end if;
    insert into collections (owner_id, title, source_note)
    values (null, spec.title,
            'Lista manual sobre el temario HSK 3.0 (niveles 1–3). ' || spec.note
            || ' Las frases de ejemplo son las ya curadas de cada sentido.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, x.sid, (row_number() over (order by x.ord))::smallint
    from (
      select distinct on (s.id) s.id as sid, u.ord
      from unnest(spec.hanzi) with ordinality as u(hz, ord)
      join words w on w.hanzi = u.hz
      join senses s on s.word_id = w.id and s.position = 1
      order by s.id, u.ord
    ) x
    on conflict do nothing;

    if not found then
      delete from collections where id = col;
    end if;
  end loop;
end $$;
