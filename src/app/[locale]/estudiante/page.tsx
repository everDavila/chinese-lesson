import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { StudentCard } from "@/components/student/student-card";
import { StudentShell } from "@/components/student/student-shell";
import { getDemoLesson } from "@/lib/demo-lesson";
import { getDueWords } from "@/lib/student-stats";
import { Link } from "@/i18n/navigation";
import { requireProfile } from "@/lib/guard";

// Práctica del alumno: la tarjeta de trazos sobre la lección de ejemplo, ya
// dentro del espacio del alumno (el piloto sigue en /lab/estudiante). Pide
// sesión: sin ella, al login.
export const metadata: Metadata = {
  title: "Practicar · Renshi",
  robots: { index: false },
};

export default function Page({ params, searchParams }: PageProps<"/[locale]/estudiante">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Practice params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Practice({
  params,
  searchParams,
}: {
  params: PageProps<"/[locale]/estudiante">["params"];
  searchParams: PageProps<"/[locale]/estudiante">["searchParams"];
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await requireProfile();
  let lesson = await getDemoLesson();
  if (!lesson) notFound();

  // ?repaso=1: solo las palabras que toca repasar. Hoy todas salen de la
  // lección de ejemplo; cuando haya colecciones de estudio, aquí se arma la
  // lección con los sentidos pendientes.
  if ((await searchParams).repaso) {
    const due = await getDueWords();
    const order = new Map(due.map((d, i) => [d.senseId, i]));
    const items = lesson.items.filter((it) => it.senseId && order.has(it.senseId)).sort((a, b) => order.get(a.senseId!)! - order.get(b.senseId!)!);
    if (!items.length) {
      return (
        <StudentShell name={profile.displayName}>
          <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
            <h1 className="text-2xl font-semibold">Estás al día</h1>
            <p className="text-muted-foreground">No tienes palabras por repasar ahora. Vuelve más tarde o practica otras.</p>
            <Link href="/estudiante" className="text-primary hover:underline">Practicar la lección</Link>
          </main>
        </StudentShell>
      );
    }
    lesson = { ...lesson, title: "Repaso de hoy", items };
  }
  return (
    <StudentShell name={profile.displayName}>
      <StudentCard lesson={lesson} signedIn />
    </StudentShell>
  );
}
