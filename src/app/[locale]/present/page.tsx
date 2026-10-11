import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Presentation } from "@/components/present/presentation";
import { getDemoLesson } from "@/lib/demo-lesson";

export const metadata: Metadata = { title: "Hanzi" };

// Modo presentación para compartir pantalla en clase. Sin navegación: la
// lección entera llega precargada, así que sigue funcionando sin conexión.
// ?palabras=家,认识 presenta solo esas palabras, en ese orden (lo usa el
// prototipo de colecciones); sin el parámetro, la lección de demo completa.
export default async function PresentPage({ params, searchParams }: PageProps<"/[locale]/present">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="h-dvh" aria-busy />}>
      <FilteredPresentation searchParams={searchParams} />
    </Suspense>
  );
}

async function FilteredPresentation({ searchParams }: { searchParams: PageProps<"/[locale]/present">["searchParams"] }) {
  const lesson = getDemoLesson();
  const raw = (await searchParams).palabras;
  const wanted = (Array.isArray(raw) ? raw.join(",") : (raw ?? "")).split(",").map((s) => s.trim()).filter(Boolean);
  if (!wanted.length) return <Presentation lesson={lesson} />;

  const items = wanted
    .map((h) => lesson.items.find((it) => it.word.hanzi === h))
    .filter((it): it is NonNullable<typeof it> => Boolean(it));
  return <Presentation lesson={{ ...lesson, items: items.length ? items : lesson.items }} />;
}
