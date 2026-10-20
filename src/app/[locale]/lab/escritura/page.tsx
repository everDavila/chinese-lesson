import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { WritingLab } from "@/components/lab/writing-lab";

// Prueba de escritura (Hanzi Writer, modo quiz) para calibrar la tolerancia
// en el celular. Enlazada desde el índice del laboratorio; no toca la base.
export const metadata: Metadata = {
  title: "Escritura · prueba · Renshi",
  robots: { index: false },
};

export default async function Page({ params }: PageProps<"/[locale]/lab/escritura">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <WritingLab />
      <LabHistory slug="escritura" />
    </>
  );
}
