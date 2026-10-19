import { Suspense } from "react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { Landing } from "@/components/landing/landing";
import { TeacherDashboard } from "@/components/manage/teacher-dashboard";
import { redirect } from "@/i18n/navigation";
import { getDemoLesson } from "@/lib/demo-lesson";
import { getProfile, listTeacherLessons, listTeacherPins } from "@/lib/content";

// Inicio. Sin sesión: la portada pública para profesoras (con la Lección de
// ejemplo). Con sesión: /admin o el espacio de preparación docente. Lo que lee la sesión va dentro de <Suspense> (Cache
// Components: el resto es estático).
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  // Con sesión: el admin a la base común; la docente prepara desde aquí.
  const profile = await getProfile();
  if (profile?.role === "admin") redirect({ href: "/admin", locale: await getLocale() });
  if (profile) {
    const [lessons, pins] = await Promise.all([listTeacherLessons(), listTeacherPins()]);
    return <TeacherDashboard isAdmin={false} lessons={lessons} pins={pins} />;
  }
  return <Guest />;
}

async function Guest() {
  // La portada muestra 认识 de la Lección de ejemplo (la demo de la base).
  const lesson = await getDemoLesson();
  const item = lesson?.items.find((it) => it.word.hanzi === "认识") ?? lesson?.items[0] ?? null;
  return <Landing item={item} noteTerms={lesson?.noteTerms} />;
}
