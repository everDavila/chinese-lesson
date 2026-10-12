// Produce un lote editorial a partir de los candidatos abiertos. No escribe en
// Supabase. Las sustituciones son deliberadas y trazables; el resto conserva su
// fuente original. Uso: node scripts/curate-hsk-examples.mjs <nivel>
import { readFileSync, writeFileSync } from "node:fs";

const level = Number(process.argv[2]);
if (![1, 2, 3].includes(level)) throw new Error("El nivel debe ser 1, 2 o 3.");

const replacements = {
  1: {
    "1-2": { zh: "妈妈爱孩子。", pinyin: "Māma ài háizi.", es: "Mamá quiere a sus hijos.", en: "Mom loves her children." },
    "2-2": { en: "She is eight years old." },
    "46-2": { zh: "学校有很多学生。", pinyin: "Xuéxiào yǒu hěn duō xuésheng.", es: "La escuela tiene muchos estudiantes.", en: "The school has many students." },
    "46-3": { zh: "我有很多书。", pinyin: "Wǒ yǒu hěn duō shū.", es: "Tengo muchos libros.", en: "I have many books." },
    "61-3": { zh: "请给我们买水。", pinyin: "Qǐng gěi wǒmen mǎi shuǐ.", es: "Por favor, cómpranos agua.", en: "Please buy us some water." },
    "64-3": { zh: "他有三只狗。", pinyin: "Tā yǒu sān zhī gǒu.", es: "Él tiene tres perros.", en: "He has three dogs." },
    "79-1": { zh: "学校里有很多人。", pinyin: "Xuéxiào lǐ yǒu hěn duō rén.", es: "Hay mucha gente en la escuela.", en: "There are many people at the school." },
    "91-2": { zh: "他叫小明。", pinyin: "Tā jiào Xiǎomíng.", es: "Él se llama Xiaoming.", en: "His name is Xiaoming." },
    "93-1": { zh: "我今年十八岁。", pinyin: "Wǒ jīnnián shíbā suì.", es: "Este año tengo dieciocho años.", en: "I am eighteen years old this year." },
    "105-2": { es: "Te doy cinco yuanes.", en: "I'll give you five yuan." },
    "160-2": { en: "She gets up at seven." },
    "112-2": { zh: "现在是八点零五分。", pinyin: "Xiànzài shì bā diǎn líng wǔ fēn.", es: "Ahora son las ocho y cinco.", en: "It is five past eight now." },
    "116-3": { zh: "请给我们买水。", pinyin: "Qǐng gěi wǒmen mǎi shuǐ.", es: "Por favor, cómpranos agua.", en: "Please buy us some water." },
    "124-3": { zh: "请给我们买水。", pinyin: "Qǐng gěi wǒmen mǎi shuǐ.", es: "Por favor, cómpranos agua.", en: "Please buy us some water." },
    "182-3": { zh: "这是什么？", pinyin: "Zhè shì shénme?", es: "¿Qué es esto?", en: "What is this?" },
    "184-1": { es: "¡Solo cuesta diez yuanes!", en: "It only costs ten yuan!" },
    "196-3": { zh: "你会说中文吗？", pinyin: "Nǐ huì shuō Zhōngwén ma?", es: "¿Sabes hablar chino?", en: "Can you speak Chinese?" },
    "199-3": { en: "She is eight years old." },
    "225-2": { es: "Me gustas mucho." },
    "231-3": { zh: "先生，你在做什么？", pinyin: "Xiānsheng, nǐ zài zuò shénme?", es: "Señor, ¿qué está haciendo?", en: "Sir, what are you doing?" },
    "236-2": { en: "He looked for her for five hours." },
    "246-3": { zh: "他休息了一下。", pinyin: "Tā xiūxi le yíxià.", es: "Él descansó un momento.", en: "He rested for a moment." },
    "252-1": { es: "¡Solo cuesta diez yuanes!", en: "It only costs ten yuan!" },
    "257-2": { zh: "他在医院。", pinyin: "Tā zài yīyuàn.", es: "Él está en el hospital.", en: "He is in the hospital." },
    "268-1": { es: "¡Solo cuesta diez yuanes!", en: "It only costs ten yuan!" },
    "286-2": { en: "She is studying." },
  },
  2: {
    "305-3": { zh: "请帮我们做饭。", pinyin: "Qǐng bāng wǒmen zuòfàn.", es: "Por favor, ayúdanos a cocinar.", en: "Please help us cook." },
    "306-3": { zh: "你能帮忙吗？", pinyin: "Nǐ néng bāngmáng ma?", es: "¿Puedes ayudar?", en: "Can you help?" },
    "309-2": { zh: "我比他高。", pinyin: "Wǒ bǐ tā gāo.", es: "Soy más alto que él.", en: "I am taller than him." },
    "340-2": { en: "Can you teach me how to fly?" },
    "341-2": { zh: "她很高。", pinyin: "Tā hěn gāo.", es: "Ella es alta.", en: "She is tall." },
    "381-2": { zh: "明天有考试。", pinyin: "Míngtiān yǒu kǎoshì.", es: "Mañana hay un examen.", en: "There is an exam tomorrow." },
    "405-2": { zh: "请拿一本书。", pinyin: "Qǐng ná yì běn shū.", es: "Por favor, toma un libro.", en: "Please take a book." },
    "405-3": { zh: "请拿过来。", pinyin: "Qǐng ná guòlái.", es: "Por favor, tráelo.", en: "Please bring it here." },
    "414-3": { zh: "他跑得很快。", pinyin: "Tā pǎo de hěn kuài.", es: "Él corre muy rápido.", en: "He runs very fast." },
    "430-3": { zh: "今天是我的生日。", pinyin: "Jīntiān shì wǒ de shēngrì.", es: "Hoy es mi cumpleaños.", en: "Today is my birthday." },
    "454-3": { zh: "你为什么不去？", pinyin: "Nǐ wèishénme bú qù?", es: "¿Por qué no vas?", en: "Why aren't you going?" },
    "456-3": { zh: "你洗衣服吗？", pinyin: "Nǐ xǐ yīfu ma?", es: "¿Lavas la ropa?", en: "Do you wash clothes?" },
    "470-2": { zh: "我是他的爷爷。", pinyin: "Wǒ shì tā de yéye.", es: "Soy su abuelo.", en: "I am his grandfather." },
    "474-3": { zh: "这个词是什么意思？", pinyin: "Zhège cí shì shénme yìsi?", es: "¿Qué significa esta palabra?", en: "What does this word mean?" },
    "478-2": { zh: "他在游泳。", pinyin: "Tā zài yóuyǒng.", es: "Él está nadando.", en: "He is swimming." },
    "491-1": { en: "She is studying." },
    "498-3": { zh: "他最喜欢我。", pinyin: "Tā zuì xǐhuan wǒ.", es: "Yo soy quien más le gusta.", en: "He likes me the most." },
  },
  3: {
    "511-2": { zh: "你现在没有办法帮他。", pinyin: "Nǐ xiànzài méiyǒu bànfǎ bāng tā.", es: "Ahora no tienes manera de ayudarlo.", en: "You have no way to help him now." },
    "514-2": { zh: "他常常帮助我。", pinyin: "Tā chángcháng bāngzhù wǒ.", es: "Él me ayuda a menudo.", en: "He often helps me." },
    "514-3": { zh: "谢谢你的帮助。", pinyin: "Xièxie nǐ de bāngzhù.", es: "Gracias por tu ayuda.", en: "Thank you for your help." },
    "519-1": { zh: "我的书被他拿走了。", pinyin: "Wǒ de shū bèi tā ná zǒu le.", es: "Él se llevó mi libro.", en: "My book was taken away by him." },
    "519-2": { zh: "门被他关上了。", pinyin: "Mén bèi tā guān shàng le.", es: "Él cerró la puerta.", en: "The door was closed by him." },
    "543-2": { zh: "我会开车，他不行。", pinyin: "Wǒ huì kāichē, tā bùxíng.", es: "Yo sé conducir; él no.", en: "I can drive; he can't." },
    "563-2": { es: "¿A qué hora nació?" },
    "569-3": { zh: "这不是一本词典。", pinyin: "Zhè bú shì yì běn cídiǎn.", es: "Esto no es un diccionario.", en: "This is not a dictionary." },
    "574-1": { zh: "你已经是大人了。", pinyin: "Nǐ yǐjīng shì dàrén le.", es: "Ya eres una persona adulta.", en: "You are already an adult." },
    "586-2": { es: "¡Eso me tocaba decirlo a mí!" },
    "624-2": { zh: "请放在那里。", pinyin: "Qǐng fàng zài nàli.", es: "Por favor, déjalo allí.", en: "Please put it there." },
    "665-3": { zh: "他好像病了。", pinyin: "Tā hǎoxiàng bìng le.", es: "Parece que él está enfermo.", en: "It seems that he is sick." },
    "669-2": { zh: "她在黑板上写字。", pinyin: "Tā zài hēibǎn shàng xiězì.", es: "Ella escribe en la pizarra.", en: "She writes on the blackboard." },
    "709-2": { es: "¿Está casado?", en: "Is he married?" },
    "714-2": { zh: "她没有姐妹。", pinyin: "Tā méiyǒu jiěmèi.", es: "Ella no tiene hermanas.", en: "She has no sisters." },
    "731-2": { zh: "这真可笑！", pinyin: "Zhè zhēn kěxiào!", es: "¡Esto es ridículo!", en: "This is ridiculous!" },
    "755-2": { zh: "我想和他聊聊。", pinyin: "Wǒ xiǎng hé tā liáoliao.", es: "Quiero hablar con él.", en: "I want to have a chat with him." },
    "790-3": { zh: "她怕狗。", pinyin: "Tā pà gǒu.", es: "Ella tiene miedo a los perros.", en: "She is afraid of dogs." },
    "831-1": { zh: "他的声音很好听。", pinyin: "Tā de shēngyīn hěn hǎotīng.", es: "Su voz suena muy bien.", en: "His voice sounds very nice." },
    "861-1": { en: "He has long hair." },
    "919-3": { zh: "我养了一只狗。", pinyin: "Wǒ yǎng le yì zhī gǒu.", es: "Tengo un perro a mi cuidado.", en: "I keep a dog." },
    "941-2": { zh: "我用手机学习。", pinyin: "Wǒ yòng shǒujī xuéxí.", es: "Uso el teléfono para estudiar.", en: "I use my phone to study." },
    "967-2": { zh: "你有多少张照片？", pinyin: "Nǐ yǒu duōshao zhāng zhàopiàn?", es: "¿Cuántas fotos tienes?", en: "How many photos do you have?" },
    "975-1": { es: "¡Solo cuesta diez yuanes!", en: "It only costs ten yuan!" },
    "979-1": { es: "¡Solo cuesta diez yuanes!", en: "It only costs ten yuan!" },
    "989-1": { zh: "他住院两个星期了。", pinyin: "Tā zhùyuàn liǎng ge xīngqī le.", es: "Lleva dos semanas hospitalizado.", en: "He has been in the hospital for two weeks." },
    "989-2": { zh: "妈妈住院了。", pinyin: "Māma zhùyuàn le.", es: "Mamá está hospitalizada.", en: "Mom was hospitalized." },
  },
};

function normalizeZh(text) {
  return text.trim().replaceAll(",", "，").replace(/\s+([，。！？])/g, "$1").replace(/\.$/, "。").replace(/\?$/, "？").replace(/!$/, "！");
}

function normalizePinyin(text) {
  const value = text.trim().replaceAll("，", ",").replaceAll("。", ".").replaceAll("？", "?").replaceAll("！", "!");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const sourcePath = `contenido/ejemplos-hsk${level}-sin-curar.json`;
const targetPath = `contenido/ejemplos-hsk${level}-curados-codex.json`;
const batch = JSON.parse(readFileSync(sourcePath, "utf8"));
const edits = replacements[level] ?? {};
let explicitEdits = 0;
let normalized = 0;

for (const row of batch.examples) {
  row.sentences = row.sentences.map((sentence, index) => {
    const key = `${row.sourceOrder}-${index + 1}`;
    const patch = edits[key];
    const next = { ...sentence, ...(patch ?? {}) };
    const zh = normalizeZh(next.zh);
    const pinyin = normalizePinyin(next.pinyin);
    if (patch) {
      explicitEdits++;
      if (patch.zh) Object.assign(next, { origin: "ai", source: "codex-editorial", license: null, sourceSentenceId: undefined });
    }
    if (zh !== next.zh || pinyin !== next.pinyin) normalized++;
    next.zh = zh;
    next.pinyin = pinyin;
    delete next.sourceSentenceId;
    if (sentence.sourceSentenceId && next.source !== "codex-editorial") next.sourceSentenceId = sentence.sourceSentenceId;
    return next;
  });
}

batch.metadata = {
  ...batch.metadata,
  status: "unreviewed",
  curatedAt: new Date().toISOString(),
  curation: {
    agent: "Codex",
    scope: "naturalidad, nivel, sentido objetivo, pinyin y traducciones",
    humanNativeReviewRequired: true,
    sourceFile: sourcePath,
  },
};

writeFileSync(targetPath, `${JSON.stringify(batch, null, 2)}\n`);
console.log(`${targetPath}: ${batch.examples.length} sentidos; ${explicitEdits} correcciones editoriales y ${normalized} normalizaciones.`);
