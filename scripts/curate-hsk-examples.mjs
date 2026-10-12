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
};

function normalizeZh(text) {
  return text.trim().replace(/\s+([，。！？])/g, "$1").replace(/\.$/, "。").replace(/\?$/, "？").replace(/!$/, "！");
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
