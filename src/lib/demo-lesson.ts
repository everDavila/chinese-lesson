import "server-only";

import lessonJson from "../../contenido/leccion-demo.json";
import charactersJson from "../../data/characters.json";
import { componentMeanings, readStrokes } from "./hanzi-data";
import type { CharacterInfo, Lesson, Word } from "./lesson-types";

// Carga la lección de demo desde los archivos del repo. Es el sustituto
// provisional de Supabase: misma forma de datos, sin base de datos.

const characters = charactersJson as Record<string, CharacterInfo>;

export function getDemoLesson(): Lesson {
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
    componentMeanings: componentMeanings(),
  };
}
