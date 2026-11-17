-- Plantillas de estudio «Frutas» y «Colores».
-- Siguen el patrón de 20261029010000_colecciones_por_tema y de la ampliación de
-- 20261029020000: una lección «Vocabulario» con el temario HSK 1–3 (frases ya
-- curadas) y una lección «Ampliación» con HSK 4+ (aún sin frases curadas: la
-- tarjeta muestra hanzi, pinyin y significado).
--
-- Las listas son una propuesta, sin revisar por la docente. Las frutas y colores
-- que el catálogo no trae (草莓, 柠檬, 芒果, 菠萝, 樱桃, 荔枝, 蓝色, 紫色, 粉色,
-- 橙色, 金色, 银色) salen de contenido/palabras-extra-2026-11-16.json: cargarlo
-- ANTES de esta migración con scripts/cargar-palabras-extra.mjs --apply.
--
-- Portable: el sentido se resuelve por words->senses (position 1), sin UUIDs
-- fijos. Idempotente: si la colección o la lección ya existen, no se tocan.

do $$
declare
  spec record;
  col uuid;
  les uuid;
  pos int;
begin
  for spec in
    select * from (values
      (1, 'Frutas', 'Frutas y similares: de la fruta en general a las más comunes.', 'Vocabulario',
       array['水果', '苹果', '香蕉', '西瓜']::text[]),
      (2, 'Frutas', null, 'Ampliación',
       array['草莓', '柠檬', '芒果', '菠萝', '樱桃', '荔枝', '葡萄', '橙子', '橘子', '梨', '桃', '椰子', '柿子']::text[]),
      (3, 'Colores', 'Nombres de colores, en su forma con 色 y suelta.', 'Vocabulario',
       array['颜色', '红色', '黄色', '蓝色', '蓝', '绿色', '白色', '黑色']::text[]),
      (4, 'Colores', null, 'Ampliación',
       array['红', '黄', '白', '黑', '紫色', '紫', '粉色', '粉', '橙色', '金色', '银色', '银', '灰', '灰色', '棕色', '彩色']::text[])
    ) as t(ord, ctitle, note, ltitle, hanzi)
    order by ord
  loop
    col := null;
    select id into col from collections where owner_id is null and title = spec.ctitle;
    if col is null then
      insert into collections (owner_id, title, source_note)
      values (null, spec.ctitle,
              'Lista manual por tema, sobre el temario HSK 3.0. ' || spec.note
              || ' Las frases de ejemplo son las ya curadas de cada sentido.')
      returning id into col;
    end if;

    if exists (select 1 from lessons where collection_id = col and title = spec.ltitle) then
      continue;
    end if;

    select coalesce(max(position), 0) + 1 into pos from lessons where collection_id = col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, spec.ltitle, pos)
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
      delete from lessons where id = les;
    end if;
  end loop;

  -- Si una colección quedó sin lecciones (ninguna palabra existía), se descarta.
  delete from collections c
  where c.owner_id is null and c.title in ('Frutas', 'Colores')
    and not exists (select 1 from lessons l where l.collection_id = c.id);
end $$;
