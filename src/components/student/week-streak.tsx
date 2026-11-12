import { Flame } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { Streak } from "@/lib/student-progress";
import { cn } from "@/lib/utils";

// Racha: días seguidos con práctica y los últimos 7 días. Cada punto lleva
// texto (inicial del día y estado) y no depende solo del color.
export async function WeekStreak({ streak }: { streak: Streak }) {
  const t = await getTranslations("StudentWorkspace");
  const locale = await getLocale();
  const format = await getFormatter();
  const weekday = (day: string) => format.dateTime(new Date(`${day}T12:00:00Z`), { weekday: "narrow", timeZone: "UTC" });
  return (
    <section aria-labelledby="streak-title" className="rounded-xl border border-border bg-card p-5">
      <h2 id="streak-title" className="sr-only">{t("streakTitle")}</h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Flame className={cn("size-8", streak.current > 0 ? "text-primary" : "text-muted-foreground")} aria-hidden />
        <div className="min-w-40 flex-1">
          <p className="text-2xl font-semibold tabular-nums">{t("streakDays", { n: streak.current })}</p>
          <p className="text-sm text-muted-foreground">{streak.current > 0 ? t("streakBest", { n: streak.best }) : t("streakRestart")}</p>
        </div>
      </div>
      <ol className="mt-4 flex justify-between gap-1" lang={locale}>
        {streak.week.map((d) => (
          <li key={d.day} className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <span
              role="img"
              aria-label={`${format.dateTime(new Date(`${d.day}T12:00:00Z`), { weekday: "long", timeZone: "UTC" })}: ${d.done ? t("streakDone") : t("streakMissed")}`}
              className={cn(
                "size-7 rounded-full border-2",
                d.done ? "border-primary bg-primary" : "border-border",
                d.today && !d.done && "border-primary",
              )}
            />
            <span aria-hidden>{weekday(d.day)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
