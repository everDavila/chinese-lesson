// Genera glosas españolas HSK desde la edición española de Gushi (CC BY-SA
// 4.0). Conserva el texto como borrador trazable y aplica solo correcciones
// editoriales explícitas para sentidos básicos especialmente ambiguos.
// Uso: node scripts/build-hsk-meanings-es.mjs <1|2|3>
import { readFileSync, writeFileSync } from "node:fs";

const level = Number(process.argv[2]);
if (![1, 2, 3].includes(level)) throw new Error("El nivel debe ser 1, 2 o 3.");

const official = JSON.parse(readFileSync(`contenido/hsk3-level${level}.json`, "utf8")).words;
const source = JSON.parse(readFileSync(`.cache/hsk-examples/gushi-hsk${level}-es.json`, "utf8"));
const compact = (value) => value.normalize("NFC").toLowerCase().replace(/[^a-záéíóúüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "");

// Clave: orden oficial. Estas glosas priorizan el sentido que realmente se
// enseña en el nivel y evitan acepciones históricas o especializadas.
const overrides = {
  1: "amar; gustar mucho", 4: "partícula de sugerencia o suposición", 10: "clasificador para libros y cuadernos",
  13: "no; negación", 27: "universidad", 30: "partícula posesiva o atributiva", 31: "prefijo de número ordinal", 42: "leer", 44: "correcto; hacia; respecto de",
  50: "comida; arroz cocido", 66: "país; nación", 71: "bueno; bien", 86: "hogar; familia; clasificador de negocios",
  73: "bonito; que se ve bien; entretenido de ver", 87: "familiares; miembros de la familia", 88: "ver; encontrarse con",
  89: "clasificador para ropa y asuntos", 104: "boca; clasificador para miembros de una familia", 105: "trozo; clasificador; yuan en conversación",
  108: "partícula que indica cambio o acción completada",
  110: "dentro; en", 111: "dos, delante de un clasificador", 115: "partícula de pregunta sí/no",
  121: "no pasa nada; no importa; estar bien", 124: "sufijo de plural para personas", 133: "dónde", 138: "ese; esa; eso",
  144: "partícula para continuar una pregunta o señalar una situación", 165: "por favor; invitar; pedir",
  175: "arriba; sobre; subir", 187: "asunto; cosa", 206: "demasiado; muy", 213: "afuera; parte exterior",
  226: "abajo; bajar; siguiente", 228: "salir del trabajo; terminar la jornada", 229: "terminar o salir de clase",
  235: "niño; forma de dirigirse a un niño", 238: "estudiante de primaria", 262: "algunos; unos cuantos",
  271: "estar en; encontrarse en", 287: "clasificador para animales y objetos de una pieza", 299: "hacer; preparar",
  303: "blanco", 310: "bolígrafo; instrumento de escritura", 313: "sentir vergüenza; disculpa por una molestia leve",
  319: "salir de casa", 375: "hotel", 379: "empezar el curso o semestre", 406: "así; de esa manera; entonces",
  424: "centro comercial", 443: "clasificador para objetos largos y estrechos", 447: "afuera; parte exterior",
  458: "bajar o venir hacia aquí", 460: "bajar o alejarse de aquí", 464: "apellido; apellidarse",
  465: "nombre completo", 489: "así; de esta manera; de este tipo", 496: "caminar; ir a pie",
  347: "pasar; cruzar; celebrar", 351: "partícula de experiencia pasada", 357: "gastar; emplear", 358: "flor",
  332: "partícula que introduce el complemento de grado o resultado", 583: "obtener; conseguir", 587: "tener que; deber",
};

const unused = source.data.map((row, index) => ({ ...row, index, used: false }));
const rows = official.map((word) => {
  const candidates = unused.filter((row) => !row.used && row.hanzi === word.hanzi);
  let picked = candidates.find((row) => compact(row.pinyin) === compact(word.pinyin));
  if (!picked && candidates.length === 1) [picked] = candidates;
  // Dos entradas homógrafas con la misma lectura (花1/花2) siguen el orden de
  // la fuente; las correcciones explícitas de arriba fijan el sentido final.
  if (!picked && candidates.length) [picked] = candidates;
  if (!picked) throw new Error(`Sin glosa española para ${word.sourceOrder} ${word.hanzi} ${word.pinyin}.`);
  picked.used = true;
  return {
    sourceOrder: word.sourceOrder,
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    meaningEs: overrides[word.sourceOrder] ?? picked.meaning,
    sourceMeaningEs: picked.meaning,
  };
});

const out = {
  metadata: {
    level,
    sourceId: "gushi",
    sourceUrl: source.source,
    attribution: source.attribution,
    license: source.license,
    status: "unreviewed",
    generatedAt: new Date().toISOString().slice(0, 10),
  },
  meanings: rows,
};
writeFileSync(`contenido/significados-hsk${level}-sin-curar.json`, `${JSON.stringify(out, null, 2)}\n`);
console.log(`${rows.length} glosas HSK ${level} → contenido/significados-hsk${level}-sin-curar.json`);

