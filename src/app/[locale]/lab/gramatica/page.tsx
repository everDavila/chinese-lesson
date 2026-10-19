import type { Metadata } from "next";
import { GrammarLab } from "@/components/lab/grammar-lab";

// Piloto de gramática: armar frases con un punto de HSK 1. Datos en
// contenido/gramatica-hsk1-piloto.json; no está enlazada desde la app ni
// toca la base.
export const metadata: Metadata = { title: "Gramática · piloto · Renshi", robots: { index: false } };

export default function Page() {
  return <GrammarLab />;
}
