import "server-only";

import level1 from "../../contenido/hsk3-level1.json";
import level2 from "../../contenido/hsk3-level2.json";
import level3 from "../../contenido/hsk3-level3.json";
import level4 from "../../contenido/hsk3-level4.json";
import level5 from "../../contenido/hsk3-level5.json";
import level6 from "../../contenido/hsk3-level6.json";

// Palabras de HSK 1 a 6 (sin la banda 7–9, que pesa 1,4 MB y casi nunca sale en
// las frases). Sirve para decidir qué trozos de una frase valen la pena
// consultar al catálogo; el significado y el pinyin siguen saliendo de la base.
export const KNOWN_TERMS: ReadonlySet<string> = new Set(
  [level1, level2, level3, level4, level5, level6].flatMap((level) => level.words.map((w) => w.hanzi)),
);
