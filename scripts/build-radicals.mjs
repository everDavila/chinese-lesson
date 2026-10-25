// Tabla de los 214 radicales Kangxi cruzada con los caracteres HSK de
// data/characters.json. Uso: node scripts/build-radicals.mjs
// Escribe data/radicals.json. Los significados en español son una primera
// versión para que la docente los revise (no vienen de ninguna fuente).
import { readFileSync, writeFileSync } from "node:fs";

// Algunos «variantes» no son una forma del radical sino caracteres que el
// diccionario cuelga de él (虎 bajo 虍, 民 bajo 氏, 刁 bajo 刀): así cubre todo
// lo que sale como radical en data/characters.json.
// [número, carácter, pinyin, trazos, español, inglés, variantes]
const KANGXI = [
  [1, "一", "yī", 1, "uno", "one", ""],
  [2, "丨", "gǔn", 1, "línea vertical", "line", ""],
  [3, "丶", "zhǔ", 1, "punto", "dot", ""],
  [4, "丿", "piě", 1, "trazo diagonal", "slash", ""],
  [5, "乙", "yǐ", 1, "segundo, doblado", "second", "乚乛"],
  [6, "亅", "jué", 1, "gancho", "hook", ""],
  [7, "二", "èr", 2, "dos", "two", ""],
  [8, "亠", "tóu", 2, "tapa", "lid", ""],
  [9, "人", "rén", 2, "persona", "person", "亻"],
  [10, "儿", "ér", 2, "piernas, niño", "legs", ""],
  [11, "入", "rù", 2, "entrar", "enter", ""],
  [12, "八", "bā", 2, "ocho", "eight", "丷"],
  [13, "冂", "jiōng", 2, "límite, caja abierta", "down box", ""],
  [14, "冖", "mì", 2, "cubierta", "cover", ""],
  [15, "冫", "bīng", 2, "hielo", "ice", "⺀"],
  [16, "几", "jī", 2, "mesita", "table", ""],
  [17, "凵", "kǎn", 2, "recipiente abierto", "open box", ""],
  [18, "刀", "dāo", 2, "cuchillo", "knife", "刂⺈刁"],
  [19, "力", "lì", 2, "fuerza", "power", ""],
  [20, "勹", "bāo", 2, "envolver", "wrap", ""],
  [21, "匕", "bǐ", 2, "cuchara, daga", "spoon", ""],
  [22, "匚", "fāng", 2, "caja", "box", ""],
  [23, "匸", "xì", 2, "ocultar", "hiding enclosure", ""],
  [24, "十", "shí", 2, "diez", "ten", ""],
  [25, "卜", "bǔ", 2, "adivinar", "divination", "⺊"],
  [26, "卩", "jié", 2, "sello", "seal", "㔾"],
  [27, "厂", "hǎn", 2, "acantilado", "cliff", ""],
  [28, "厶", "sī", 2, "privado", "private", ""],
  [29, "又", "yòu", 2, "otra vez, mano derecha", "again", ""],
  [30, "口", "kǒu", 3, "boca", "mouth", ""],
  [31, "囗", "wéi", 3, "recinto", "enclosure", ""],
  [32, "土", "tǔ", 3, "tierra", "earth", ""],
  [33, "士", "shì", 3, "letrado, guerrero", "scholar", ""],
  [34, "夂", "zhǐ", 3, "ir detrás", "go", ""],
  [35, "夊", "suī", 3, "ir despacio", "go slowly", ""],
  [36, "夕", "xī", 3, "tarde, noche", "evening", ""],
  [37, "大", "dà", 3, "grande", "big", ""],
  [38, "女", "nǚ", 3, "mujer", "woman", ""],
  [39, "子", "zǐ", 3, "hijo, niño", "child", ""],
  [40, "宀", "mián", 3, "techo, casa", "roof", ""],
  [41, "寸", "cùn", 3, "pulgada", "inch", ""],
  [42, "小", "xiǎo", 3, "pequeño", "small", "⺌⺍"],
  [43, "尢", "wāng", 3, "cojo", "lame", "尣兀"],
  [44, "尸", "shī", 3, "cuerpo, cadáver", "corpse", ""],
  [45, "屮", "chè", 3, "brote", "sprout", ""],
  [46, "山", "shān", 3, "montaña", "mountain", ""],
  [47, "巛", "chuān", 3, "río", "river", "川"],
  [48, "工", "gōng", 3, "trabajo", "work", ""],
  [49, "己", "jǐ", 3, "uno mismo", "oneself", "巳"],
  [50, "巾", "jīn", 3, "pañuelo, tela", "turban", ""],
  [51, "干", "gān", 3, "seco, tronco", "dry", ""],
  [52, "幺", "yāo", 3, "hilo fino", "short thread", ""],
  [53, "广", "guǎng", 3, "cobertizo", "dotted cliff", ""],
  [54, "廴", "yǐn", 3, "pasos largos", "long stride", ""],
  [55, "廾", "gǒng", 3, "dos manos", "two hands", ""],
  [56, "弋", "yì", 3, "flecha con cuerda", "shoot", ""],
  [57, "弓", "gōng", 3, "arco", "bow", ""],
  [58, "彐", "jì", 3, "hocico de cerdo", "snout", "彑⺕"],
  [59, "彡", "shān", 3, "pelo, adorno", "bristle", ""],
  [60, "彳", "chì", 3, "paso", "step", ""],
  [61, "心", "xīn", 4, "corazón", "heart", "忄⺗"],
  [62, "戈", "gē", 4, "lanza", "halberd", ""],
  [63, "戶", "hù", 4, "puerta", "door", "户戸"],
  [64, "手", "shǒu", 4, "mano", "hand", "扌龵"],
  [65, "支", "zhī", 4, "rama", "branch", ""],
  [66, "攴", "pū", 4, "golpear", "rap", "攵"],
  [67, "文", "wén", 4, "escritura", "script", ""],
  [68, "斗", "dǒu", 4, "cucharón", "dipper", ""],
  [69, "斤", "jīn", 4, "hacha", "axe", ""],
  [70, "方", "fāng", 4, "cuadrado, dirección", "square", ""],
  [71, "无", "wú", 4, "no, sin", "not", "旡"],
  [72, "日", "rì", 4, "sol, día", "sun", ""],
  [73, "曰", "yuē", 4, "decir", "say", ""],
  [74, "月", "yuè", 4, "luna, mes", "moon", ""],
  [75, "木", "mù", 4, "árbol, madera", "tree", ""],
  [76, "欠", "qiàn", 4, "bostezar, faltar", "lack", ""],
  [77, "止", "zhǐ", 4, "detener", "stop", ""],
  [78, "歹", "dǎi", 4, "muerte, malo", "death", "歺"],
  [79, "殳", "shū", 4, "arma, golpear", "weapon", ""],
  [80, "毋", "wú", 4, "no (prohibición)", "do not", "母"],
  [81, "比", "bǐ", 4, "comparar", "compare", ""],
  [82, "毛", "máo", 4, "pelo", "fur", ""],
  [83, "氏", "shì", 4, "clan", "clan", "民"],
  [84, "气", "qì", 4, "aire, vapor", "steam", ""],
  [85, "水", "shuǐ", 4, "agua", "water", "氵氺"],
  [86, "火", "huǒ", 4, "fuego", "fire", "灬"],
  [87, "爪", "zhǎo", 4, "garra", "claw", "爫"],
  [88, "父", "fù", 4, "padre", "father", ""],
  [89, "爻", "yáo", 4, "trigrama", "double x", ""],
  [90, "爿", "qiáng", 4, "tronco partido", "half tree trunk", "丬"],
  [91, "片", "piàn", 4, "lámina", "slice", ""],
  [92, "牙", "yá", 4, "colmillo", "fang", ""],
  [93, "牛", "niú", 4, "vaca", "cow", "牜"],
  [94, "犬", "quǎn", 4, "perro", "dog", "犭"],
  [95, "玄", "xuán", 5, "oscuro, misterioso", "profound", ""],
  [96, "玉", "yù", 5, "jade", "jade", "王"],
  [97, "瓜", "guā", 5, "melón", "melon", ""],
  [98, "瓦", "wǎ", 5, "teja", "tile", ""],
  [99, "甘", "gān", 5, "dulce", "sweet", ""],
  [100, "生", "shēng", 5, "vida, nacer", "life", ""],
  [101, "用", "yòng", 5, "usar", "use", ""],
  [102, "田", "tián", 5, "campo", "field", ""],
  [103, "疋", "pǐ", 5, "rollo de tela, pie", "bolt of cloth", "𤴔"],
  [104, "疒", "nè", 5, "enfermedad", "sickness", ""],
  [105, "癶", "bō", 5, "pies separados", "footsteps", ""],
  [106, "白", "bái", 5, "blanco", "white", ""],
  [107, "皮", "pí", 5, "piel", "skin", ""],
  [108, "皿", "mǐn", 5, "plato", "dish", ""],
  [109, "目", "mù", 5, "ojo", "eye", ""],
  [110, "矛", "máo", 5, "lanza", "spear", ""],
  [111, "矢", "shǐ", 5, "flecha", "arrow", ""],
  [112, "石", "shí", 5, "piedra", "stone", ""],
  [113, "示", "shì", 5, "altar, ritual", "spirit", "礻"],
  [114, "禸", "róu", 5, "huella", "track", ""],
  [115, "禾", "hé", 5, "cereal", "grain", ""],
  [116, "穴", "xué", 5, "cueva", "cave", ""],
  [117, "立", "lì", 5, "de pie", "stand", ""],
  [118, "竹", "zhú", 6, "bambú", "bamboo", "⺮"],
  [119, "米", "mǐ", 6, "arroz", "rice", ""],
  [120, "糸", "mì", 6, "seda, hilo", "silk", "纟糹"],
  [121, "缶", "fǒu", 6, "vasija", "jar", ""],
  [122, "网", "wǎng", 6, "red", "net", "罒⺳冈"],
  [123, "羊", "yáng", 6, "oveja", "sheep", "⺶⺷"],
  [124, "羽", "yǔ", 6, "pluma", "feather", ""],
  [125, "老", "lǎo", 6, "viejo", "old", "耂"],
  [126, "而", "ér", 6, "y, barba", "and", ""],
  [127, "耒", "lěi", 6, "arado", "plow", ""],
  [128, "耳", "ěr", 6, "oreja", "ear", ""],
  [129, "聿", "yù", 6, "pincel", "brush", "⺻肀"],
  [130, "肉", "ròu", 6, "carne", "meat", "⺼"],
  [131, "臣", "chén", 6, "ministro", "minister", ""],
  [132, "自", "zì", 6, "uno mismo, nariz", "self", ""],
  [133, "至", "zhì", 6, "llegar", "arrive", ""],
  [134, "臼", "jiù", 6, "mortero", "mortar", ""],
  [135, "舌", "shé", 6, "lengua", "tongue", ""],
  [136, "舛", "chuǎn", 6, "oponerse", "oppose", ""],
  [137, "舟", "zhōu", 6, "barco", "boat", ""],
  [138, "艮", "gèn", 6, "detenerse, límite", "stopping", ""],
  [139, "色", "sè", 6, "color", "color", ""],
  [140, "艸", "cǎo", 6, "hierba", "grass", "艹⺿"],
  [141, "虍", "hū", 6, "tigre", "tiger", "虎"],
  [142, "虫", "chóng", 6, "insecto", "insect", ""],
  [143, "血", "xuè", 6, "sangre", "blood", ""],
  [144, "行", "xíng", 6, "andar, calle", "walk", ""],
  [145, "衣", "yī", 6, "ropa", "clothes", "衤"],
  [146, "襾", "yà", 6, "cubrir", "west", "覀西"],
  [147, "見", "jiàn", 7, "ver", "see", "见"],
  [148, "角", "jiǎo", 7, "cuerno", "horn", ""],
  [149, "言", "yán", 7, "palabra, habla", "speech", "讠訁"],
  [150, "谷", "gǔ", 7, "valle", "valley", ""],
  [151, "豆", "dòu", 7, "haba", "bean", ""],
  [152, "豕", "shǐ", 7, "cerdo", "pig", ""],
  [153, "豸", "zhì", 7, "felino, reptil", "badger", ""],
  [154, "貝", "bèi", 7, "concha, dinero", "shell", "贝"],
  [155, "赤", "chì", 7, "rojo", "red", ""],
  [156, "走", "zǒu", 7, "caminar", "run", ""],
  [157, "足", "zú", 7, "pie", "foot", "⻊"],
  [158, "身", "shēn", 7, "cuerpo", "body", ""],
  [159, "車", "chē", 7, "carro", "cart", "车"],
  [160, "辛", "xīn", 7, "amargo, picante", "bitter", ""],
  [161, "辰", "chén", 7, "mañana, dragón", "morning", ""],
  [162, "辵", "chuò", 7, "caminar", "walk", "辶⻌⻎"],
  [163, "邑", "yì", 7, "ciudad", "city", "阝"],
  [164, "酉", "yǒu", 7, "vino, licor", "wine", ""],
  [165, "釆", "biàn", 7, "distinguir", "distinguish", ""],
  [166, "里", "lǐ", 7, "aldea, li", "village", ""],
  [167, "金", "jīn", 8, "metal, oro", "gold", "钅釒"],
  [168, "長", "cháng", 8, "largo", "long", "长镸"],
  [169, "門", "mén", 8, "puerta", "gate", "门"],
  [170, "阜", "fù", 8, "colina", "mound", "阝"],
  [171, "隶", "dài", 8, "esclavo, alcanzar", "slave", ""],
  [172, "隹", "zhuī", 8, "pájaro de cola corta", "short-tailed bird", ""],
  [173, "雨", "yǔ", 8, "lluvia", "rain", "⻗"],
  [174, "靑", "qīng", 8, "verde azulado", "blue", "青"],
  [175, "非", "fēi", 8, "no, equivocado", "wrong", ""],
  [176, "面", "miàn", 9, "cara", "face", ""],
  [177, "革", "gé", 9, "cuero", "leather", ""],
  [178, "韋", "wéi", 9, "cuero curtido", "tanned leather", "韦"],
  [179, "韭", "jiǔ", 9, "puerro", "leek", ""],
  [180, "音", "yīn", 9, "sonido", "sound", ""],
  [181, "頁", "yè", 9, "página, cabeza", "leaf", "页"],
  [182, "風", "fēng", 9, "viento", "wind", "风"],
  [183, "飛", "fēi", 9, "volar", "fly", "飞"],
  [184, "食", "shí", 9, "comer", "eat", "饣飠"],
  [185, "首", "shǒu", 9, "cabeza", "head", ""],
  [186, "香", "xiāng", 9, "aroma", "fragrant", ""],
  [187, "馬", "mǎ", 10, "caballo", "horse", "马"],
  [188, "骨", "gǔ", 10, "hueso", "bone", ""],
  [189, "高", "gāo", 10, "alto", "tall", "髙"],
  [190, "髟", "biāo", 10, "pelo largo", "hair", ""],
  [191, "鬥", "dòu", 10, "pelear", "fight", ""],
  [192, "鬯", "chàng", 10, "licor ritual", "sacrificial wine", ""],
  [193, "鬲", "lì", 10, "caldero", "cauldron", ""],
  [194, "鬼", "guǐ", 10, "fantasma", "ghost", ""],
  [195, "魚", "yú", 11, "pez", "fish", "鱼"],
  [196, "鳥", "niǎo", 11, "pájaro", "bird", "鸟"],
  [197, "鹵", "lǔ", 11, "sal", "salt", "卤"],
  [198, "鹿", "lù", 11, "ciervo", "deer", ""],
  [199, "麥", "mài", 11, "trigo", "wheat", "麦"],
  [200, "麻", "má", 11, "cáñamo", "hemp", ""],
  [201, "黃", "huáng", 12, "amarillo", "yellow", "黄"],
  [202, "黍", "shǔ", 12, "mijo", "millet", ""],
  [203, "黑", "hēi", 12, "negro", "black", ""],
  [204, "黹", "zhǐ", 12, "bordado", "embroidery", ""],
  [205, "黽", "mǐn", 13, "rana", "frog", "黾"],
  [206, "鼎", "dǐng", 13, "trípode", "tripod", ""],
  [207, "鼓", "gǔ", 13, "tambor", "drum", ""],
  [208, "鼠", "shǔ", 13, "rata", "rat", ""],
  [209, "鼻", "bí", 14, "nariz", "nose", ""],
  [210, "齊", "qí", 14, "parejo", "even", "齐"],
  [211, "齒", "chǐ", 15, "diente", "tooth", "齿"],
  [212, "龍", "lóng", 16, "dragón", "dragon", "龙"],
  [213, "龜", "guī", 16, "tortuga", "turtle", "龟"],
  [214, "龠", "yuè", 17, "flauta", "flute", ""],
];

const chars = JSON.parse(readFileSync("data/characters.json", "utf8"));
const levels = JSON.parse(readFileSync("data/hsk-levels.json", "utf8"));

// Nivel de un carácter = el más bajo de las palabras que lo contienen (HSK 3.0).
const levelOf = {};
for (const [word, v] of Object.entries(levels)) {
  const n = v.n ?? v.o;
  if (!n) continue;
  for (const ch of word) levelOf[ch] = Math.min(levelOf[ch] ?? 99, n);
}

// 阝 es 阜 (colina) a la izquierda y 邑 (ciudad) a la derecha: se separa por
// la posición del componente en la descomposición (院 ⿰阝完 → 阜; 都 ⿰者阝 → 邑).
const sideOk = (char, c) => {
  if (c.radical !== "阝") return true;
  const left = c.components[0]?.char === "阝";
  return char === "阜" ? left : !left;
};

// Formas que aparecen de verdad en los datos, como radical o como componente.
// Una variante que ningún carácter HSK usa (⻌, 氺…) solo confunde: se descarta.
const inData = new Set();
for (const c of Object.values(chars)) {
  inData.add(c.radical);
  for (const p of c.components) for (const f of p.char) inData.add(f);
}

// Varios radicales Kangxi comparten forma reducida (阝 es 邑 y 阜): el
// reparto va por posición (ver sideOk).
const dropped = [];
const out = KANGXI.map(([number, char, pinyin, strokes, es, en, allVariants]) => {
  const variants = [...allVariants].filter((v) => inData.has(v) || (dropped.push(`${char}→${v}`), false)).join("");
  const forms = [char, ...variants];
  const users = Object.entries(chars)
    .filter(([, c]) => forms.includes(c.radical) && sideOk(char, c))
    .map(([ch]) => ch)
    .sort((a, b) => (levelOf[a] ?? 99) - (levelOf[b] ?? 99));
  return {
    number,
    char,
    pinyin,
    strokes,
    meaning: { es, en },
    variants: [...variants],
    hskCount: users.length,
    examples: users.slice(0, 5),
  };
});

writeFileSync("data/radicals.json", JSON.stringify(out, null, 2) + "\n");
const used = out.filter((r) => r.hskCount > 0).length;
console.log(`${out.length} radicales → data/radicals.json (${used} con caracteres HSK)`);
console.log("Variantes descartadas:", dropped.join(" "));
console.log(
  "Top:",
  [...out]
    .sort((a, b) => b.hskCount - a.hskCount)
    .slice(0, 12)
    .map((r) => `${r.char}${r.hskCount}`)
    .join(" "),
);

// Radicales de los datos que no están en la tabla (para decidir si faltan variantes).
const known = new Set(KANGXI.flatMap((r) => [r[1], ...r[6]]));
const missing = {};
for (const c of Object.values(chars)) if (!known.has(c.radical)) missing[c.radical] = (missing[c.radical] ?? 0) + 1;
console.log("Radical en datos sin cubrir:", JSON.stringify(missing));
