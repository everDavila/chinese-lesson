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
      // La lección local no tiene flujo editorial todavía. Mostrar sus
      // frases como borradores evita hacerlas pasar por contenido aprobado.
      word: {
        ...word,
        senses: word.senses.map((sense) => ({
          ...sense,
          sentences: sense.sentences.map((sentence) => ({
            ...sentence,
            status: sentence.status ?? "unreviewed",
          })),
        })),
      },
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
