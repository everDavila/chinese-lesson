import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { StudentCard } from "@/components/student/student-card";
import { StudentShell } from "@/components/student/student-shell";
import { getDemoLesson } from "@/lib/demo-lesson";
import { requireProfile } from "@/lib/guard";

// Práctica del alumno: la tarjeta de trazos sobre la lección de ejemplo, ya
// dentro del espacio del alumno (el piloto sigue en /lab/estudiante). Pide
// sesión: sin ella, al login.
export const metadata: Metadata = {
  title: "Practicar · Renshi",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/[locale]/estudiante">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Practice params={params} />
    </Suspense>
  );
}

async function Practice({ params }: { params: PageProps<"/[locale]/estudiante">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await requireProfile();
  const lesson = await getDemoLesson();
  if (!lesson) notFound();
  return (
    <StudentShell name={profile.displayName}>
      <StudentCard lesson={lesson} />
    </StudentShell>
  );
}
