-- Plantillas de vocabulario por contexto (Cline, rama cline-temas).
-- Cada colección con owner_id null es una plantilla curada que la docente copia
-- con un clic. El vocabulario sale del temario HSK 3.0 ya cargado.
-- Portable: el sense_id se resuelve por join words->senses (position 1), sin
-- UUIDs fijos, así corre igual en dev y prod. Las frases de ejemplo las completa
-- la curación (Codex); mientras cada palabra muestra hanzi + pinyin + glosa.
-- Idempotente: si la plantilla existe, no se toca.

-- ── Comer fuera (HSK 1–3) ──────────────────────────────────────────
-- Pedir y comer en restaurante o cafetería: comidas, bebidas y fórmulas para ordenar.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Comer fuera') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Comer fuera', 'Vocabulario HSK 3.0 por contexto (nivel 1–3). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('吃', 1),
    ('喝', 2),
    ('要', 3),
    ('想', 4),
    ('给', 5),
    ('请', 6),
    ('谢谢', 7),
    ('什么', 8),
    ('多少', 9),
    ('太', 10),
    ('个', 11),
    ('位', 12),
    ('块', 13),
    ('点', 14),
    ('水', 15),
    ('茶', 16),
    ('咖啡', 17),
    ('牛奶', 18),
    ('米饭', 19),
    ('鸡蛋', 20),
    ('面包', 21),
    ('水果', 22),
    ('苹果', 23),
    ('鱼', 24),
    ('肉', 25),
    ('菜', 26),
    ('好吃', 27),
    ('饭店', 28),
    ('饭馆', 29),
    ('菜单', 30),
    ('杯子', 31),
    ('碗', 32),
    ('饱', 33),
    ('饿', 34),
    ('甜', 35),
    ('怎么', 36)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Compras (HSK 1–3) ──────────────────────────────────────────
-- Comprar y regatear: dinero, precios, clasificadores y fórmulas para elegir.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Compras') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Compras', 'Vocabulario HSK 3.0 por contexto (nivel 1–3). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('买', 1),
    ('卖', 2),
    ('要', 3),
    ('给', 4),
    ('多少', 5),
    ('几', 6),
    ('这', 7),
    ('那', 8),
    ('太', 9),
    ('什么', 10),
    ('怎么样', 11),
    ('可以', 12),
    ('商店', 13),
    ('店', 14),
    ('商场', 15),
    ('超市', 16),
    ('钱', 17),
    ('元', 18),
    ('块', 19),
    ('东西', 20),
    ('件', 21),
    ('个', 22),
    ('号', 23),
    ('贵', 24),
    ('便宜', 25),
    ('漂亮', 26),
    ('包', 27),
    ('颜色', 28),
    ('大小', 29),
    ('号码', 30),
    ('花', 31),
    ('换', 32),
    ('试', 33),
    ('用', 34),
    ('需要', 35)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Transporte (HSK 1–3) ──────────────────────────────────────────
-- Moverse y dar o pedir direcciones: vehículos, verbos de desplazamiento y ubicación.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Transporte') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Transporte', 'Vocabulario HSK 3.0 por contexto (nivel 1–3). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('去', 1),
    ('到', 2),
    ('从', 3),
    ('往', 4),
    ('坐', 5),
    ('走', 6),
    ('等', 7),
    ('请问', 8),
    ('怎么', 9),
    ('哪儿', 10),
    ('这里', 11),
    ('那里', 12),
    ('一起', 13),
    ('出租车', 14),
    ('汽车', 15),
    ('火车', 16),
    ('飞机', 17),
    ('地铁', 18),
    ('站', 19),
    ('路', 20),
    ('街', 21),
    ('路口', 22),
    ('票', 23),
    ('前', 24),
    ('后', 25),
    ('左', 26),
    ('右', 27),
    ('远', 28),
    ('近', 29),
    ('分钟', 30),
    ('小时', 31),
    ('开车', 32),
    ('停', 33)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Salud y cuerpo (HSK 1–3) ──────────────────────────────────────────
-- Ir al médico y hablar del cuerpo: síntomas, hábitos y vocabulario de bienestar.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Salud y cuerpo') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Salud y cuerpo', 'Vocabulario HSK 3.0 por contexto (nivel 1–3). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('身体', 1),
    ('医院', 2),
    ('医生', 3),
    ('病', 4),
    ('舒服', 5),
    ('累', 6),
    ('疼', 7),
    ('感冒', 8),
    ('发烧', 9),
    ('咳嗽', 10),
    ('药', 11),
    ('休息', 12),
    ('健康', 13),
    ('运动', 14),
    ('头', 15),
    ('牙', 16),
    ('肚子', 17),
    ('胖', 18),
    ('瘦', 19),
    ('锻炼', 20),
    ('跑步', 21),
    ('游泳', 22),
    ('好', 23),
    ('不', 24),
    ('太', 25),
    ('很', 26),
    ('看', 27)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Vida diaria (HSK 1–3) ──────────────────────────────────────────
-- Rutina, familia y hogar: horas, actividades cotidianas y personas cercanas.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Vida diaria') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Vida diaria', 'Vocabulario HSK 3.0 por contexto (nivel 1–3). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('家', 1),
    ('家人', 2),
    ('爸爸', 3),
    ('妈妈', 4),
    ('儿子', 5),
    ('女儿', 6),
    ('朋友', 7),
    ('同学', 8),
    ('老师', 9),
    ('今天', 10),
    ('明天', 11),
    ('昨天', 12),
    ('现在', 13),
    ('早上', 14),
    ('晚上', 15),
    ('点', 16),
    ('小时', 17),
    ('分钟', 18),
    ('星期', 19),
    ('年', 20),
    ('月', 21),
    ('日', 22),
    ('起床', 23),
    ('睡觉', 24),
    ('工作', 25),
    ('学习', 26),
    ('吃', 27),
    ('喝', 28),
    ('去', 29),
    ('来', 30),
    ('在', 31),
    ('叫', 32),
    ('岁', 33),
    ('名字', 34),
    ('电话', 35),
    ('门', 36),
    ('房间', 37),
    ('电视', 38),
    ('电脑', 39),
    ('书', 40)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Viajes (HSK 2–5) ──────────────────────────────────────────
-- Viajar con autonomía: reservas, equipaje, turismo y vocabulario de destino.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Viajes') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Viajes', 'Vocabulario HSK 3.0 por contexto (nivel 2–5). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('旅行', 1),
    ('旅游', 2),
    ('机场', 3),
    ('护照', 4),
    ('签证', 5),
    ('酒店', 6),
    ('宾馆', 7),
    ('房间', 8),
    ('行李', 9),
    ('地图', 10),
    ('出发', 11),
    ('安全', 12),
    ('假期', 13),
    ('准备', 14),
    ('附近', 15),
    ('远', 16),
    ('近', 17),
    ('坐', 18),
    ('票', 19),
    ('带', 20),
    ('穿', 21),
    ('照', 22),
    ('相机', 23),
    ('山', 24),
    ('城市', 25),
    ('国家', 26),
    ('地方', 27)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Trabajo (HSK 1–6) ──────────────────────────────────────────
-- Mundo laboral: empresa, reunión, profesión y vocabulario de carrera.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Trabajo') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Trabajo', 'Vocabulario HSK 3.0 por contexto (nivel 1–6). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('工作', 1),
    ('公司', 2),
    ('办公室', 3),
    ('会议', 4),
    ('同事', 5),
    ('上班', 6),
    ('下班', 7),
    ('忙', 8),
    ('累', 9),
    ('完成', 10),
    ('机会', 11),
    ('项目', 12),
    ('老板', 13),
    ('员工', 14),
    ('工资', 15),
    ('面试', 16),
    ('简历', 17),
    ('经验', 18),
    ('专业', 19),
    ('职业', 20),
    ('压力', 21),
    ('加班', 22),
    ('效率', 23),
    ('部门', 24),
    ('签', 25),
    ('合同', 26),
    ('任务', 27),
    ('负责', 28),
    ('能力', 29),
    ('成', 30)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Tecnología (HSK 1–6) ──────────────────────────────────────────
-- Vida digital: dispositivos, internet, apps y vocabulario técnico de uso diario.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Tecnología') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Tecnología', 'Vocabulario HSK 3.0 por contexto (nivel 1–6). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('电脑', 1),
    ('手机', 2),
    ('网络', 3),
    ('上网', 4),
    ('网站', 5),
    ('邮件', 6),
    ('照片', 7),
    ('发展', 8),
    ('影响', 9),
    ('用', 10),
    ('发', 11),
    ('软件', 12),
    ('硬件', 13),
    ('程序', 14),
    ('数据', 15),
    ('信息', 16),
    ('下载', 17),
    ('安装', 18),
    ('密码', 19),
    ('科技', 20),
    ('智能', 21),
    ('人工智能', 22),
    ('视频', 23),
    ('屏幕', 24),
    ('系统', 25),
    ('更新', 26),
    ('搜索', 27),
    ('账号', 28),
    ('链接', 29),
    ('文件', 30)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Sociedad y cultura (HSK 1–5) ──────────────────────────────────────────
-- Sociedad, historia y cultura china: instituciones, tradiciones y patrimonio.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Sociedad y cultura') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Sociedad y cultura', 'Vocabulario HSK 3.0 por contexto (nivel 1–5). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('社会', 1),
    ('文化', 2),
    ('传统', 3),
    ('历史', 4),
    ('艺术', 5),
    ('文学', 6),
    ('经济', 7),
    ('政治', 8),
    ('政府', 9),
    ('法律', 10),
    ('制度', 11),
    ('人口', 12),
    ('城市', 13),
    ('农村', 14),
    ('发展', 15),
    ('变化', 16),
    ('影响', 17),
    ('关系', 18),
    ('民族', 19),
    ('节日', 20),
    ('京剧', 21),
    ('汉字', 22),
    ('功夫', 23),
    ('古代', 24),
    ('现代', 25),
    ('著名', 26),
    ('参加', 27),
    ('价值', 28),
    ('观念', 29)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;

-- ── Medio ambiente (HSK 1–6) ──────────────────────────────────────────
-- Ecología y sostenibilidad: naturaleza, problemas ambientales y soluciones globales.
-- El sense_id se resuelve por join words->senses (position 1): portable entre
-- dev y prod, sin UUIDs fijos. Si el sentido principal no existe, se omite.
do $$
declare col uuid; les uuid;
begin
  if not exists (select 1 from collections where owner_id is null and title = 'Medio ambiente') then
    insert into collections (owner_id, title, source_note)
    values (null, 'Medio ambiente', 'Vocabulario HSK 3.0 por contexto (nivel 1–6). Las frases de ejemplo se completan en la curación.')
    returning id into col;
    insert into lessons (teacher_id, collection_id, title, position)
    values (null, col, 'Vocabulario', 1)
    returning id into les;
    insert into lesson_items (lesson_id, sense_id, position)
    select les, s.id, v.ord
    from (values
    ('环境', 1),
    ('保护', 2),
    ('污染', 3),
    ('气候', 4),
    ('能源', 5),
    ('资源', 6),
    ('自然', 7),
    ('生态', 8),
    ('绿色', 9),
    ('发展', 10),
    ('问题', 11),
    ('解决', 12),
    ('政府', 13),
    ('国际', 14),
    ('全球', 15),
    ('合作', 16),
    ('未来', 17),
    ('人类', 18),
    ('地球', 19),
    ('减少', 20),
    ('增加', 21),
    ('严重', 22),
    ('空气', 23),
    ('水', 24),
    ('树', 25),
    ('垃圾', 26),
    ('回收', 27),
    ('利用', 28),
    ('意识', 29),
    ('责任', 30)
    ) v(hz, ord)
    join words w on w.hanzi = v.hz
    join senses s on s.word_id = w.id and s.position = 1
    on conflict do nothing;
  end if;
end $$;
