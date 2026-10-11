import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Presentation } from "@/components/present/presentation";
import { getDemoLesson } from "@/lib/demo-lesson";

export const metadata: Metadata = { title: "Hanzi" };

// Modo presentación de la demo pública, sin login. Sin navegación: la
// lección entera llega precargada, así que sigue funcionando sin conexión.
// Las clases reales van por /present/session/[id].
export default async function PresentPage({ params }: PageProps<"/[locale]/present">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Presentation lesson={getDemoLesson()} />;
}
