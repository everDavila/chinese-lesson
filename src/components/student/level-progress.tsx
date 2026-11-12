import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { LevelProgress } from "@/lib/student-progress";

// Barras por nivel HSK: dominadas sobre el total, y en progreso más claro.
export async function LevelProgressList({ levels }: { levels: LevelProgress[] }) {
  const t = await getTranslations("StudentWorkspace");
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-card">
      {levels.map((l) => {
        const done = l.total ? (l.mastered / l.total) * 100 : 0;
        const doing = l.total ? (l.inProgress / l.total) * 100 : 0;
        return (
          <li key={l.level} className="border-b border-border last:border-b-0">
            <Link href={`/estudiante/progreso?nivel=${l.level}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted">
              <span className="w-20 shrink-0 font-semibold">{l.level === 7 ? t("levelBand") : t("levelName", { n: l.level })}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm text-muted-foreground tabular-nums">{t("levelWords", { done: l.mastered, total: l.total })}</span>
                <span className="flex h-2 overflow-hidden rounded-full bg-border" aria-hidden>
                  <span className="bg-primary" style={{ width: `${done}%` }} />
                  <span className="bg-primary/40" style={{ width: `${doing}%` }} />
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
