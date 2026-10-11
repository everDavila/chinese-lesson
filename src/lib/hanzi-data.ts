import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import componentsJson from "../../contenido/componentes.json";
import type { Bilingual, StrokeData } from "./lesson-types";

// Datos de caracteres que viven en el repo (no en la base): trazos de
// hanzi-writer-data y significado curado de los componentes.

export function readStrokes(char: string): StrokeData | null {
  try {
    const file = path.join(process.cwd(), "public", "hanzi-writer", `${char}.json`);
    return JSON.parse(readFileSync(file, "utf8")) as StrokeData;
  } catch {
    return null;
  }
}

export function componentMeanings(): Record<string, Bilingual> {
  return Object.fromEntries(
    Object.entries(componentsJson).filter(([key]) => key !== "_nota"),
  ) as Record<string, Bilingual>;
}
