-- Generado por scripts/build-seed.mjs desde contenido/leccion-demo.json. No editar a mano.
begin;

insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('家', array['jiā']::text[], '宀', '⿱宀豕', '[{"char":"宀","role":"semantic","pinyin":"gài"},{"char":"豕","role":"phonetic","pinyin":"shǐ"}]'::jsonb, '{"type":"pictophonetic","semantic":"宀","phonetic":"豕","hint":"roof"}'::jsonb, array['semantic', 'semantic', 'semantic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('认', array['rèn']::text[], '讠', '⿰讠人', '[{"char":"讠","role":"semantic","pinyin":"yán"},{"char":"人","role":"phonetic","pinyin":"rén"}]'::jsonb, '{"type":"pictophonetic","semantic":"讠","phonetic":"人","hint":"speech"}'::jsonb, array['semantic', 'semantic', 'phonetic', 'phonetic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('识', array['shí']::text[], '讠', '⿰讠只', '[{"char":"讠","role":"semantic","pinyin":"yán"},{"char":"只","role":"phonetic","pinyin":"zhī"}]'::jsonb, '{"type":"pictophonetic","semantic":"讠","phonetic":"只","hint":"speech"}'::jsonb, array['semantic', 'semantic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('东', array['dōng']::text[], '一', '⿻七小', '[{"char":"七","role":"other","pinyin":"qī"},{"char":"小","role":"other","pinyin":"xiǎo"}]'::jsonb, '{"type":"pictographic","hint":"Simplified form of 東, the sun 日 rising behind a tree 木"}'::jsonb, array['other', 'other', 'other', 'other', 'other']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('西', array['xī']::text[], '西', '⿻兀囗', '[{"char":"兀","role":"other","pinyin":"wù"},{"char":"囗","role":"other","pinyin":"wéi"}]'::jsonb, '{"type":"pictographic","hint":"A bird settling into its nest, representing sunset; compare 東"}'::jsonb, array['other', 'other', 'other', 'other', 'other', 'other']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('知', array['zhī']::text[], '矢', '⿰矢口', '[{"char":"矢","role":"phonetic","pinyin":"shǐ"},{"char":"口","role":"semantic","pinyin":"kǒu"}]'::jsonb, '{"type":"pictophonetic","semantic":"口","phonetic":"矢","hint":"mouth"}'::jsonb, array['phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'semantic', 'semantic', 'semantic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('道', array['dào']::text[], '辶', '⿺辶首', '[{"char":"辶","role":"semantic","pinyin":"chuò"},{"char":"首","role":"phonetic","pinyin":"shǒu"}]'::jsonb, '{"type":"pictophonetic","semantic":"辶","phonetic":"首","hint":"walk"}'::jsonb, array['phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'semantic', 'semantic', 'semantic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('意', array['yì']::text[], '心', '⿱音心', '[{"char":"音","role":"phonetic","pinyin":"yīn"},{"char":"心","role":"semantic","pinyin":"xīn"}]'::jsonb, '{"type":"pictophonetic","semantic":"心","phonetic":"音","hint":"heart"}'::jsonb, array['phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'semantic', 'semantic', 'semantic', 'semantic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('思', array['sī']::text[], '心', '⿱田心', '[{"char":"田","role":"other","pinyin":"tián"},{"char":"心","role":"semantic","pinyin":"xīn"}]'::jsonb, '{"type":"ideographic","hint":"Weighing something with your mind 囟 (altered) and heart 心"}'::jsonb, array['other', 'other', 'other', 'other', 'other', 'semantic', 'semantic', 'semantic', 'semantic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('觉', array['jué']::text[], '见', '⿳⺍冖见', '[{"char":"⺍","role":"phonetic","pinyin":null},{"char":"冖","role":"other","pinyin":"mì"},{"char":"见","role":"semantic","pinyin":"jiàn"}]'::jsonb, '{"type":"pictophonetic","semantic":"见","phonetic":"⺍","hint":"see"}'::jsonb, array['phonetic', 'phonetic', 'phonetic', 'other', 'other', 'semantic', 'semantic', 'semantic', 'semantic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('得', array['dé']::text[], '彳', '⿰彳⿱旦寸', '[{"char":"彳","role":"semantic","pinyin":"chì"},{"char":"⿱旦寸","role":"other","pinyin":null}]'::jsonb, '{"type":"ideographic","hint":"A hand 寸 grabbing a shell 旦"}'::jsonb, array['semantic', 'semantic', 'semantic', 'other', 'other', 'other', 'other', 'other', 'other', 'other', 'other']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('了', array['le', 'liǎo']::text[], '亅', '⿱乛亅', '[{"char":"乛","role":"other","pinyin":"ya"},{"char":"亅","role":"semantic","pinyin":"jué"}]'::jsonb, '{"type":"pictographic","hint":"A child swaddled in blanklets; compare 子"}'::jsonb, array['other', 'semantic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('解', array['jiě']::text[], '角', '⿰角⿱刀牛', '[{"char":"角","role":"semantic","pinyin":"jiǎo"},{"char":"⿱刀牛","role":"other","pinyin":null}]'::jsonb, '{"type":"ideographic","hint":"To cut 刀 the horns 角 off of an ox 牛; 角 also provides the pronunciation"}'::jsonb, array['semantic', 'semantic', 'semantic', 'semantic', 'semantic', 'semantic', 'semantic', 'other', 'other', 'other', 'other', 'other', 'other']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('关', array['guān']::text[], '丷', '⿱丷天', '[{"char":"丷","role":"semantic","pinyin":"ha"},{"char":"天","role":"other","pinyin":"tiān"}]'::jsonb, null, array['semantic', 'semantic', 'other', 'other', 'other', 'other']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('心', array['xīn']::text[], '心', '？', '[{"char":"？","role":"other","pinyin":null}]'::jsonb, '{"type":"pictographic","hint":"A heart"}'::jsonb, array['other', 'other', 'other', 'other']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('习', array['xí']::text[], '冫', '⿹？冫', '[{"char":"？","role":"other","pinyin":null},{"char":"冫","role":"semantic","pinyin":"bīng"}]'::jsonb, null, array['other', 'semantic', 'semantic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('惯', array['guàn']::text[], '忄', '⿰忄贯', '[{"char":"忄","role":"semantic","pinyin":"xīn"},{"char":"贯","role":"phonetic","pinyin":"guàn"}]'::jsonb, '{"type":"pictophonetic","semantic":"忄","phonetic":"贯","hint":"heart"}'::jsonb, array['semantic', 'semantic', 'semantic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic', 'phonetic']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('文', array['wén']::text[], '文', '⿱亠乂', '[{"char":"亠","role":"other","pinyin":"tóu"},{"char":"乂","role":"other","pinyin":"yì"}]'::jsonb, '{"type":"pictographic","hint":"A tattooed chest, representing writing"}'::jsonb, array['other', 'other', 'other', 'other']::text[])
on conflict (char) do nothing;
insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values ('化', array['huà']::text[], '匕', '⿰亻匕', '[{"char":"亻","role":"other","pinyin":"rén"},{"char":"匕","role":"semantic","pinyin":"bǐ"}]'::jsonb, null, array['other', 'other', 'semantic', 'semantic']::text[])
on conflict (char) do nothing;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('家', 1, '2.0', '家 se escribe con 宀 (techo) y 豕 (cerdo). En la China antigua los cerdos se criaban junto a la casa: un cerdo bajo techo era señal de un hogar con sustento.', '家 combines 宀 (roof) and 豕 (pig). In ancient China pigs were raised next to the house: a pig under a roof meant a household that could feed itself.', 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'jiā', 'noun', 'casa; hogar; familia', 'home; family', '家 es el hogar o la familia. La casa como edificio o propiedad es 房子.', '家 is home or family. A house as a building or property is 房子.', 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '我家有四个人。', 'Wǒ jiā yǒu sì gè rén.', 'En mi familia somos cuatro.', 'There are four people in my family.'),
      (2, '我想回家。', 'Wǒ xiǎng huí jiā.', 'Quiero volver a casa.', 'I want to go home.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
),
s1 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 2, 'jiā', 'measure word', 'clasificador de empresas, tiendas y restaurantes', 'measure word for businesses, shops and restaurants', 'Va entre el número o 这/那 y el sustantivo: 一家商店, 这家饭店.', 'It goes between the number or 这/那 and the noun: 一家商店, 这家饭店.', 'ai' from w
  returning id
), t1 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s1.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s1, (values
      (1, '这家饭店很好。', 'Zhè jiā fàndiàn hěn hǎo.', 'Este restaurante es muy bueno.', 'This restaurant is very good.'),
      (2, '我去一家商店买东西。', 'Wǒ qù yì jiā shāngdiàn mǎi dōngxi.', 'Voy a una tienda a comprar cosas.', 'I''m going to a shop to buy some things.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('认识', 1, '2.0', 'Al conocer a alguien se dice 认识你很高兴. Hoy, lo siguiente suele ser intercambiar WeChat: 加个微信吧 ("agreguémonos en WeChat").', 'When meeting someone you say 认识你很高兴. Nowadays the next step is usually swapping WeChat: 加个微信吧 ("let''s add each other on WeChat").', 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'rènshi', 'verb', 'conocer (a una persona)', 'to know (someone); to meet', 'Solo para personas o cosas que reconoces. "Conocer un lugar" (haber estado) es 去过, y "saber un dato" es 知道.', 'Only for people or things you recognize. "Having been to a place" is 去过, and "knowing a fact" is 知道.', 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '我认识他。', 'Wǒ rènshi tā.', 'Lo conozco.', 'I know him.'),
      (2, '认识你很高兴。', 'Rènshi nǐ hěn gāoxìng.', 'Encantado de conocerte.', 'Nice to meet you.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
),
s1 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 2, 'rènshi', 'verb', 'reconocer; saber leer (caracteres)', 'to recognize; to be able to read (characters)', 'Con caracteres, 认识 es saber leerlos; escribirlos es 会写.', 'With characters, 认识 means being able to read them; writing them is 会写.', 'ai' from w
  returning id
), t1 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s1.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s1, (values
      (1, '这个字你认识吗？', 'Zhège zì nǐ rènshi ma?', '¿Reconoces este carácter?', 'Do you recognize this character?'),
      (2, '这些字我都认识。', 'Zhèxiē zì wǒ dōu rènshi.', 'Conozco todos estos caracteres.', 'I know all of these characters.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('东西', 1, '2.0', 'Una explicación popular: en la antigua Chang''an había un mercado del este (东市) y otro del oeste (西市). "Ir al este y al oeste" era ir de compras, y lo que se compraba acabó siendo "东西". Es una etimología tradicional, no la única propuesta.', 'A popular explanation: ancient Chang''an had an eastern market (东市) and a western market (西市). "Going east and west" meant shopping, and what you bought became "东西". It is a traditional etymology, not the only one proposed.', 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'dōngxi', 'noun', 'cosa; objeto', 'thing; stuff', 'Con 西 en tono neutro (dōngxi) es "cosa". Con primer tono (dōngxī) significa "este y oeste".', 'With 西 in the neutral tone (dōngxi) it means "thing". With the first tone (dōngxī) it means "east and west".', 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '你想买什么东西？', 'Nǐ xiǎng mǎi shénme dōngxi?', '¿Qué cosas quieres comprar?', 'What do you want to buy?'),
      (2, '这个东西很好。', 'Zhège dōngxi hěn hǎo.', 'Esta cosa es muy buena.', 'This thing is really good.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('知道', 2, '2.0', null, null, 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'zhīdào', 'verb', 'saber (un dato); estar enterado', 'to know (a fact); to be aware of', 'El "saber" del español se reparte en tres: 知道 (saber un dato), 会 (saber hacer algo) y 认识 (conocer a alguien).', 'Spanish "saber" splits into three: 知道 (to know a fact), 会 (to know how to do something) and 认识 (to know someone).', 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '我知道他的名字。', 'Wǒ zhīdào tā de míngzi.', 'Sé cómo se llama.', 'I know his name.'),
      (2, '你知道他在哪儿吗？', 'Nǐ zhīdào tā zài nǎr ma?', '¿Sabes dónde está?', 'Do you know where he is?')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('意思', 2, '2.0', '不好意思 se usa muchísimo: para pedir perdón por algo pequeño, para llamar la atención de alguien o para mostrar vergüenza. Es más suave y cotidiano que 对不起.', '不好意思 is used constantly: to apologize for something small, to get someone''s attention or to show embarrassment. It is softer and more everyday than 对不起.', 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'yìsi', 'noun', 'significado; lo que alguien quiere decir', 'meaning; what someone means', null, null, 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '这个字是什么意思？', 'Zhège zì shì shénme yìsi?', '¿Qué significa este carácter?', 'What does this character mean?'),
      (2, '你是什么意思？', 'Nǐ shì shénme yìsi?', '¿Qué quieres decir?', 'What do you mean?')
  ) as v(position, zh, pinyin, es, en)
  returning 1
),
s1 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 2, 'yìsi', 'set phrase', '有意思: interesante, divertido', '有意思: interesting, fun', 'Literalmente "tener significado". Lo contrario es 没意思 (aburrido).', 'Literally "to have meaning". The opposite is 没意思 (boring).', 'ai' from w
  returning id
), t1 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s1.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s1, (values
      (1, '这本书很有意思。', 'Zhè běn shū hěn yǒu yìsi.', 'Este libro es muy interesante.', 'This book is very interesting.'),
      (2, '学汉语很有意思。', 'Xué Hànyǔ hěn yǒu yìsi.', 'Aprender chino es muy divertido.', 'Learning Chinese is a lot of fun.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
),
s2 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 3, 'yìsi', 'set phrase', '不好意思: perdón; con permiso; qué vergüenza', '不好意思: sorry; excuse me; how embarrassing', null, null, 'ai' from w
  returning id
), t2 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s2.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s2, (values
      (1, '不好意思，我来晚了。', 'Bù hǎoyìsi, wǒ lái wǎn le.', 'Perdón, llegué tarde.', 'Sorry, I''m late.'),
      (2, '不好意思，请问现在几点？', 'Bù hǎoyìsi, qǐngwèn xiànzài jǐ diǎn?', 'Disculpe, ¿qué hora es?', 'Excuse me, what time is it?')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('觉得', 2, '2.0', null, null, 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'juéde', 'verb', 'creer; opinar; parecerle a uno; sentir', 'to think; to feel', 'Para opiniones personales y sensaciones. Es más suave y coloquial que 认为.', 'For personal opinions and feelings. Softer and more colloquial than 认为.', 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '你觉得汉语怎么样？', 'Nǐ juéde Hànyǔ zěnmeyàng?', '¿Qué te parece el chino?', 'What do you think of Chinese?'),
      (2, '我觉得今天有点儿冷。', 'Wǒ juéde jīntiān yǒudiǎnr lěng.', 'Siento que hoy hace un poco de frío.', 'I feel it''s a bit cold today.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('了解', 3, '2.0', null, null, 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'liǎojiě', 'verb', 'conocer a fondo; entender bien; informarse', 'to understand well; to know in depth; to find out', 'Cierra el trío: 认识 (conocer a alguien), 知道 (saber un dato), 了解 (conocer a fondo). Puedes 认识 a alguien sin 了解lo.', 'Completes the trio: 认识 (to know someone), 知道 (to know a fact), 了解 (to know in depth). You can 认识 someone without 了解-ing them.', 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '我想了解中国文化。', 'Wǒ xiǎng liǎojiě Zhōngguó wénhuà.', 'Quiero conocer a fondo la cultura china.', 'I want to learn about Chinese culture.'),
      (2, '我认识他，但是不了解他。', 'Wǒ rènshi tā, dànshì bù liǎojiě tā.', 'Lo conozco, pero no lo conozco bien.', 'I know him, but I don''t really know him.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('关心', 3, '2.0', 'En China la preocupación por los demás se expresa mucho con preguntas cotidianas: 吃饭了吗？ ("¿ya comiste?") funciona casi como un saludo, y 多穿点儿 ("abrígate más") es un clásico de padres y abuelos.', 'In China, caring for others is often shown through everyday questions: 吃饭了吗？ ("have you eaten?") works almost as a greeting, and 多穿点儿 ("wear more layers") is a classic from parents and grandparents.', 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'guānxīn', 'verb', 'preocuparse por; interesarse por', 'to care about; to be concerned about', 'Preocuparse por alguien con cariño, no estar angustiado. "Estar preocupado" (nervioso) es 担心.', 'Caring about someone with affection, not being anxious. "To be worried" is 担心.', 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '妈妈很关心我的身体。', 'Māma hěn guānxīn wǒ de shēntǐ.', 'Mi mamá se preocupa mucho por mi salud.', 'My mom really cares about my health.'),
      (2, '谢谢你的关心。', 'Xièxie nǐ de guānxīn.', 'Gracias por preocuparte.', 'Thank you for your concern.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('习惯', 3, '2.0', 'Una costumbre que conviene conocer: no se clavan los palillos de pie en el arroz, porque recuerda al incienso de los funerales.', 'A custom worth knowing: don''t stick chopsticks upright in rice, because it resembles the incense at funerals.', 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'xíguàn', 'noun', 'costumbre; hábito', 'habit; custom', null, null, 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '早上喝茶是我的习惯。', 'Zǎoshang hē chá shì wǒ de xíguàn.', 'Tomar té por la mañana es mi costumbre.', 'Drinking tea in the morning is my habit.'),
      (2, '每个国家都有自己的习惯。', 'Měi gè guójiā dōu yǒu zìjǐ de xíguàn.', 'Cada país tiene sus propias costumbres.', 'Every country has its own customs.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
),
s1 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 2, 'xíguàn', 'verb', 'acostumbrarse a; estar acostumbrado', 'to be used to; to get used to', null, null, 'ai' from w
  returning id
), t1 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s1.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s1, (values
      (1, '我还不习惯用筷子。', 'Wǒ hái bù xíguàn yòng kuàizi.', 'Todavía no me acostumbro a usar palillos.', 'I''m still not used to using chopsticks.'),
      (2, '你习惯这儿的天气吗？', 'Nǐ xíguàn zhèr de tiānqì ma?', '¿Te has acostumbrado al clima de aquí?', 'Are you used to the weather here?')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values ('文化', 3, '2.0', '文 en su forma antigua parece una persona con dibujos en el pecho: "patrón, marca". 化 es "transformar". 文化 es, literalmente, transformar a las personas mediante la escritura y las costumbres.', 'The ancient form of 文 looks like a person with markings on the chest: "pattern, mark". 化 means "to transform". 文化 literally means transforming people through writing and customs.', 'ai')
  on conflict (hanzi) do nothing
  returning id
)
, s0 as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, 1, 'wénhuà', 'noun', 'cultura', 'culture', null, null, 'ai' from w
  returning id
), t0 as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s0.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s0, (values
      (1, '我很喜欢中国文化。', 'Wǒ hěn xǐhuan Zhōngguó wénhuà.', 'Me gusta mucho la cultura china.', 'I really like Chinese culture.'),
      (2, '每个国家的文化都不一样。', 'Měi gè guójiā de wénhuà dōu bù yíyàng.', 'La cultura de cada país es distinta.', 'Every country''s culture is different.')
  ) as v(position, zh, pinyin, es, en)
  returning 1
)
select 1;

commit;
