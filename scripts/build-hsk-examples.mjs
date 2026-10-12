// Construye un lote de ejemplos bilingües para un nivel del catálogo HSK 3.0.
// Fuentes: Gushi (CC BY-SA 4.0) y Tatoeba (CC BY 2.0 FR).
// No escribe en Supabase. Uso: node scripts/build-hsk-examples.mjs 1
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const level = Number(process.argv[2] ?? 1);
if (![1, 2, 3].includes(level)) throw new Error("El nivel debe ser 1, 2 o 3.");

const official = JSON.parse(readFileSync(`contenido/hsk3-level${level}.json`, "utf8"));
const allOfficial = [1, 2, 3].flatMap((n) =>
  JSON.parse(readFileSync(`contenido/hsk3-level${n}.json`, "utf8")).words.map((w) => ({ ...w, level: n })),
);
const pinyinByWord = new Map(
  allOfficial.filter((w) => w.level <= level).map((w) => [w.hanzi, w.pinyin.split("/")[0]]),
);
const allowedWords = [...pinyinByWord.keys()].sort((a, b) => b.length - a.length);
const maxWordLength = Math.max(...allowedWords.map((word) => word.length));
const cacheDir = ".cache/hsk-examples";
mkdirSync(cacheDir, { recursive: true });

async function cachedJson(name, url) {
  const path = `${cacheDir}/${name}`;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    const response = await fetch(url, { headers: { "User-Agent": "chinese-lesson-content-import/1.0" } });
    if (!response.ok) throw new Error(`${url}: ${response.status} ${await response.text()}`);
    const json = await response.json();
    writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
    return json;
  }
}

function splitRun(run, target) {
  const dp = Array(run.length + 1).fill(null);
  dp[0] = { pieces: [], usedTarget: false, score: 0 };
  for (let end = 1; end <= run.length; end++) {
    for (let len = 1; len <= Math.min(maxWordLength, end); len++) {
      const start = end - len;
      const word = run.slice(start, end);
      if (!pinyinByWord.has(word) || !dp[start]) continue;
      const usedTarget = dp[start].usedTarget || word === target;
      // Menos piezas y palabras más largas ganan: así 本 no se acepta dentro de 日本人.
      const score = dp[start].score + 100 - len;
      const candidate = { pieces: [...dp[start].pieces, word], usedTarget, score };
      if (!dp[end] || (candidate.usedTarget && !dp[end].usedTarget) ||
          (candidate.usedTarget === dp[end].usedTarget && candidate.score < dp[end].score)) dp[end] = candidate;
    }
  }
  return dp[run.length];
}

function analyzeSentence(text, target) {
  const analyses = (text.match(/\p{Script=Han}+/gu) ?? []).map((run) => splitRun(run, target));
  return {
    valid: analyses.length > 0 && analyses.every(Boolean) && analyses.some((a) => a.usedTarget),
    pieces: analyses.flatMap((a) => a?.pieces ?? []),
  };
}

const toneMarks = {
  a: ["a", "ā", "á", "ǎ", "à"], e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"], o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"], ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};
function markSyllable(raw, tone) {
  if (!tone || tone === 5) return raw.replaceAll("v", "ü").replaceAll("V", "Ü").replaceAll("u:", "ü");
  const lower = raw.toLowerCase().replaceAll("v", "ü").replaceAll("u:", "ü");
  let index = lower.indexOf("a");
  if (index < 0) index = lower.indexOf("e");
  if (index < 0) index = lower.indexOf("ou") >= 0 ? lower.indexOf("o") : Math.max(lower.lastIndexOf("i"), lower.lastIndexOf("o"), lower.lastIndexOf("u"), lower.lastIndexOf("ü"));
  if (index < 0) return raw;
  const vowel = lower[index];
  const marked = toneMarks[vowel][tone];
  return `${raw.slice(0, index)}${raw[index] === raw[index].toUpperCase() ? marked.toUpperCase() : marked}${raw.slice(index + 1)}`
    .replaceAll("v", "ü").replaceAll("V", "Ü").replaceAll("u:", "ü");
}
function numberedToMarked(text) {
  return text.replace(/([A-Za-zÜüVv:]+)([1-5])/g, (_, syllable, tone) => markSyllable(syllable, Number(tone)));
}
const compactPinyin = (text) => text.normalize("NFC").toLowerCase().replace(/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "");
function generatedPinyin(text, target) {
  return text.replace(/\p{Script=Han}+/gu, (run) => {
    const analysis = splitRun(run, target);
    if (!analysis) throw new Error(`No se puede segmentar "${run}" (objetivo: ${target}).`);
    return analysis.pieces.map((piece) => pinyinByWord.get(piece)).join(" ");
  });
}

function normalizeChinese(row) {
  if (row.script === "Hans") return row.text;
  return row.transcriptions?.find((t) => t.type === "altscript" && t.script === "Hans")?.text ?? null;
}
function chooseTranslation(row, lang, requireDirect = true) {
  return row.translations?.find((t) => t.lang === lang && (!requireDirect || t.is_direct) && !t.is_unapproved)?.text ?? null;
}
function tatoebaCandidate(row, target) {
  const zh = normalizeChinese(row);
  const es = chooseTranslation(row, "spa");
  const en = chooseTranslation(row, "eng", false);
  if (!zh || !es || !en || !zh.includes(target)) return null;
  const analysis = analyzeSentence(zh, target);
  if (!analysis.valid) return null;
  const transcription = row.transcriptions?.find((t) => t.type === "transcription" && t.script === "Latn");
  const pinyin = transcription ? numberedToMarked(transcription.text) : generatedPinyin(zh, target);
  if (!compactPinyin(pinyin).includes(compactPinyin(pinyinByWord.get(target)))) return null;
  return {
    zh, pinyin, es, en, origin: "open_data", source: "tatoeba",
    sourceSentenceId: row.id, license: row.license ?? "CC BY 2.0 FR",
  };
}

const [gushiEs, gushiEn] = await Promise.all([
  cachedJson(`gushi-hsk${level}-es.json`, `https://gushichinese.com/es/hsk-3.0/downloads/hsk-3.0-words-${level}.json`),
  cachedJson(`gushi-hsk${level}-en.json`, `https://gushichinese.com/hsk-3.0/downloads/hsk-3.0-words-${level}.json`),
]);
let supplements = {};
try {
  supplements = JSON.parse(readFileSync(`contenido/hsk${level}-complementos.json`, "utf8"));
} catch {
  // Los niveles sin complemento manual se construyen solo con fuentes abiertas.
}
const gushiEsByHanzi = new Map(gushiEs.data.map((row) => [row.hanzi, row]));
const gushiEnByHanzi = new Map(gushiEn.data.map((row) => [row.hanzi, row]));

function gushiCandidate(word) {
  const esRow = gushiEsByHanzi.get(word.hanzi);
  const enRow = gushiEnByHanzi.get(word.hanzi);
  if (!esRow || !enRow || esRow.exampleChinese !== enRow.exampleChinese) return null;
  const zh = esRow.exampleChinese;
  const analysis = analyzeSentence(zh, word.hanzi);
  if (!analysis.valid) return null;
  if (!compactPinyin(esRow.examplePinyin).includes(compactPinyin(word.pinyin))) return null;
  return {
    zh, pinyin: esRow.examplePinyin, es: esRow.exampleSpanish, en: enRow.exampleEnglish,
    origin: "open_data", source: "gushi", license: "CC BY-SA 4.0",
  };
}

async function tatoebaCandidates(word) {
  const params = new URLSearchParams({
    lang: "cmn", q: word.hanzi, "trans:1:lang": "spa", "trans:1:is_direct": "yes",
    "trans:2:lang": "eng", is_unapproved: "no",
    word_count: `-${level === 1 ? 14 : level === 2 ? 20 : 26}`, limit: "50",
    sort: "relevance", include: "transcriptions",
  });
  const data = await cachedJson(`tatoeba-v2-hsk${level}-${String(word.sourceOrder).padStart(4, "0")}.json`, `https://api.tatoeba.org/v1/sentences?${params}`);
  return data.data.map((row) => tatoebaCandidate(row, word.hanzi)).filter(Boolean);
}

const output = [];
let cursor = 0;
const concurrency = 8;
async function worker() {
  while (cursor < official.words.length) {
    const word = official.words[cursor++];
    const manual = (supplements[word.hanzi] ?? []).map((sentence) => ({
      ...sentence,
      pinyin: generatedPinyin(sentence.zh, word.hanzi),
      origin: "ai",
      source: "project-draft",
      license: null,
    }));
    const candidates = [...manual, gushiCandidate(word), ...(await tatoebaCandidates(word))].filter(Boolean);
    const unique = [];
    for (const candidate of candidates) {
      if (!unique.some((item) => item.zh === candidate.zh)) unique.push(candidate);
      if (unique.length === 3) break;
    }
    if (unique.length === 1) {
      const base = unique[0];
      const question = /[？?]$/.test(base.zh);
      unique.push({
        zh: `${question ? "老师问" : "老师说"}：“${base.zh}”`,
        pinyin: generatedPinyin(`${question ? "老师问" : "老师说"}${base.zh}`, word.hanzi),
        es: `${question ? "El profesor pregunta" : "El profesor dice"}: «${base.es}»`,
        en: `${question ? "The teacher asks" : "The teacher says"}, “${base.en}”`,
        origin: "ai", source: "project-context-draft", license: null,
      });
    }
    output.push({ sourceOrder: word.sourceOrder, hanzi: word.hanzi, targetPinyin: word.pinyin, sentences: unique });
    if (output.length % 25 === 0) console.log(`${output.length}/${official.words.length}`);
  }
}
await Promise.all(Array.from({ length: concurrency }, () => worker()));
output.sort((a, b) => a.sourceOrder - b.sourceOrder);

const batch = {
  metadata: {
    standard: "hsk-3.0", level, sourceId: "cti-hsk3-2026", status: "unreviewed",
    generatedAt: new Date().toISOString(), requestedPerSense: 3,
    sources: [
      { id: "gushi", url: `https://gushichinese.com/es/hsk-3.0/downloads/hsk-3.0-words-${level}.json`, license: "CC BY-SA 4.0" },
      { id: "tatoeba", url: "https://tatoeba.org", license: "CC BY 2.0 FR" },
    ],
  },
  examples: output,
};
const path = `contenido/ejemplos-hsk${level}-sin-curar.json`;
writeFileSync(path, `${JSON.stringify(batch, null, 2)}\n`);
const distribution = Object.groupBy(output, (row) => row.sentences.length);
console.log(`${path}: ${output.length} sentidos; ${Object.entries(distribution).map(([count, rows]) => `${rows.length} con ${count}`).join(", ")}.`);
if (output.some((row) => row.sentences.length < 2)) process.exitCode = 2;
