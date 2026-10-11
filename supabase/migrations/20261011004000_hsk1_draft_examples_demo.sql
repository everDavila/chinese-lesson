-- Lote pequeño para demostrar ejemplos generados y el flujo de curaduría.
-- Todos quedan explícitamente como IA + sin revisar. No reemplaza la revisión
-- lingüística de la profesora.

with draft_examples as (
  select *
  from jsonb_to_recordset($examples$[
    {"source_order":1,"zh":"我爱妈妈。","pinyin":"Wǒ ài māma.","translation_es":"Amo a mi mamá.","translation_en":"I love my mom."},
    {"source_order":2,"zh":"我有八本书。","pinyin":"Wǒ yǒu bā běn shū.","translation_es":"Tengo ocho libros.","translation_en":"I have eight books."},
    {"source_order":3,"zh":"我爸爸是老师。","pinyin":"Wǒ bàba shì lǎoshī.","translation_es":"Mi papá es profesor.","translation_en":"My dad is a teacher."},
    {"source_order":4,"zh":"我们吃饭吧。","pinyin":"Wǒmen chī fàn ba.","translation_es":"Comamos.","translation_en":"Let's eat."},
    {"source_order":5,"zh":"我白天工作。","pinyin":"Wǒ báitiān gōngzuò.","translation_es":"Trabajo de día.","translation_en":"I work during the day."},
    {"source_order":6,"zh":"这个一百元。","pinyin":"Zhège yì bǎi yuán.","translation_es":"Esto cuesta cien yuanes.","translation_en":"This costs one hundred yuan."},
    {"source_order":7,"zh":"现在八点半。","pinyin":"Xiànzài bā diǎn bàn.","translation_es":"Ahora son las ocho y media.","translation_en":"It is eight thirty now."},
    {"source_order":8,"zh":"我想吃包子。","pinyin":"Wǒ xiǎng chī bāozi.","translation_es":"Quiero comer baozi.","translation_en":"I want to eat baozi."},
    {"source_order":9,"zh":"杯子里有水。","pinyin":"Běizi lǐ yǒu shuǐ.","translation_es":"Hay agua en el vaso.","translation_en":"There is water in the cup."},
    {"source_order":10,"zh":"我有一本书。","pinyin":"Wǒ yǒu yì běn shū.","translation_es":"Tengo un libro.","translation_en":"I have one book."},
    {"source_order":11,"zh":"老师在那边。","pinyin":"Lǎoshī zài nàbiān.","translation_es":"La profesora está allí.","translation_en":"The teacher is over there."},
    {"source_order":12,"zh":"他病了。","pinyin":"Tā bìng le.","translation_es":"Él está enfermo.","translation_en":"He is sick."},
    {"source_order":13,"zh":"我不喝茶。","pinyin":"Wǒ bù hē chá.","translation_es":"No tomo té.","translation_en":"I don't drink tea."},
    {"source_order":14,"zh":"谢谢！不客气。","pinyin":"Xièxie! Bú kèqi.","translation_es":"¡Gracias! De nada.","translation_en":"Thank you! You're welcome."},
    {"source_order":15,"zh":"不要喝冷水。","pinyin":"Búyào hē lěng shuǐ.","translation_es":"No tomes agua fría.","translation_en":"Don't drink cold water."},
    {"source_order":16,"zh":"我喜欢这个菜。","pinyin":"Wǒ xǐhuan zhège cài.","translation_es":"Me gusta este plato.","translation_en":"I like this dish."},
    {"source_order":17,"zh":"我想喝茶。","pinyin":"Wǒ xiǎng hē chá.","translation_es":"Quiero tomar té.","translation_en":"I want to drink tea."},
    {"source_order":18,"zh":"她会唱中文歌。","pinyin":"Tā huì chàng Zhōngwén gē.","translation_es":"Ella sabe cantar canciones en chino.","translation_en":"She can sing songs in Chinese."},
    {"source_order":19,"zh":"超市在那边。","pinyin":"Chāoshì zài nàbiān.","translation_es":"El supermercado está allí.","translation_en":"The supermarket is over there."},
    {"source_order":20,"zh":"他的车在外边。","pinyin":"Tā de chē zài wàibian.","translation_es":"Su auto está afuera.","translation_en":"His car is outside."}
  ]$examples$::jsonb) as example (
    source_order integer,
    zh text,
    pinyin text,
    translation_es text,
    translation_en text
  )
), resolved as (
  select
    word_levels.sense_id,
    draft_examples.*,
    coalesce((
      select max(sentences.position)
      from sentences
      where sentences.sense_id = word_levels.sense_id
    ), 0) + 1 as next_position
  from draft_examples
  join word_levels
    on word_levels.standard = 'hsk-3.0'
   and word_levels.source_order = draft_examples.source_order
  where word_levels.sense_id is not null
)
insert into sentences (
  sense_id,
  position,
  zh,
  pinyin,
  translation_es,
  translation_en,
  computed_level,
  origin,
  status
)
select
  sense_id,
  next_position,
  zh,
  pinyin,
  translation_es,
  translation_en,
  1,
  'ai',
  'unreviewed'
from resolved
where not exists (
  select 1
  from sentences
  where sentences.sense_id = resolved.sense_id
    and sentences.zh = resolved.zh
);
