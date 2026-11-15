-- Plantillas de estudio por temas de la vida diaria: clima y estaciones, ropa,
-- emociones, hogar, entretenimiento, cultura china y pictogramas. «Tecnología»
-- ya existía desde 20261012040000 (temas por contexto) y no se repite.
-- Siguen el patrón de 20261029010000_colecciones_por_tema: listas manuales sobre
-- el temario HSK 3.0 niveles 1–3, sin duplicar vocabulario (los ítems apuntan a
-- los sentidos que ya existen, con sus frases curadas). Una palabra puede estar
-- en varias plantillas (雨衣 está en Clima y en Ropa).
--
-- Las listas son una propuesta mía, sin revisar por la docente. «Pictogramas»
-- solo incluye los de la lista clara de contenido/etimologia que son palabra
-- por sí solos; se dejaron fuera 面, 子 y 又 porque su primer sentido no es el
-- del dibujo (cara, sufijo, otra vez).
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
      ('Clima y estaciones',
       'El tiempo y las cuatro estaciones.',
       array['天气', '下雨', '雨', '雪', '风', '晴', '阴', '冷', '热', '凉快', '冰', '春天', '夏天', '秋天', '冬天', '四季', '季节', '太阳', '雨衣']::text[]),
      ('Ropa',
       'Prendas y calzado, y el verbo para vestirse.',
       array['衣服', '穿', '裤子', '短裤', '裙子', '衬衫', '大衣', '上衣', '鞋', '雨衣']::text[]),
      ('Emociones',
       'Sentimientos y estados de ánimo: gustar, alegría, tristeza, miedo, enojo.',
       array['爱', '喜欢', '喜爱', '高兴', '开心', '快乐', '难过', '哭', '笑', '生气', '害怕', '怕', '着急', '放心', '关心', '不好意思', '舒服', '感到']::text[]),
      ('Hogar',
       'La casa: habitaciones, muebles, aparatos y tareas del hogar.',
       array['家', '房子', '房间', '屋子', '床', '桌子', '椅子', '沙发', '灯', '冰箱', '空调', '洗手间', '卫生间', '门', '门口', '打扫', '干净', '搬家', '邻居', '洗衣机']::text[]),
      ('Entretenimiento',
       'Cine, música, juegos, lectura y diversión.',
       array['电影', '电影院', '电视', '音乐', '歌', '唱', '跳舞', '游戏', '玩', '好玩儿', '故事', '画', '画家', '表演', '晚会', '旅游', '书', '读书']::text[]),
      ('Cultura china',
       'China, la lengua, el té, las fiestas y la historia.',
       array['中国', '汉字', '汉语', '中文', '文化', '历史', '节日', '过节', '过年', '新年', '茶', '红茶', '绿茶', '奶茶', '习惯', '字典']::text[]),
      ('Pictogramas',
       'Caracteres que nacieron como dibujos (象形). Selección propuesta, sin revisar por la docente; ver contenido/etimologia.',
       array['日', '月', '山', '水', '人', '口', '女', '手', '牛', '羊', '鱼', '鸟', '马', '雨', '门', '车', '肉', '米', '飞', '高', '角', '伞', '页']::text[])
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
