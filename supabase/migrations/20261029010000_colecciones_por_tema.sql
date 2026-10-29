-- Plantillas de estudio por tema concreto: animales, deportes, profesiones,
-- comidas y familia. Listas manuales sobre el temario HSK 3.0 niveles 1–3
-- (las palabras de HSK 4+ aún no tienen frases curadas y por eso no entran).
--
-- Cada colección con owner_id null es una plantilla que la docente copia con
-- un clic (copy_collection). No duplica vocabulario: los ítems apuntan a los
-- sentidos que ya existen, con sus frases curadas. Una palabra puede estar en
-- varias plantillas (鱼 está en Animales y en Comidas).
--
-- Se dejaron fuera a propósito 打 y 面: tienen dos sentidos y uno sin frases.
--
-- Portable: el sentido se resuelve por words->senses (position 1), sin UUIDs
-- fijos. Idempotente: si la plantilla existe (mismo título, sin dueño), no se
-- toca. Una palabra que no exista en la base se omite.

do $$
declare
  spec record;
  col uuid;
  les uuid;
begin
  for spec in
    select * from (values
      ('Animales',
       'Animales comunes: de casa, de granja y en general.',
       array['动物', '猫', '狗', '鸟', '鱼', '马', '牛', '羊', '鸡']::text[]),
      ('Deportes',
       'Deportes y acciones para hacerlos.',
       array['运动', '足球', '篮球', '网球', '羽毛球', '游泳', '跑步', '锻炼', '比赛', '踢', '骑', '跑', '跳']::text[]),
      ('Profesiones',
       'Oficios y profesiones del temario inicial; las de HSK 4+ se añaden cuando tengan frases.',
       array['老师', '学生', '医生', '司机', '经理', '画家', '运动员']::text[]),
      ('Comidas',
       'Alimentos y bebidas.',
       array['米饭', '面包', '鸡蛋', '牛奶', '水', '茶', '咖啡', '苹果', '水果', '肉', '鱼', '饺子', '菜', '饭',
             '早饭', '午饭', '晚饭', '啤酒', '西瓜', '香蕉', '蛋糕', '糖', '饮料', '米']::text[]),
      ('Familia',
       'Parientes y la casa: padres, hermanos, abuelos, hijos, esposos.',
       array['家', '家人', '爸爸', '妈妈', '爷爷', '奶奶', '哥哥', '姐姐', '弟弟', '妹妹', '姐妹',
             '儿子', '女儿', '孩子', '丈夫', '妻子', '叔叔', '阿姨']::text[])
    ) as t(title, note, hanzi)
  loop
    if exists (select 1 from collections where owner_id is null and title = spec.title) then
      continue;
    end if;
    insert into collections (owner_id, title, source_note)
    values (null, spec.title,
            'Lista manual por tema, sobre el temario HSK 3.0 (niveles 1–3). ' || spec.note
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
