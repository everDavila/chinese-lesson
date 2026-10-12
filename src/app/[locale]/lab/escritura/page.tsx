import type { Metadata } from "next";
import { WritingLab } from "@/components/lab/writing-lab";

// Prueba de escritura (Hanzi Writer, modo quiz) para calibrar la tolerancia
// en el celular. No está enlazada desde la app ni toca la base.
export const metadata: Metadata = { title: "Escritura · prueba · Renshi", robots: { index: false } };

export default function Page() {
  return <WritingLab />;
}
