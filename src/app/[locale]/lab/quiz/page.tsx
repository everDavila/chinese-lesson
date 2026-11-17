import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { QuizLab } from "@/components/lab/quiz-lab";
import { shortMeaning, type QuizWord } from "@/lib/quiz";
import level1 from "../../../../../contenido/hsk3-level1.json";
import meanings1 from "../../../../../contenido/significados-hsk1-sin-curar.json";

// Piloto de quiz mixto: elegir entre 4 y verdadero/falso en una misma ronda,
// con palabras de HSK 1. Los significados son los del borrador sin curar; no
// toca la base. El armado de la ronda vive en src/lib/quiz.ts.
export const metadata: Metadata = {
  title: "Quiz · piloto · Renshi",
  robots: { index: false },
};

// Solo categorías simples (sin «名、动»…) para que los distractores sean del
// mismo tipo, y significados cortos para que quepan en un botón.
function words(): QuizWord[] {
  const es = new Map(meanings1.meanings.map((m) => [m.hanzi, m.meaningEs]));
  const seen = new Set<string>();
  const out: QuizWord[] = [];
  for (const w of level1.words) {
    const meaning = es.get(w.hanzi);
    const pos = w.partOfSpeech;
    if (!meaning || !pos || /[、（]/.test(pos)) continue;
    const short = shortMeaning(meaning);
    if (short.length > 26 || seen.has(short)) continue;
    seen.add(short);
    out.push({ hanzi: w.hanzi, pinyin: w.pinyin, es: short, pos });
  }
  return out;
}

export default async function Page({ params }: PageProps<"/[locale]/lab/quiz">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <QuizLab words={words()} />
      <LabHistory slug="quiz" />
    </>
  );
}
