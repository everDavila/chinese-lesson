"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { LabStatus } from "@/lib/labs";
import { cn } from "@/lib/utils";

export type LabCard = {
  slug: string;
  status: LabStatus;
  title: string;
  summary: string;
  since: string;
  implementedOn?: string;
};

const FILTERS = [
  { value: null, key: "filterAll" },
  { value: "prueba", key: "filterTesting" },
  { value: "implementados", key: "filterImplemented" },
] as const;

// Lista del laboratorio (ya ordenada por la novedad más reciente) con filtros
// por estado en la dirección (?estado=prueba|implementados), para poder
// compartir el enlace filtrado.
export function LabList({ labs }: { labs: LabCard[] }) {
  const t = useTranslations("Lab");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filter = params.get("estado");
  const shown = labs.filter((l) =>
    filter === "prueba" ? l.status === "testing" : filter === "implementados" ? l.status === "implemented" : true,
  );
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const day = (d: string) => fmt.format(new Date(`${d}T00:00:00Z`));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterLabel")}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => router.replace(f.value ? `${pathname}?estado=${f.value}` : pathname, { scroll: false })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              filter === f.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
            )}
          >
            {t(f.key)}
          </button>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {shown.map((l) => (
          <li key={l.slug}>
            <Link
              href={`/lab/${l.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-keyword-text sm:flex-row sm:items-center sm:gap-6"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-hanzi text-xl font-semibold">{l.title}</span>
                <span className="text-sm text-muted-foreground">{l.summary}</span>
              </span>
              <span className="flex shrink-0 items-center gap-4 sm:w-72 sm:justify-end">
                <span className="flex flex-col items-start gap-1 sm:items-end">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-black",
                      l.status === "implemented" ? "bg-rating-3" : "bg-rating-2",
                    )}
                  >
                    {l.status === "implemented" ? <CheckCircle2 className="size-3.5" aria-hidden /> : <FlaskConical className="size-3.5" aria-hidden />}
                    {l.status === "implemented" ? t("implementedTag") : t("testingTag")}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {l.status === "implemented" && l.implementedOn ? t("implementedOn", { date: day(l.implementedOn) }) : t("testingSince", { date: day(l.since) })}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-keyword-text">
                  {t("open")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
