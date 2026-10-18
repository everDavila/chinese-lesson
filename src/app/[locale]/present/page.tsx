import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Presentation } from "@/components/present/presentation";
import { getDemoLesson } from "@/lib/demo-lesson";

export const metadata: Metadata = { title: "Renshi" };

// Modo presentación de la demo pública, sin login: la lección de ejemplo de
// la base (en caché). Las clases reales van por /present/session/[id].
export default async function PresentPage({ params }: PageProps<"/[locale]/present">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lesson = await getDemoLesson();
  if (!lesson) notFound();
  return <Presentation lesson={lesson} />;
}
