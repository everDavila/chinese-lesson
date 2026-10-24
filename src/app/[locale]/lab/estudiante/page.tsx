import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { StudentCard } from "@/components/student/student-card";
import { getDemoLesson } from "@/lib/demo-lesson";

// Tarjeta del alumno (piloto): practicar los trazos de cada palabra de la
// lección de ejemplo, valorar y ver la ficha. Sin cuenta ni base propia: el
// avance queda en el dispositivo. Enlazada desde el índice del laboratorio.
export const metadata: Metadata = {
  title: "Tarjeta del alumno · prueba · Renshi",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/[locale]/lab/estudiante">) {
  return (
    <>
      <Suspense fallback={<main className="flex-1" aria-busy />}>
        <Student params={params} />
      </Suspense>
      <Suspense>
        <History params={params} />
      </Suspense>
    </>
  );
}

async function Student({ params }: { params: PageProps<"/[locale]/lab/estudiante">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lesson = await getDemoLesson();
  if (!lesson) notFound();
  return <StudentCard lesson={lesson} />;
}

async function History({ params }: { params: PageProps<"/[locale]/lab/estudiante">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LabHistory slug="estudiante" />;
}
