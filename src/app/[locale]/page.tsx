import { Suspense } from "react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link, redirect } from "@/i18n/navigation";
import { getDemoLesson } from "@/lib/demo-lesson";
import { currentUserId } from "@/lib/lessons";

// Inicio. Sin sesión: la lección de demo local. Con sesión: las colecciones
// del docente. Lo que lee la sesión va dentro de <Suspense> (Cache
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
  if (await currentUserId()) redirect({ href: "/collections", locale: await getLocale() });
  return <Guest />;
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
