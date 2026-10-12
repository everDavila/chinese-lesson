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
      adjective: "adjetivo",
      adverb: "adverbio",
      pronoun: "pronombre",
      numeral: "numeral",
      preposition: "preposición",
      conjunction: "conjunción",
      interjection: "interjección",
      particle: "partícula",
      affix: "afijo",
    } as Record<string, string>,
    listenWord: "Escuchar la palabra",
    listenSentence: "Escuchar la frase",
    revealTranslation: "Clic para ver la traducción",
    howItsBuilt: "Cómo se forma",
    moreDetails: "Más detalles de la palabra",
    nuance: "Matiz",
    culturalNote: "Nota cultural",
    otherUses: "Otros usos (otras lecciones)",
    groupTitle: "Comprensión del grupo",
    groupPrompt: "Pregunta al grupo y marca una valoración.",
    groupSource: "valoración docente",
    ratings: ["No la sé", "Me costó", "Bien", "Fácil"],
    verdicts: { reinforce: "Requiere refuerzo", review: "Necesita repaso", mastered: "Dominio aparente" },
    votingTitle: "Votación de los alumnos",
    votingOpen: "Activar votación",
    votingClose: "Pausar votación",
    votingHint: "Cada alumno vota desde su celular, sin cuenta; la votación sigue a cada palabra.",
    votingJoin: "Entren en",
    votingCode: "código",
    votingNoData: "Pocos votos todavía",
    votingCombined: "Con tu valoración",
    votesCount: (n: number) => (n === 1 ? "1 voto" : `${n} votos`),
  },
  en: {
    categories: {
      noun: "noun",
      verb: "verb",
      "measure word": "measure word",
      "set phrase": "set phrase",
      adjective: "adjective",
      adverb: "adverb",
      pronoun: "pronoun",
      numeral: "numeral",
      preposition: "preposition",
      conjunction: "conjunction",
      interjection: "interjection",
      particle: "particle",
      affix: "affix",
    } as Record<string, string>,
    listenWord: "Listen to the word",
    listenSentence: "Listen to the sentence",
    revealTranslation: "Click to see the translation",
    howItsBuilt: "How it's built",
    moreDetails: "More about this word",
    nuance: "Nuance",
    culturalNote: "Cultural note",
    otherUses: "Other uses (other lessons)",
    groupTitle: "Group understanding",
    groupPrompt: "Ask the group and pick a rating.",
    groupSource: "teacher's rating",
    ratings: ["Don't know it", "Struggled", "Good", "Easy"],
    verdicts: { reinforce: "Needs reinforcement", review: "Needs review", mastered: "Apparent mastery" },
    votingTitle: "Student vote",
    votingOpen: "Start voting",
    votingClose: "Pause voting",
    votingHint: "Each student votes from their phone, no account needed; voting follows each word.",
    votingJoin: "Go to",
    votingCode: "code",
    votingNoData: "Not enough votes yet",
    votingCombined: "With your rating",
    votesCount: (n: number) => (n === 1 ? "1 vote" : `${n} votes`),
  },
};

export type StudentLabels = (typeof LABELS)["es"];

export function studentLabels(language: ContentLanguage): StudentLabels {
  return LABELS[language];
}
