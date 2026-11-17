import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { TarjetasPrototipo } from "@/components/lab/tarjetas-prototipo";
import { getDemoLesson } from "@/lib/demo-lesson";

// Prototipo de las tarjetas del alumno (Aprender y Escribir). No guarda nada.
export const metadata: Metadata = {
  title: "Tarjetas del alumno, versión nueva · prueba · Renshi",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/[locale]/lab/tarjetas">) {
  return (
    <>
      <Suspense fallback={<main className="flex-1" aria-busy />}>
        <Proto params={params} />
      </Suspense>
      <Suspense>
        <History params={params} />
      </Suspense>
    </>
  );
}

async function Proto({ params }: { params: PageProps<"/[locale]/lab/tarjetas">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lesson = await getDemoLesson();
  if (!lesson) notFound();
  return <TarjetasPrototipo lesson={lesson} />;
}

async function History({ params }: { params: PageProps<"/[locale]/lab/tarjetas">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LabHistory slug="tarjetas" />;
}
