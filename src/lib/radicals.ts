/**
 * Radicales que casi nunca van solos como palabra. En «cómo se forma» no se
 * les pone pinyin (confunde: 氵 no se dice «shuǐ» en una palabra) y el hover
 * explica qué son. Cubre los ~60 más frecuentes del temario HSK; los raros
 * quedan como estaban. No es la lista Kangxi completa (214).
 *
 * kind: variant = forma reducida de un carácter que sí es palabra;
 *       stroke  = trazo suelto, solo clasifica;
 *       form    = solo existe como pieza de otros caracteres.
 */
type RadicalKind = "variant" | "stroke" | "form";
export type Radical = { kind: RadicalKind; meaning: string; of?: string };

export const RADICALS: Record<string, Radical> = {
  "扌": { kind: "variant", meaning: "mano", of: "手" },
  "氵": { kind: "variant", meaning: "agua", of: "水" },
  "亻": { kind: "variant", meaning: "persona", of: "人" },
  "艹": { kind: "variant", meaning: "hierba", of: "草" },
  "讠": { kind: "variant", meaning: "palabra, habla", of: "言" },
  "纟": { kind: "variant", meaning: "seda, hilo", of: "糸" },
  "忄": { kind: "variant", meaning: "corazón", of: "心" },
  "⺗": { kind: "variant", meaning: "corazón", of: "心" },
  "阝": { kind: "variant", meaning: "colina (izq.) o ciudad (der.)", of: "阜 / 邑" },
  "钅": { kind: "variant", meaning: "metal", of: "金" },
  "刂": { kind: "variant", meaning: "cuchillo", of: "刀" },
  "⺮": { kind: "variant", meaning: "bambú", of: "竹" },
  "犭": { kind: "variant", meaning: "perro, animal", of: "犬" },
  "饣": { kind: "variant", meaning: "comida", of: "食" },
  "衤": { kind: "variant", meaning: "ropa", of: "衣" },
  "礻": { kind: "variant", meaning: "altar, ritual", of: "示" },
  "⺼": { kind: "variant", meaning: "carne, cuerpo", of: "肉 / 月" },
  "灬": { kind: "variant", meaning: "fuego", of: "火" },
  "冫": { kind: "variant", meaning: "hielo", of: "冰" },
  "罒": { kind: "variant", meaning: "red", of: "网" },
  "爫": { kind: "variant", meaning: "garra, mano", of: "爪" },
  "⺈": { kind: "variant", meaning: "cuchillo (arriba)", of: "刀" },
  "⺌": { kind: "variant", meaning: "pequeño (arriba)", of: "小" },
  "⺍": { kind: "variant", meaning: "pequeño (arriba)", of: "小" },
  "⺳": { kind: "variant", meaning: "red", of: "网" },
  "⺊": { kind: "variant", meaning: "adivinación", of: "卜" },
  "⺀": { kind: "variant", meaning: "agua / hielo (gotas)", of: "冫" },
  "耂": { kind: "variant", meaning: "anciano", of: "老" },
  "龶": { kind: "form", meaning: "forma que aparece arriba en 青, 毒…" },
  "辶": { kind: "form", meaning: "caminar, movimiento" },
  "宀": { kind: "form", meaning: "techo, casa" },
  "疒": { kind: "form", meaning: "enfermedad" },
  "攵": { kind: "form", meaning: "golpear, acción" },
  "彳": { kind: "form", meaning: "paso, andar" },
  "亠": { kind: "form", meaning: "tapa, parte superior" },
  "丷": { kind: "form", meaning: "dos puntos, división" },
  "囗": { kind: "form", meaning: "recinto, cerco" },
  "厶": { kind: "form", meaning: "privado, yo" },
  "冂": { kind: "form", meaning: "caja abierta, límite" },
  "冖": { kind: "form", meaning: "cubierta" },
  "乚": { kind: "form", meaning: "gancho" },
  "勹": { kind: "form", meaning: "envolver" },
  "彐": { kind: "form", meaning: "cabeza de cerdo (hocico)" },
  "夂": { kind: "form", meaning: "seguir, ir detrás" },
  "乂": { kind: "form", meaning: "cortar, cruce" },
  "殳": { kind: "form", meaning: "arma, golpear" },
  "廾": { kind: "form", meaning: "dos manos" },
  "彡": { kind: "form", meaning: "pelo, adorno" },
  "凵": { kind: "form", meaning: "recipiente abierto" },
  "疋": { kind: "form", meaning: "pie, rollo de tela" },
  "卩": { kind: "form", meaning: "sello, arrodillado" },
  "匚": { kind: "form", meaning: "caja" },
  "虍": { kind: "form", meaning: "tigre" },
  "幺": { kind: "form", meaning: "hilo fino, pequeño" },
  "缶": { kind: "form", meaning: "vasija" },
  "尢": { kind: "form", meaning: "cojo" },
  "廴": { kind: "form", meaning: "caminar largo" },
  "攴": { kind: "form", meaning: "golpear" },
  "丿": { kind: "stroke", meaning: "trazo diagonal (piě)" },
  "丶": { kind: "stroke", meaning: "punto (diǎn)" },
  "丨": { kind: "stroke", meaning: "trazo vertical (shù)" },
  "乛": { kind: "stroke", meaning: "trazo con quiebre" },
  "亅": { kind: "stroke", meaning: "gancho vertical" },
};

/**
 * Tooltip en dos niveles: el título dice qué significa («Radical · Techo, casa»)
 * y la nota, cómo se usa. Son cosas distintas y no se mezclan en una frase.
 */
export function radicalHint(char: string): { title: string; note: string } | null {
  const r = RADICALS[char];
  if (!r) return null;
  const meaning = r.meaning.charAt(0).toUpperCase() + r.meaning.slice(1);
  return {
    title: `Radical · ${meaning}`,
    note: r.of ? `Forma reducida de ${r.of}` : "No se usa de forma independiente",
  };
}
