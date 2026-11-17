import { getTranslations } from "next-intl/server";
import { MIN_PROJECTION_DAYS, projectCompletion, weeklyNewWords } from "@/lib/student-projection";
import type { LevelProgress } from "@/lib/student-progress";
import { dayKey } from "@/lib/student-time";

// Ritmo de las últimas 8 semanas y una estimación de cuánto falta para ver todas
// las palabras del nivel en el que va. Solo da el rango con ≥ 2 semanas de datos;
// antes, un estado vacío que dice cuánto falta para que aparezca.
export async function ProjectionCard({ firstSeen, levels }: { firstSeen: string[]; levels: LevelProgress[] }) {
  const t = await getTranslations("StudentWorkspace");
  const today = dayKey(new Date());
  const target = levels.find((l) => l.total > 0 && l.mastered + l.inProgress + l.dismissed < l.total);
  const remaining = target ? target.total - (target.mastered + target.inProgress + target.dismissed) : 0;
  const projection = projectCompletion(firstSeen, remaining, today);
  const weeks = weeklyNewWords(firstSeen, today, 8);
  const max = Math.max(...weeks, 1);
  const levelName = target ? (target.level === 7 ? t("levelBand") : t("levelName", { n: target.level })) : "";

  return (
    <section aria-labelledby="proj-title" className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 id="proj-title" className="text-lg font-semibold">{t("projTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("projHint")}</p>
      </div>

      {projection.status === "insufficient" ? (
        <p className="text-sm">{t("projEmpty", { days: Math.min(projection.daysOfData, MIN_PROJECTION_DAYS), need: MIN_PROJECTION_DAYS })}</p>
      ) : (
        <>
          <div role="img" aria-label={t("projChartLabel", { values: weeks.join(", ") })} className="flex h-28 gap-2">
            {weeks.map((n, i) => (
              <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground tabular-nums">{n}</span>
                <div className="flex w-full flex-1 items-end">
                  <span className="block w-full rounded-t bg-primary/70" style={{ height: `${n ? Math.max((n / max) * 100, 6) : 2}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("projChartHint")}</p>
          {projection.status === "ok" && (
            <p className="text-sm font-medium">
              {projection.weeksMax === null
                ? t("projAtLeast", { level: levelName, min: projection.weeksMin })
                : t("projRange", { level: levelName, min: projection.weeksMin, max: projection.weeksMax })}
            </p>
          )}
          {projection.status === "done" && <p className="text-sm font-medium">{t("projDone")}</p>}
          {projection.status === "no-pace" && <p className="text-sm">{t("projNoPace")}</p>}
          <p className="text-xs text-muted-foreground">{t("projCaveat")}</p>
        </>
      )}
    </section>
  );
}
