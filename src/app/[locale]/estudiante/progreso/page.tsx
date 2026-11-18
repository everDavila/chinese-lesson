import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StudentShell } from "@/components/student/student-shell";
import { Link } from "@/i18n/navigation";
import { requireProfile } from "@/lib/guard";
import { getLevelWords, LEVELS, type WordStatus } from "@/lib/student-progress";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Progreso · Renshi",
  robots: { index: false },
};

export default function Page({ params, searchParams }: PageProps<"/[locale]/estudiante/progreso">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Tracker params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const TILE: Record<WordStatus, string> = {
  none: "bg-muted text-muted-foreground",
  progress: "bg-rating-2 text-black",
  mastered: "bg-rating-3 text-black",
  dismissed: "border border-dashed border-muted-foreground text-muted-foreground",
};
const DOT: Record<WordStatus, string> = {
  none: "bg-border",
  progress: "bg-rating-2",
  mastered: "bg-rating-3",
  dismissed: "border border-dashed border-muted-foreground",
};
const STATUSES = ["none", "progress", "mastered", "dismissed"] as const;
const PENDING_RANK: Record<WordStatus, number> = { progress: 0, none: 1, mastered: 2, dismissed: 3 };
const STATUS_KEY = { none: "statusNone", progress: "statusProgress", mastered: "statusMastered", dismissed: "statusDismissed" } as const;

async function Tracker({
  params,
  searchParams,
}: {
  params: PageProps<"/[locale]/estudiante/progreso">["params"];
  searchParams: PageProps<"/[locale]/estudiante/progreso">["searchParams"];
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await requireProfile();
  const t = await getTranslations("StudentWorkspace");
  const sp = await searchParams;
  const level = LEVELS.find((l) => String(l) === sp.nivel) ?? 1;
  const dots = sp.vista === "puntos";
  const skill = sp.habilidad === "escribir" ? "write" : "recognize";
  const all = await getLevelWords(level, skill);
  const count = (s: WordStatus) => all.filter((w) => w.status === s).length;
  const filter = STATUSES.find((x) => x === sp.estado) ?? null;
  const byPending = sp.orden === "faltan";
  // El orden por defecto es el del temario; «faltan» sube las que aún no sabe.
  const words = (filter ? all.filter((w) => w.status === filter) : all).toSorted((a, b) => (byPending ? PENDING_RANK[a.status] - PENDING_RANK[b.status] : 0));
  const base = { nivel: level, vista: dots ? "puntos" : "", habilidad: skill === "write" ? "escribir" : "", estado: filter ?? "", orden: byPending ? "faltan" : "" };
  const href = (over: Partial<typeof base> = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...base, ...over })) if (v !== "" && v !== undefined) q.set(k, String(v));
    return `/estudiante/progreso?${q}`;
  };
  const pill = "rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted";

  return (
    <StudentShell name={profile.displayName}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="space-y-1">
          <Link href="/" className="text-sm text-primary hover:underline">{t("trackerBack")}</Link>
          <h1 className="text-3xl font-semibold">{t("trackerTitle")}</h1>
        </header>

        <nav aria-label={t("skillLabel")} className="flex w-fit gap-1 rounded-full border border-border p-1">
          <Link href={href({ habilidad: "" })} aria-current={skill === "recognize" ? "page" : undefined} className={cn(pill, skill === "recognize" && "bg-primary text-primary-foreground hover:bg-primary")}>{t("skillRecognize")}</Link>
          <Link href={href({ habilidad: "escribir" })} aria-current={skill === "write" ? "page" : undefined} className={cn(pill, skill === "write" && "bg-primary text-primary-foreground hover:bg-primary")}>{t("skillWrite")}</Link>
        </nav>

        <nav aria-label={t("levelPicker")} className="flex flex-wrap gap-1">
          {LEVELS.map((l) => (
            <Link key={l} href={href({ nivel: l })} aria-current={l === level ? "page" : undefined} className={cn(pill, "border border-border", l === level && "border-primary bg-primary text-primary-foreground hover:bg-primary")}>
              {l === 7 ? t("levelBand") : t("levelName", { n: l })}
            </Link>
          ))}
        </nav>

        {all.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">{t("trackerEmpty")}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {t("trackerSummary", { mastered: count("mastered"), progress: count("progress"), none: count("none") + count("dismissed") })}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {(["none", "progress", "mastered", "dismissed"] as const).map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className={cn("size-3.5 rounded-sm", DOT[s])} aria-hidden /> {t(STATUS_KEY[s])}
                  </li>
                ))}
              </ul>
              <nav aria-label={t("viewLabel")} className="flex gap-1 rounded-full border border-border p-1">
                <Link href={href({ vista: "" })} aria-current={!dots ? "page" : undefined} className={cn(pill, !dots && "bg-primary text-primary-foreground hover:bg-primary")}>{t("viewWords")}</Link>
                <Link href={href({ vista: "puntos" })} aria-current={dots ? "page" : undefined} className={cn(pill, dots && "bg-primary text-primary-foreground hover:bg-primary")}>{t("viewDots")}</Link>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <nav aria-label={t("filterLabel")} className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-muted-foreground">{t("filterLabel")}</span>
                <Link href={href({ estado: "" })} aria-current={!filter ? "page" : undefined} className={cn(pill, "border border-border", !filter && "border-primary bg-primary text-primary-foreground hover:bg-primary")}>{t("filterAll")}</Link>
                {STATUSES.map((s) => (
                  <Link key={s} href={href({ estado: s })} aria-current={filter === s ? "page" : undefined} className={cn(pill, "border border-border", filter === s && "border-primary bg-primary text-primary-foreground hover:bg-primary")}>{t(STATUS_KEY[s])}</Link>
                ))}
              </nav>
              <nav aria-label={t("orderLabel")} className="flex items-center gap-1">
                <span className="mr-1 text-muted-foreground">{t("orderLabel")}</span>
                <Link href={href({ orden: "" })} aria-current={!byPending ? "page" : undefined} className={cn(pill, "border border-border", !byPending && "border-primary bg-primary text-primary-foreground hover:bg-primary")}>{t("orderSyllabus")}</Link>
                <Link href={href({ orden: "faltan" })} aria-current={byPending ? "page" : undefined} className={cn(pill, "border border-border", byPending && "border-primary bg-primary text-primary-foreground hover:bg-primary")}>{t("orderPending")}</Link>
              </nav>
            </div>

            {words.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{t("filterNone")}</p>}

            {dots ? (
              <ul className="flex flex-wrap gap-1.5" lang="zh-Hans">
                {words.map((w) => (
                  <li key={w.senseId} title={`${w.hanzi} · ${t(STATUS_KEY[w.status])}`} aria-label={`${w.hanzi}: ${t(STATUS_KEY[w.status])}`} className={cn("size-4 rounded-full", DOT[w.status])} />
                ))}
              </ul>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2" lang="zh-Hans">
                {words.map((w) => (
                  <li key={w.senseId}>
                    {/* Cada ficha abre la palabra; ?volver conserva el nivel, filtro y orden del rastreador. */}
                    <Link
                      href={`/estudiante/palabra/${w.senseId}?volver=${encodeURIComponent(href())}`}
                      title={t(STATUS_KEY[w.status])}
                      aria-label={`${w.hanzi}: ${t(STATUS_KEY[w.status])}`}
                      className={cn("flex min-h-12 items-center justify-center rounded-lg px-1 py-2 text-center font-hanzi text-lg leading-tight transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", TILE[w.status])}
                    >
                      {w.hanzi}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </StudentShell>
  );
}
