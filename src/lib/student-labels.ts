// Textos de la tarjeta, en el idioma del contenido para los alumnos (no en
// el de la interfaz): los lee toda la clase en la pantalla compartida.
// ARQUITECTURA.md §2, "Idiomas".

export type ContentLanguage = "es" | "en";

const LABELS = {
  es: {
    categories: {
      noun: "sustantivo",
      verb: "verbo",
      "measure word": "clasificador",
      "set phrase": "expresión",
    } as Record<string, string>,
    listenWord: "Escuchar la palabra",
    listenSentence: "Escuchar la frase",
    revealTranslation: "Clic para ver la traducción",
    howItsBuilt: "Cómo se forma",
    simpleCharacter: "carácter simple",
    radical: "radical",
    givesSound: "da el sonido",
    approximateSound: "sonido aproximado",
    moreDetails: "Más detalles de la palabra",
    nuance: "Matiz",
    culturalNote: "Nota cultural",
    otherUses: "Otros usos (otras lecciones)",
    groupTitle: "Comprensión del grupo",
    groupPrompt: "Pregunta al grupo y marca una valoración (teclas 1–4).",
    groupSource: "valoración docente",
    ratings: ["No la sé", "Me costó", "Bien", "Fácil"],
    verdicts: { reinforce: "Requiere refuerzo", review: "Necesita repaso", mastered: "Dominio aparente" },
  },
  en: {
    categories: {
      noun: "noun",
      verb: "verb",
      "measure word": "measure word",
      "set phrase": "set phrase",
    } as Record<string, string>,
    listenWord: "Listen to the word",
    listenSentence: "Listen to the sentence",
    revealTranslation: "Click to see the translation",
    howItsBuilt: "How it's built",
    simpleCharacter: "simple character",
    radical: "radical",
    givesSound: "gives the sound",
    approximateSound: "approximate sound",
    moreDetails: "More about this word",
    nuance: "Nuance",
    culturalNote: "Cultural note",
    otherUses: "Other uses (other lessons)",
    groupTitle: "Group understanding",
    groupPrompt: "Ask the group and pick a rating (keys 1–4).",
    groupSource: "teacher's rating",
    ratings: ["Don't know it", "Struggled", "Good", "Easy"],
    verdicts: { reinforce: "Needs reinforcement", review: "Needs review", mastered: "Apparent mastery" },
  },
};

export type StudentLabels = (typeof LABELS)["es"];

export function studentLabels(language: ContentLanguage): StudentLabels {
  return LABELS[language];
}
