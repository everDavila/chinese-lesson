import type { Metadata } from "next";
import { Presentation } from "@/components/present/presentation";
import { getDemoLesson } from "@/lib/demo-lesson";

export const metadata: Metadata = { title: "Presentación · Hanzi" };

// Modo presentación para compartir pantalla en clase. Sin navegación: la
// lección entera llega precargada, así que sigue funcionando sin conexión.
export default function PresentPage() {
  return <Presentation lesson={getDemoLesson()} />;
}
