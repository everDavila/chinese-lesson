// Tipos del contenido de una lección tal como lo consume la interfaz.
// Coinciden con contenido/leccion-demo.json y data/characters.json; cuando
// el contenido venga de Supabase, el cargador devolverá estos mismos tipos.

export type Bilingual = { es: string; en: string };

export type Sentence = {
  /** Clave para la rotación entre clases; ausente en la demo local. */
  key?: string;
  zh: string;
  pinyin: string;
  es: string;
  en: string;
  /** Estado editorial: los borradores de IA deben verse como tales en clase. */
  status?: "unreviewed" | "reviewed" | "corrected";
};

export type Sense = {
  pinyin: string;
  category: string;
  meaning: Bilingual;
  nuance?: Bilingual;
  sentences: Sentence[];
};

export type Word = {
  hanzi: string;
  hsk: number;
  culturalNote?: Bilingual;
  senses: Sense[];
};

export type StrokeRole = "semantic" | "phonetic" | "other";

export type CharacterInfo = {
  pinyin: string[];
  radical: string | null;
  decomposition: string;
  components: { char: string; role: StrokeRole; pinyin: string | null }[];
  etymology: {
    type: "ideographic" | "pictographic" | "pictophonetic";
    semantic?: string;
    phonetic?: string;
    hint?: string;
  } | null;
  strokeRoles: StrokeRole[];
};

// Formato de hanzi-writer-data: contornos de cada trazo y su línea central.
export type StrokeData = {
  strokes: string[];
  medians: [number, number][][];
};

export type CharacterCard = {
  char: string;
  info: CharacterInfo | null;
  strokes: StrokeData | null;
};

// Un elemento de la lección: una palabra con el sentido que se enseña hoy.
export type LessonItem = {
  /** Id del sentido en Supabase; ausente en la lección de demo local. */
  senseId?: string;
  word: Word;
  senseIndex: number;
  characters: CharacterCard[];
};

export type NoteTerm = {
  hanzi: string;
  pinyin: string;
  meaning: Bilingual;
};

export type Lesson = {
  title: string;
  items: LessonItem[];
  componentMeanings: Record<string, Bilingual>;
  noteTerms?: Record<string, NoteTerm>;
};
