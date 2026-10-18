import { Suspense } from "react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TeacherDashboard } from "@/components/manage/teacher-dashboard";
import { Link, redirect } from "@/i18n/navigation";
import { getDemoLesson } from "@/lib/demo-lesson";
import { getProfile, listTeacherLessons, listTeacherPins } from "@/lib/content";

// Inicio. Sin sesión: la lección de ejemplo (demo pública, desde la base). Con sesión: /admin o el espacio
// de preparación docente. Lo que lee la sesión va dentro de <Suspense> (Cache
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
  const t = await getTranslations("Home");
  const lesson = await getDemoLesson();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("demoBadge")}</p>
          <h1 className="text-3xl font-semibold">{lesson?.title ?? "Renshi"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm underline-offset-4 hover:underline">
            {t("teacherAccess")}
          </Link>
        </div>
      </header>
      {/* Antes de la lista, qué es y el botón para probarlo (auditoría UX, P2). */}
      <section className="flex flex-col items-start gap-4">
        <p className="max-w-2xl text-lg">{t("demoIntro")}</p>
        {lesson && (
          <Link href="/present" className="rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/85">
            {t("presentDemo")}
          </Link>
        )}
      </section>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {lesson?.items.map((it) => (
          <li key={it.word.hanzi} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="font-hanzi text-3xl">{it.word.hanzi}</p>
            <p className="text-sm text-muted-foreground">{it.word.senses[it.senseIndex].pinyin}</p>
            <p className="text-xs text-muted-foreground">HSK {it.word.hsk}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">{t("shortcuts")}</p>
    </main>
  );
}
