// Comprueba que cada frase de una lección solo use vocabulario de nivel HSK
// igual o inferior al de su palabra. Uso:
//   node scripts/validate-content.mjs [contenido/leccion-demo.json]
//
// En vez de un segmentador (que junta o separa de más), busca la división de
// la frase en palabras de la lista HSK que minimiza el nivel máximo. Es la
// lectura más favorable: si aun así se pasa del nivel, el problema es real.
import { readFileSync } from "node:fs";

const lessonPath = process.argv[2] ?? "contenido/leccion-demo.json";
const lesson = JSON.parse(readFileSync(lessonPath, "utf8"));
const levels = JSON.parse(readFileSync("data/hsk-levels.json", "utf8"));
const v = lesson.lesson.hskVersion === "3.0" ? "n" : "o";
const MAX_LEN = Math.max(...Object.keys(levels).map((w) => w.length));

// Un carácter suelto que no es palabra (学, 晚) toma el nivel mínimo de las
// palabras que lo contienen. 儿 de erhua (哪儿, 这儿) no suma nivel.
const charLevel = new Map([["儿", 1]]);
for (const [w, l] of Object.entries(levels)) {
  if (!l[v]) continue;
  for (const ch of w) {
    if (!charLevel.has(ch) || charLevel.get(ch) > l[v]) charLevel.set(ch, l[v]);
  }
}
const pieceLevel = (p) =>
  levels[p]?.[v] ?? (p.length === 1 ? (charLevel.get(p) ?? Infinity) : undefined);

function bestSplit(text, target) {
  // dp[i] = { cost, prev, piece } para el prefijo text[0..i)
  const dp = [{ cost: 0 }];
  for (let i = 1; i <= text.length; i++) {
    for (let len = 1; len <= Math.min(MAX_LEN, i); len++) {
      const piece = text.slice(i - len, i);
      const lvl = piece === target ? 0 : pieceLevel(piece);
      if (lvl === undefined || !dp[i - len]) continue;
      const cost = Math.max(dp[i - len].cost, lvl);
      if (!dp[i] || cost < dp[i].cost) dp[i] = { cost, prev: i - len, piece, lvl };
    }
  }
  const pieces = [];
  for (let i = text.length; i > 0; i = dp[i].prev) pieces.unshift(dp[i]);
  return pieces;
}

let problems = 0;
for (const word of lesson.words) {
  for (const [i, sense] of word.senses.entries()) {
    for (const s of sense.sentences) {
      const bad = [];
      for (const run of s.zh.match(/\p{Script=Han}+/gu) ?? []) {
        for (const p of bestSplit(run, word.hanzi)) {
          if (p.lvl > word.hsk) bad.push(`${p.piece}(${p.lvl === Infinity ? "?" : p.lvl})`);
        }
      }
      if (bad.length) {
        problems++;
        console.log(`✗ ${word.hanzi} [HSK ${word.hsk}] sentido ${i + 1}: ${s.zh}\n    ${bad.join(" ")}`);
      }
    }
  }
}
console.log(problems ? `\n${problems} frase(s) por encima de su nivel.` : "✓ Todas las frases respetan su nivel.");
process.exit(problems ? 1 : 0);
