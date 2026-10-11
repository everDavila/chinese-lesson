import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Presentation } from "@/components/present/presentation";
import { getDemoLesson } from "@/lib/demo-lesson";

export const metadata: Metadata = { title: "Hanzi" };

// Modo presentación para compartir pantalla en clase. Sin navegación: la
// lección entera llega precargada, así que sigue funcionando sin conexión.
export default async function PresentPage({ params }: PageProps<"/[locale]/present">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Presentation lesson={getDemoLesson()} />;
}
