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
      onomatopoeia: "onomatopeya",
    } as Record<string, string>,
    listenWord: "Escuchar la palabra",
    listenSentence: "Escuchar la frase",
    showPinyin: "Mostrar pinyin",
    hidePinyin: "Ocultar pinyin",
    showTranslation: "Mostrar traducción",
    hideTranslation: "Ocultar traducción",
    close: "Cerrar",
    howItsBuilt: "Cómo se forma",
    hskNote: "Basado en el nuevo HSK 3.0 (2025), que contempla 9 niveles.",
    // Palabra del catálogo sin frases: la tarjeta propone crear una en clase.
    inventTitle: "Inventen una frase con",
    inventHint: "Díganla en voz alta; la profesora la corrige.",
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
    votingReconnecting: "Sin conexión, reintentando…",
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
      onomatopoeia: "onomatopoeia",
    } as Record<string, string>,
    listenWord: "Listen to the word",
    listenSentence: "Listen to the sentence",
    showPinyin: "Show pinyin",
    hidePinyin: "Hide pinyin",
    showTranslation: "Show translation",
    hideTranslation: "Hide translation",
    close: "Close",
    howItsBuilt: "How it's built",
    hskNote: "Based on the new HSK 3.0 standard (2025), which has 9 levels.",
    inventTitle: "Make up a sentence with",
    inventHint: "Say it out loud; the teacher will correct it.",
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
    votingReconnecting: "Connection lost, retrying…",
    votingCombined: "With your rating",
    votesCount: (n: number) => (n === 1 ? "1 vote" : `${n} votes`),
  },
};

export type StudentLabels = (typeof LABELS)["es"];

export function studentLabels(language: ContentLanguage): StudentLabels {
  return LABELS[language];
}

// El temario HSK 3.0 (niveles 4–9, de Codex) trae la categoría en chino
// abreviado y a veces combinada: "动、名", "名、（动）". Entre paréntesis va un
// uso secundario: no se muestra.
const ZH_CATEGORY: Record<string, string> = {
  名: "noun",
  动: "verb",
  形: "adjective",
  副: "adverb",
  连: "conjunction",
  量: "measure word",
  代: "pronoun",
  数: "numeral",
  数量: "numeral",
  介: "preposition",
  助: "particle",
  叹: "interjection",
  前缀: "affix",
  后缀: "affix",
  拟声: "onomatopoeia",
};

/** "动、名" → "verbo / sustantivo"; "noun" → "sustantivo". Como mucho dos. */
export function categoryLabel(category: string, labels: StudentLabels): string {
  if (!category) return "";
  if (labels.categories[category]) return labels.categories[category];
  const main = category.replace(/（[^）]*）/g, "").split("、").map((c) => c.trim()).filter(Boolean);
  if (!main.length) return category;
  const names = [...new Set(main.map((c) => labels.categories[ZH_CATEGORY[c] ?? c] ?? c))];
  return names.slice(0, 2).join(" / ");
}
