import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Presentation } from "@/components/present/presentation";
import { getSharedLesson } from "@/lib/demo-lesson";

// Que los buscadores no indexen las lecciones compartidas.
export const metadata: Metadata = { title: "Renshi", robots: { index: false, follow: false } };

// Lección compartida por su docente (/l/<código>): modo presentación sin
// login, como la clase de ejemplo, con todo lo que ella puso y sin votación.
// Se lee sin caché (dentro de <Suspense>): si deja de compartirla, el enlace
// muere al instante.
// El código de la dirección también se lee dentro del <Suspense> (Cache
// Components): fuera, bloquea la carga.
export default function SharedLessonPage({ params }: PageProps<"/[locale]/l/[code]">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <SharedLesson params={params} />
    </Suspense>
  );
}

async function SharedLesson({ params }: { params: PageProps<"/[locale]/l/[code]">["params"] }) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const lesson = await getSharedLesson(code);
  if (!lesson) notFound();
  return <Presentation lesson={lesson} />;
}
