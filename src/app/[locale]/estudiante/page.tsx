import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PracticePicker } from "@/components/student/practice-picker";
import { StudentCard } from "@/components/student/student-card";
import { StudentShell } from "@/components/student/student-shell";
import { StudyCard } from "@/components/student/study-card";
import { Link } from "@/i18n/navigation";
import { hskLevelCounts } from "@/lib/content";
import { requireProfile } from "@/lib/guard";
import { getPracticeLesson } from "@/lib/lessons";
import { DEFAULT_AMOUNT, PRACTICE_AMOUNTS, parseExercise, skillOf, type ThemeGroup } from "@/lib/practice-pick";
import { getBookmarkIds } from "@/lib/student-progress";
import { listThemes, planPractice } from "@/lib/student-practice";
import { getDueWords, getStudentStats } from "@/lib/student-stats";

// Práctica del alumno. Sin parámetros: elige ejercicio, cantidad y fuente
// (nivel HSK o tema del sistema). Con ?fuente=hsk-1&n=20&ejercicio=tarjeta
// abre esa práctica: «tarjeta» (estudiar: ve cómo se dibuja, recuerda y se
// valora) o «escribir» (trazos). ?repaso=1 (vencidas), ?repaso=dificiles o
// ?repaso=favoritas practican esas palabras, vengan del nivel o tema que
// vengan. Pide sesión: sin ella, al login.
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

const GROUP_ORDER: ThemeGroup[] = ["situations", "topics", "wordTypes", "functions", "other"];
const GROUP_KEY = { situations: "groupSituations", topics: "groupTopics", wordTypes: "groupWordTypes", functions: "groupFunctions", other: "groupOther" } as const;

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
  const t = await getTranslations("StudentWorkspace");
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const exercise = parseExercise(one(sp.ejercicio));
  const skill = skillOf(exercise);
  const shell = (children: React.ReactNode) => <StudentShell name={profile.displayName}>{children}</StudentShell>;
  const empty = (title: string, text: string) =>
    shell(
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{text}</p>
        <Link href="/estudiante" className="text-primary hover:underline">{t("pickBack")}</Link>
      </main>,
    );

  const bookmarks = await getBookmarkIds();
  let title: string | null = null;
  let senseIds: string[] = [];

  const repaso = one(sp.repaso);
  if (repaso) {
    if (repaso === "dificiles") {
      senseIds = (await getStudentStats()).hardIds;
      title = t("modeHard");
      if (!senseIds.length) return empty(t("hardEmptyTitle"), t("hardEmptyText"));
    } else if (repaso === "favoritas") {
      senseIds = bookmarks;
      title = t("favTitle");
      if (!senseIds.length) return empty(t("favEmptyTitle"), t("favNone"));
    } else {
      senseIds = (await getDueWords(skill)).map((d) => d.senseId);
      title = t("modeDue");
      if (!senseIds.length) return empty(t("reviewUpToDate"), t("reviewNone"));
    }
  } else if (one(sp.fuente)) {
    const plan = await planPractice(one(sp.fuente), one(sp.n), skill);
    if (!plan) return empty(t("pickInvalid"), t("pickInvalidText"));
    if (plan.done) return empty(t("pickDoneTitle"), t("pickDoneText"));
    title = plan.title;
    senseIds = plan.senseIds;
  }

  if (title === null) {
    const [counts, themes] = await Promise.all([hskLevelCounts(), listThemes()]);
    const levels = [1, 2, 3, 4, 5, 6, 7].map((l) => ({
      value: `hsk-${l}`,
      title: l === 7 ? t("levelBand") : t("levelName", { n: l }),
      hint: t("pickWords", { n: counts[l] ?? 0 }),
    }));
    const themeGroups = GROUP_ORDER.map((g) => ({
      key: g,
      title: t(GROUP_KEY[g]),
      options: themes.filter((th) => th.group === g).map((th) => ({ value: `tema-${th.id}`, title: th.title, hint: t("pickWords", { n: th.words }) })),
    })).filter((g) => g.options.length > 0);
    return shell(
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-8 sm:px-6">
        <header>
          <h1 className="text-3xl font-semibold">{t("pickTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("pickHint")}</p>
        </header>
        <PracticePicker levels={levels} themeGroups={themeGroups} amounts={[...PRACTICE_AMOUNTS]} defaultAmount={DEFAULT_AMOUNT} />
      </main>,
    );
  }

  const lesson = await getPracticeLesson(title, senseIds);
  if (!lesson) return empty(t("pickInvalid"), t("pickInvalidText"));
  const key = `${exercise}:${title}:${senseIds.join(",")}`;
  return shell(
    exercise === "card" ? (
      <StudyCard key={key} lesson={lesson} signedIn bookmarked={bookmarks} />
    ) : (
      <StudentCard key={key} lesson={lesson} signedIn bookmarked={bookmarks} />
    ),
  );
}
