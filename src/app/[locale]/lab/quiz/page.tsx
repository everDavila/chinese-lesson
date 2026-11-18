import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { QuizLab } from "@/components/lab/quiz-lab";
import type { NoteTerm } from "@/lib/lesson-types";
import { shortMeaning, type QuizWord } from "@/lib/quiz";
import { pickExample, type RawSentence } from "@/lib/quiz-data";
import level1 from "../../../../../contenido/hsk3-level1.json";
import level2 from "../../../../../contenido/hsk3-level2.json";
import level3 from "../../../../../contenido/hsk3-level3.json";
import meanings1 from "../../../../../contenido/significados-hsk1-sin-curar.json";
import meanings2 from "../../../../../contenido/significados-hsk2-sin-curar.json";
import meanings3 from "../../../../../contenido/significados-hsk3-sin-curar.json";
import examples1 from "../../../../../contenido/ejemplos-hsk1-curados-codex.json";
import examples2 from "../../../../../contenido/ejemplos-hsk2-curados-codex.json";
import examples3 from "../../../../../contenido/ejemplos-hsk3-curados-codex.json";

// Piloto de quiz con tres modos (reconocer, tonos, escuchar) y palabras de
// HSK 1 a 3. Los significados son los del borrador sin curar y las frases las
// curadas por Codex; no toca la base. El armado de la ronda vive en
// src/lib/quiz.ts y la elección de la frase en src/lib/quiz-data.ts.
export const metadata: Metadata = {
  title: "Quiz · piloto · Renshi",
  robots: { index: false },
};

type Source = {
  level: 1 | 2 | 3;
  words: { hanzi: string; pinyin: string; partOfSpeech?: string | null }[];
  meanings: { hanzi: string; meaningEs: string }[];
  examples: { hanzi: string; sentences: RawSentence[] }[];
};

const SOURCES: Source[] = [
  { level: 1, words: level1.words, meanings: meanings1.meanings, examples: examples1.examples },
  { level: 2, words: level2.words, meanings: meanings2.meanings, examples: examples2.examples },
  { level: 3, words: level3.words, meanings: meanings3.meanings, examples: examples3.examples },
];

// Nivel en que aparece cada carácter: una frase solo vale si todos sus
// caracteres son del nivel de la palabra o de uno más fácil.
function charLevels(): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of SOURCES) for (const w of s.words) for (const ch of w.hanzi) if (!out.has(ch)) out.set(ch, s.level);
  return out;
}

// Categoría principal (sin «名、动»…) para elegir distractores del mismo tipo, y
// significados cortos y únicos para que quepan en un botón.
function words(): QuizWord[] {
  const levels = charLevels();
  const levelOf = (ch: string) => levels.get(ch) ?? Infinity;
  const seen = new Set<string>();
  const out: QuizWord[] = [];
  for (const s of SOURCES) {
    const es = new Map(s.meanings.map((m) => [m.hanzi, m.meaningEs]));
    const sentences = new Map(s.examples.map((e) => [e.hanzi, e.sentences]));
    for (const w of s.words) {
      const meaning = es.get(w.hanzi);
      const pos = w.partOfSpeech?.split("、")[0];
      if (!meaning || !pos || pos.includes("（")) continue;
      const short = shortMeaning(meaning);
      if (short.length > 26 || seen.has(short) || seen.has(w.hanzi)) continue;
      seen.add(short);
      seen.add(w.hanzi);
      const example = pickExample(sentences.get(w.hanzi) ?? [], s.level, levelOf) ?? undefined;
      out.push({ hanzi: w.hanzi, pinyin: w.pinyin, es: short, pos, level: s.level, example });
    }
  }
  return out;
}

// Ayuda por palabra en las frases: pinyin y significado corto de las 1000
// palabras de HSK 1 a 3, para que al tocar una de la frase se vea qué es.
function terms(): Record<string, NoteTerm> {
  const out: Record<string, NoteTerm> = {};
  for (const s of SOURCES) {
    const es = new Map(s.meanings.map((m) => [m.hanzi, m.meaningEs]));
    for (const w of s.words) {
      const meaning = es.get(w.hanzi);
      if (meaning && !out[w.hanzi]) out[w.hanzi] = { hanzi: w.hanzi, pinyin: w.pinyin, meaning: { es: shortMeaning(meaning), en: "" } };
    }
  }
  return out;
}

export default async function Page({ params }: PageProps<"/[locale]/lab/quiz">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <QuizLab words={words()} terms={terms()} />
      <LabHistory slug="quiz" />
    </>
  );
}
