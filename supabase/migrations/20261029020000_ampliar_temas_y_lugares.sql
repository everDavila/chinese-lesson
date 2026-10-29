-- Amplía las plantillas por tema más allá de HSK 3 y crea "Países y ciudades".
--
-- 1. Añade una lección "Ampliación" a Animales, Deportes, Profesiones, Comidas
--    y Familia (creadas en 20261029010000) con vocabulario de HSK 4+ y de las
--    palabras extra sin nivel. Va en lección aparte porque esas palabras aún no
--    tienen frases curadas: la tarjeta muestra hanzi, pinyin y significado.
-- 2. Crea "Países y ciudades": vocabulario HSK 1–3, ampliación HSK 4+ y dos
--    lecciones con los países y las ciudades de contenido/palabras-extra-
--    2026-10-29.json (sin nivel, con frases generadas y sin revisar).
--
-- ORDEN EN CADA BASE: primero cargar las palabras extra
--   node --env-file=<env> scripts/cargar-palabras-extra.mjs \
--     contenido/palabras-extra-2026-10-29.json --apply
-- y después aplicar esta migración. Si las palabras no existen, las lecciones
-- Países y Ciudades quedan sin ítems y se descartan (y como la migración queda
-- registrada, no se recrean sola).
--
-- Portable e idempotente: el sentido se resuelve por words->senses (position 1)
-- sin UUIDs fijos; si la lección ya existe en la colección, no se toca; una
-- palabra que no exista se omite; la lección sin ítems se borra.

do $$
declare
  spec record;
  col uuid;
  les uuid;
  pos int;
begin
  for spec in
    select * from (values
      (1, 'Animales', 'Ampliación',
       array['熊', '老虎', '蝴蝶', '蛇', '鸭子', '兔子', '猴子', '大象', '猪', '龙', '昆虫', '虫子', '宠物',
             '乌龟', '狼', '蚂蚁', '蜜蜂', '狮子', '老鼠', '海豚', '鹅', '鸽子', '鹿', '蚊子', '狐狸', '鲸',
             '家禽', '牲畜', '野兽', '大雁']::text[]),
      (2, 'Deportes', 'Ampliación',
       array['乒乓球', '健身', '健身房', '排球', '滑冰', '滑雪', '棒球', '赢', '输', '教练', '队', '队长',
             '队员', '球队', '球迷', '选手', '冠军', '训练', '体操', '金牌', '银牌', '铜牌', '奖牌', '竞赛',
             '拳击', '举重', '摔跤', '攀登', '夺冠', '上半场', '下半场', '兴奋剂', '打篮球', '踢足球']::text[]),
      (3, 'Profesiones', 'Ampliación',
       array['护士', '警察', '律师', '工程师', '记者', '演员', '歌手', '厨师', '作家', '翻译', '教授', '农民',
             '秘书', '老板', '工人', '教师', '大夫', '师傅', '交警', '售票员', '导演', '商人', '公务员',
             '飞行员', '法官', '士兵', '军人', '裁判', '保安', '总裁', '主任', '员工', '职工', '官员', '干部',
             '艺人', '职业']::text[]),
      (4, 'Comidas', 'Ampliación',
       array['蔬菜', '果汁', '盐', '豆腐', '汤', '巧克力', '食品', '食物', '饼干', '油', '西红柿', '番茄',
             '橙子', '葡萄', '葡萄酒', '白酒', '汽水', '豆浆', '土豆', '大米', '主食', '月饼', '汤圆', '雪糕',
             '醋', '早餐', '午餐', '晚餐', '快餐', '西餐', '中餐', '美食', '盒饭', '年夜饭', '粮食']::text[]),
      (5, 'Familia', 'Ampliación',
       array['家庭', '家长', '父亲', '母亲', '父母', '兄弟', '亲戚', '孙子', '孙女', '孙女儿', '太太', '老婆',
             '老公', '外公', '外婆', '姥姥', '姥爷', '姑姑', '舅舅', '姨', '侄子', '外甥', '婴儿', '夫妇',
             '子女', '儿女', '家族', '亲人', '亲属', '家属']::text[]),
      (6, 'Países y ciudades', 'Vocabulario',
       array['中国', '外国', '国家', '城市', '世界']::text[]),
      (7, 'Países y ciudades', 'Ampliación',
       array['首都', '亚洲', '欧洲', '非洲', '南美洲', '北美洲', '大洋洲', '省会', '家乡', '老家', '国籍',
             '岛', '都市', '国旗', '城镇', '港口', '联合国']::text[]),
      (8, 'Países y ciudades', 'Países',
       array['美国', '日本', '韩国', '英国', '法国', '德国', '意大利', '俄罗斯', '印度', '加拿大', '澳大利亚',
             '巴西', '墨西哥', '秘鲁', '阿根廷', '智利', '哥伦比亚', '西班牙', '泰国']::text[]),
      (9, 'Países y ciudades', 'Ciudades',
       array['北京', '上海', '广州', '香港', '台北', '东京', '首尔', '伦敦', '巴黎', '纽约', '利马', '马德里',
             '罗马', '莫斯科', '柏林', '悉尼']::text[])
    ) as t(ord, ctitle, ltitle, hanzi)
    order by ord
  loop
    col := null;
    select id into col from collections where owner_id is null and title = spec.ctitle;
    if col is null then
      -- Solo "Países y ciudades" se crea aquí; las otras vienen de 20261029010000.
      if spec.ctitle <> 'Países y ciudades' then
        continue;
      end if;
      insert into collections (owner_id, title, source_note)
      values (null, spec.ctitle,
              'Lista manual por tema: vocabulario HSK 1–3 y su ampliación, más países y ciudades que el temario no incluye (sin nivel, con frases generadas y sin revisar).')
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
end $$;
