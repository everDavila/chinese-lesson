import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import lessonJson from "../../contenido/leccion-demo.json";
import componentsJson from "../../contenido/componentes.json";
import charactersJson from "../../data/characters.json";
import type {
  Bilingual,
  CharacterInfo,
  Lesson,
  StrokeData,
  Word,
} from "./lesson-types";

// Carga la lección de demo desde los archivos del repo. Es el sustituto
// provisional de Supabase: misma forma de datos, sin base de datos.

const characters = charactersJson as Record<string, CharacterInfo>;

function readStrokes(char: string): StrokeData | null {
  try {
    const file = path.join(process.cwd(), "public", "hanzi-writer", `${char}.json`);
    return JSON.parse(readFileSync(file, "utf8")) as StrokeData;
  } catch {
    return null;
  }
}

export function getDemoLesson(): Lesson {
  const componentMeanings = Object.fromEntries(
    Object.entries(componentsJson).filter(([key]) => key !== "_nota"),
  );
  return {
    title: lessonJson.lesson.title,
    // En la demo se enseña el primer sentido de cada palabra; los demás se
    // ven en "Más detalles". En la app, el sentido lo elige la profesora.
    items: (lessonJson.words as Word[]).map((word) => ({
      word,
      senseIndex: 0,
      characters: [...word.hanzi].map((char) => ({
        char,
        info: characters[char] ?? null,
        strokes: readStrokes(char),
      })),
    })),
    componentMeanings: componentMeanings as Record<string, Bilingual>,
  };
}
