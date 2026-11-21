// Contornos de los caracteres de ejemplo del capítulo «Los trazos» (Saber más), tomados
// de hanzi-writer-data (Arphic PL, ver /creditos). Solo los caracteres que el capítulo
// marca con {{ej:carácter:número de trazo}}; así el capítulo no depende de leer
// node_modules en producción. Uso: node scripts/build-trazos-ejemplos.mjs
import { readFileSync, writeFileSync } from "node:fs";

const cap = readFileSync("contenido/etimologia/cap-07-los-trazos.md", "utf8");
const chars = [...new Set([...cap.matchAll(/\{\{ej:(.):\d+\}\}/gu)].map((m) => m[1]))];
const out = {};
for (const ch of chars) {
  const d = JSON.parse(readFileSync(`node_modules/hanzi-writer-data/${ch}.json`, "utf8"));
  out[ch] = d.strokes;
}
writeFileSync("contenido/etimologia/trazos-ejemplos.json", JSON.stringify(out) + "\n");
console.log(`${chars.length} caracteres: ${chars.join(" ")}`);
