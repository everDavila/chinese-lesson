-- Plantillas de estudio por función, a la manera en que se enseña el inglés
-- (adverbs of frequency, degree, likes and dislikes, opinions, time).
-- A diferencia de 20261028000000 (que agrupa por la categoría del temario),
-- aquí el criterio es el significado: son listas manuales, y una colección
-- puede mezclar categorías (nombres, adverbios, verbos) y niveles HSK.
--
-- Cada colección con owner_id null es una plantilla que la docente copia con
-- un clic (copy_collection). No duplica vocabulario: los ítems apuntan a los
-- sentidos que ya existen, con sus frases curadas.
--
-- Portable: el sentido se resuelve por words->senses (position 1), sin UUIDs
-- fijos. Todas estas palabras tienen un solo sentido. Idempotente: si la
-- plantilla existe (mismo título, sin dueño), no se toca. Una palabra que no
-- exista en la base se omite.

do $$
declare
  spec record;
  col uuid;
  les uuid;
begin
  for spec in
    select * from (values
      ('Frecuencia',
       'Adverbs of frequency: con qué frecuencia ocurre algo.',
       array['经常', '有时', '总是', '常常', '一直']::text[]),
      ('Grado',
       'Very, too, most: cuánto, en qué medida.',
       array['很', '非常', '太', '真', '最', '有点儿', '更']::text[]),
      ('Gustos y preferencias',
       'Likes and wants: gustar, amar, querer, esperar.',
       array['喜欢', '爱', '想', '希望', '愿意', '喜爱']::text[]),
      ('Opiniones y acuerdo',
       'Opinions and agreement: creer, estar de acuerdo, tener razón, probabilidad.',
       array['觉得', '认为', '同意', '对', '错', '可能', '一定', '好像']::text[]),
      ('Tiempo',
       'Time words: cuándo ocurre algo y en qué momento de la acción.',
       array['今天', '明天', '昨天', '现在', '以前', '以后', '然后', '已经', '正在', '刚', '再']::text[])
    ) as t(title, note, hanzi)
  loop
    if exists (select 1 from collections where owner_id is null and title = spec.title) then
      continue;
    end if;
    insert into collections (owner_id, title, source_note)
    values (null, spec.title,
            'Lista manual por función, sobre el temario HSK 3.0 (niveles 1–3). ' || spec.note
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
