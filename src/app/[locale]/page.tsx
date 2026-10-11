import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createDemoLessonAction, startSessionAction } from "@/actions/class";
import { signOut } from "@/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getDemoLesson } from "@/lib/demo-lesson";
import { currentUserId, listLessons } from "@/lib/lessons";

// Inicio. Sin sesión: la lección de demo local. Con sesión: las lecciones del
// docente en Supabase y el botón para empezar una clase. Lo que lee la
// sesión va dentro de <Suspense> (Cache Components: el resto es estático).
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
  const teacherId = await currentUserId();
  if (!teacherId) return <Guest />;

  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");
  const lessons = await listLessons();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{tc("appName")}</p>
          <h1 className="text-3xl font-semibold">{t("myLessons")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              {tc("signOut")}
            </Button>
          </form>
        </div>
      </header>

      {lessons.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6">
          <p>{t("noLessons")}</p>
          <form action={createDemoLessonAction}>
            <Button type="submit" size="lg">
              {t("createDemo")}
            </Button>
          </form>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {lessons.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-muted-foreground">{t("words", { count: l.items })}</p>
              </div>
              <form action={startSessionAction.bind(null, l.id)}>
                <Button type="submit" size="lg">
                  {t("startClass")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">{t("shortcuts")}</p>
    </main>
  );
}

async function Guest() {
  const t = await getTranslations("Home");
  const lesson = getDemoLesson();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("demoBadge")}</p>
          <h1 className="text-3xl font-semibold">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm underline-offset-4 hover:underline">
            {t("teacherAccess")}
          </Link>
        </div>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {lesson.items.map((it) => (
          <li key={it.word.hanzi} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="font-hanzi text-3xl">{it.word.hanzi}</p>
            <p className="text-sm text-muted-foreground">{it.word.senses[it.senseIndex].pinyin}</p>
            <p className="text-xs text-muted-foreground">HSK {it.word.hsk}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/present"
        className="self-start rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/85"
      >
        {t("presentDemo")}
      </Link>
      <p className="text-sm text-muted-foreground">{t("shortcuts")}</p>
    </main>
  );
}
