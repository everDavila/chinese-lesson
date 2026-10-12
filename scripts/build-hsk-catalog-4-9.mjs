// Extrae las entradas HSK 4–9 del temario oficial 2025/2026 y añade una
// glosa española breve de Gushi (CC BY-SA 4.0). No importa ejemplos ni audio.
//
// Uso:
//   node scripts/build-hsk-catalog-4-9.mjs <temario.pdf> <gushi-words-all.json>
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const [pdfPath, gushiPath] = process.argv.slice(2);
if (!pdfPath || !gushiPath) {
  throw new Error("Uso: node scripts/build-hsk-catalog-4-9.mjs <temario.pdf> <gushi.json>");
}

const SOURCE = {
  standard: "hsk-3.0",
  sourceId: "cti-hsk3-2026",
  sourceTitle: "新版HSK考试大纲",
  sourceUrl: "https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf",
  published: "2025-11",
  effective: "2026-07",
};

const EXPECTED = [
  { key: "4", level: 4, label: "4", from: 1001, to: 2000 },
  { key: "5", level: 5, label: "5", from: 2001, to: 3600 },
  { key: "6", level: 6, label: "6", from: 3601, to: 5400 },
  { key: "7-9", level: 7, label: "7-9", from: 5401, to: 11000 },
];

const compact = (value) => value.replace(/\s+/g, "");
const plainPinyin = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/ü/g, "u")
  .replace(/[^a-z]/g, "");

function joinItems(items, preserveGaps = false) {
  const useful = items.filter((item) => item.str.trim()).sort((a, b) => a.transform[4] - b.transform[4]);
  let value = "";
  let end = null;
  for (const item of useful) {
    const start = item.transform[4];
    if (preserveGaps && end !== null && start - end > 3.5) value += " ";
    value += item.str;
    end = start + item.width;
  }
  return value.trim();
}

function groupRows(items) {
  const rows = [];
  for (const item of items.filter((item) => item.str.trim())) {
    const y = item.transform[5];
    // Algunas celdas largas cambian la línea base hasta 2 px dentro de una
    // misma fila (p. ej. 好容易); las filas reales están separadas ~17 px.
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2.5);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }
  return rows.sort((a, b) => b.y - a.y);
}

function parseRow(row) {
  const column = (from, to = Infinity) => row.items.filter((item) => {
    const x = item.transform[4];
    return x >= from && x < to;
  });
  const orderText = compact(joinItems(column(60, 135)));
  if (!/^\d{1,5}$/.test(orderText)) return null;
  const sourceOrder = Number(orderText);
  const sourceLevelLabel = compact(joinItems(column(135, 210))).replace(/[—–]/g, "-");
  const sourceLabel = compact(joinItems(column(210, 310)));
  const pinyin = joinItems(column(310, 430), true).replace(/\s*([-’'])\s*/g, "$1");
  const partOfSpeech = compact(joinItems(column(430))) || null;
  if (!sourceLabel || !pinyin) throw new Error(`Fila incompleta en ${sourceOrder}.`);
  return {
    sourceOrder,
    hanzi: sourceLabel.replace(/[1-9]$/, ""),
    sourceLabel,
    pinyin,
    partOfSpeech,
    sourceLevelLabel,
  };
}

const pdfBytes = new Uint8Array(await readFile(pdfPath));
const sourceSha256 = createHash("sha256").update(pdfBytes).digest("hex").toUpperCase();
const document = await pdfjs.getDocument({ data: pdfBytes }).promise;
const official = [];

// HSK 4–9 ocupa las páginas físicas 105–354. Los niveles 1–3 ya tienen su
// extracción validada y versionada; aquí no se vuelven a generar.
for (let pageNumber = 105; pageNumber <= 354; pageNumber++) {
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();
  for (const row of groupRows(content.items)) {
    const parsed = parseRow(row);
    if (parsed) official.push(parsed);
  }
}

official.sort((a, b) => a.sourceOrder - b.sourceOrder);
if (official.length !== 10000 || official[0]?.sourceOrder !== 1001 || official.at(-1)?.sourceOrder !== 11000) {
  const found = new Set(official.map((entry) => entry.sourceOrder));
  const missing = Array.from({ length: 10000 }, (_, index) => index + 1001).filter((order) => !found.has(order));
  throw new Error(`Extracción oficial incompleta: ${official.length} entradas; rango ${official[0]?.sourceOrder}-${official.at(-1)?.sourceOrder}; faltan ${missing.slice(0, 120).join(",")}.`);
}
for (let index = 0; index < official.length; index++) {
  const expectedOrder = index + 1001;
  if (official[index].sourceOrder !== expectedOrder) throw new Error(`Falta la entrada oficial ${expectedOrder}.`);
}

const gushi = JSON.parse(await readFile(gushiPath, "utf8"));
if (gushi.license !== "CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/") {
  throw new Error("Licencia inesperada en el archivo de Gushi.");
}
const glosses = new Map();
for (const row of gushi.data) {
  const list = glosses.get(row.hanzi) ?? [];
  list.push({ pinyin: row.pinyin, meaningEs: row.meaning });
  glosses.set(row.hanzi, list);
}

function meaningFor(entry) {
  const candidates = glosses.get(entry.hanzi) ?? [];
  const target = plainPinyin(entry.pinyin);
  const exact = candidates.find((candidate) => plainPinyin(candidate.pinyin) === target);
  const compatible = candidates.find((candidate) => {
    const value = plainPinyin(candidate.pinyin);
    return value.includes(target) || target.includes(value);
  });
  return (exact ?? compatible ?? candidates[0])?.meaningEs ?? "";
}

const retrievedAt = new Date().toISOString().slice(0, 10);
for (const expected of EXPECTED) {
  const words = official
    .filter((entry) => entry.sourceOrder >= expected.from && entry.sourceOrder <= expected.to)
    .map((entry) => ({ ...entry, meaningEs: meaningFor(entry) }));
  const missingMeanings = words.filter((entry) => !entry.meaningEs).length;
  const output = {
    metadata: {
      ...SOURCE,
      level: expected.level,
      levelLabel: expected.label,
      retrievedAt,
      sourceSha256,
      entryKind: "introduced-at-level",
      entryCount: words.length,
      cumulativeEntryCount: expected.to,
      status: "source-verified-unreviewed",
      glossSourceId: "gushi",
      glossLicense: "CC BY-SA 4.0",
      missingMeanings,
    },
    words,
  };
  await writeFile(`contenido/hsk3-level${expected.key}.json`, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`HSK ${expected.label}: ${words.length} entradas; ${missingMeanings} sin glosa española.`);
}

