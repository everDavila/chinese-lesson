import { Download, Heart, PenLine, RotateCcw, TrendingUp, TriangleAlert } from "lucide-react";
import type { DueWord, StudentStats } from "@/lib/student-stats";
import { getLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DEFAULT_GOAL_MINUTES, GOAL_OPTIONS, type LevelProgress, type Streak } from "@/lib/student-progress";
import { DailyGoal } from "./daily-goal";
import { LevelProgressList } from "./level-progress";
import { MasteryStars } from "./mastery-stars";
import { StudentShell } from "./student-shell";
import { ToneCurves } from "./tone-curves";
import { WeekStreak } from "./week-streak";

// Inicio del alumno. Hoy solo ofrece lo que existe: practicar y saber con qué
// cuenta está. El resumen de lo que le cuesta se llena cuando la tarjeta
// guarde eventos con sesión (docs/DISENO-AVANCE-ESTUDIANTE.md).
export async function StudentHome({
  name,
  stats,
  dueCards,
  dueWrite,
  streak,
  levels,
  favorites,
}: {
  name: string;
  stats: StudentStats;
  dueCards: DueWord[];
  dueWrite: DueWord[];
  streak: Streak;
  levels: LevelProgress[];
  favorites: number;
}) {
  const t = await getTranslations("StudentWorkspace");
  const locale = await getLocale();
  const exportHref = `${locale === routing.defaultLocale ? "" : `/${locale}`}/estudiante/exportar`;
  const minutes = Math.round(stats.weekActiveMs / 60_000);
  return (
    <StudentShell name={name}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <header>
          <h1 className="text-3xl font-semibold">{t("greeting", { name })}</h1>
          <p className="mt-1 text-muted-foreground">{t("intro")}</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <WeekStreak streak={streak} />
          <DailyGoal todayMs={streak.todayMs} goalMinutes={streak.goalMinutes ?? DEFAULT_GOAL_MINUTES} options={GOAL_OPTIONS} />
        </div>

        <section aria-labelledby="review-title" className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><RotateCcw className="size-6" aria-hidden /></span>
            <div className="min-w-48 flex-1">
              <h2 id="review-title" className="text-lg font-semibold">{t("reviewTitle")}</h2>
              {dueCards.length + dueWrite.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("reviewNone")}</p>
              ) : (
                <>
                  {dueCards.length > 0 && <p className="text-sm text-muted-foreground">{t("reviewDueCards", { n: dueCards.length })}</p>}
                  {dueWrite.length > 0 && <p className="text-sm text-muted-foreground">{t("reviewDueWrite", { n: dueWrite.length })}</p>}
                  <p lang="zh-Hans" className="mt-2 font-hanzi text-2xl tracking-wider">
                    {[...new Map([...dueCards, ...dueWrite].map((w) => [w.senseId, w.hanzi])).values()].slice(0, 6).join(" ")}
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {dueCards.length > 0 && <Link href="/estudiante?repaso=1&ejercicio=tarjeta" className={cn(buttonVariants())}>{t("reviewCtaCards")}</Link>}
              {dueWrite.length > 0 && <Link href="/estudiante?repaso=1&ejercicio=escribir" className={cn(buttonVariants({ variant: dueCards.length > 0 ? "outline" : "default" }))}>{t("reviewCtaWrite")}</Link>}
            </div>
          </div>
        </section>

        <section aria-labelledby="practice-title" className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><PenLine className="size-6" aria-hidden /></span>
            <div className="min-w-48 flex-1">
              <h2 id="practice-title" className="text-lg font-semibold">{t("practiceTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("practiceHint")}</p>
            </div>
            <Link href="/estudiante" className={cn(buttonVariants())}>{t("practiceCta")}</Link>
          </div>
        </section>

        <section aria-labelledby="progress-title" className="space-y-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-1 size-5 text-primary" aria-hidden />
            <div>
              <h2 id="progress-title" className="text-lg font-semibold">{t("progressTitle")}</h2>
              <p className="text-sm text-muted-foreground">{stats.wordsPracticed ? t("progressHint") : t("progressEmpty")}</p>
            </div>
          </div>
          {stats.wordsPracticed > 0 && (
            <>
              <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label={t("statTime")} value={t("minutes", { n: minutes })} />
                <Stat label={t("statAttempts")} value={String(stats.weekAttempts)} />
                <Stat label={t("statPracticed")} value={String(stats.wordsPracticed)} />
                <Stat label={t("statKnown")} value={String(stats.wordsKnown)} />
              </dl>
              {stats.hard.length > 0 ? (
                <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <TriangleAlert className="size-5 text-primary" aria-hidden />
                  <div className="min-w-48 flex-1">
                    <h3 className="font-semibold">{t("weakTitle")}</h3>
                    <p className="text-sm text-muted-foreground">{t("weakHint", { n: stats.hardCount })}</p>
                  </div>
                  <Link href="/estudiante?repaso=dificiles" className={cn(buttonVariants({ variant: "outline" }))}>{t("weakCta")}</Link>
                </div>
                <ul className="overflow-hidden rounded-xl border border-border bg-card">
                  {stats.hard.map((w) => (
                    <li key={w.senseId} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-b-0">
                      <span lang="zh-Hans" className="font-hanzi text-3xl">{w.hanzi}</span>
                      <span className="min-w-40 flex-1">
                        <span lang="zh-Latn" className="block text-sm text-muted-foreground">{w.pinyin}</span>
                        <ToneCurves pinyin={w.pinyin} className="mt-0.5" />
                        <span className="block truncate">{w.meaningEs}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <MasteryStars stars={w.stars} />
                        <span className="text-sm text-muted-foreground">{t("hardMeta", { wrong: w.wrong, attempts: w.attempts })}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{t("hardNone")}</p>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="fav-title" className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><Heart className="size-6" aria-hidden /></span>
            <div className="min-w-48 flex-1">
              <h2 id="fav-title" className="text-lg font-semibold">{t("favTitle")}</h2>
              <p className="text-sm text-muted-foreground">{favorites ? t("favCount", { n: favorites }) : t("favNone")}</p>
            </div>
            {favorites > 0 && <Link href="/estudiante?repaso=favoritas" className={cn(buttonVariants({ variant: "outline" }))}>{t("favCta")}</Link>}
          </div>
        </section>

        <section aria-labelledby="levels-title" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="levels-title" className="text-lg font-semibold">{t("levelsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("levelsHint")}</p>
            </div>
            <Link href="/estudiante/progreso" className={cn(buttonVariants({ variant: "outline" }))}>{t("trackerCta")}</Link>
          </div>
          <LevelProgressList levels={levels} />
        </section>

        <section aria-labelledby="data-title" className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
          <div className="min-w-48 flex-1">
            <h2 id="data-title" className="text-lg font-semibold">{t("dataTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("dataHint")}</p>
          </div>
          <a href={exportHref} download className={cn(buttonVariants({ variant: "outline" }))}><Download aria-hidden /> {t("dataExport")}</a>
        </section>
      </main>
    </StudentShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
