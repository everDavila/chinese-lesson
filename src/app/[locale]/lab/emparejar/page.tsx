import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { MatchingLab } from "@/components/lab/matching-lab";
import type { MatchWord } from "@/lib/matching";
import level1 from "../../../../../contenido/hsk3-level1.json";

// Piloto «emparejar»: arrastrar cada hanzi al hueco de su pinyin, con palabras
// de HSK 1. No toca la base. El armado de la tanda vive en src/lib/matching.ts.
export const metadata: Metadata = {
  title: "Emparejar · piloto · Renshi",
  robots: { index: false },
};

function words(): MatchWord[] {
  return level1.words.filter((w) => w.hanzi && w.pinyin).map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin }));
}

export default async function Page({ params }: PageProps<"/[locale]/lab/emparejar">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <MatchingLab words={words()} />
      <LabHistory slug="emparejar" />
    </>
  );
}
