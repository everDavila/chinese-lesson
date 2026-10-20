import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { GrammarLab } from "@/components/lab/grammar-lab";

// Piloto de gramática: armar frases con un punto de HSK 1. Datos en
// contenido/gramatica-hsk1-piloto.json; enlazada desde el índice del
// laboratorio; no toca la base.
export const metadata: Metadata = {
  title: "Gramática · piloto · Renshi",
  robots: { index: false },
};

export default async function Page({ params }: PageProps<"/[locale]/lab/gramatica">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <GrammarLab />
      <LabHistory slug="gramatica" />
    </>
  );
}
