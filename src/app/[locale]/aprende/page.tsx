import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AprendeFrame } from "@/components/aprende/frame";
import { Link } from "@/i18n/navigation";
import { listChapters } from "@/lib/aprende";
import { getProfile } from "@/lib/content";

// «Aprende»: cómo funciona la escritura china. Una sola lectura con tres
// entradas: pública (sin cuenta), dentro del espacio del alumno y dentro del
// de la docente. Borrador: no se indexa hasta que la docente lo revise.
export const metadata: Metadata = {
  title: "Saber más · Renshi",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/[locale]/aprende">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Index params={params} />
    </Suspense>
  );
}

async function Index({ params }: { params: PageProps<"/[locale]/aprende">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Learn");
  const profile = await getProfile();
  const chapters = listChapters();
  return (
    <AprendeFrame profile={profile} title={t("title")} crumbs={[{ label: t("title") }]}>
      <p className="text-muted-foreground">{t("intro")}</p>
      <ul className="mt-6 flex flex-col gap-3">
        {chapters.map(({ chapter, title }, i) => (
          <li key={chapter.slug}>
            <Link href={`/aprende/${chapter.slug}`} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{title.replace(/^Cap\. \d+ · /, "")}</span>
                <span className="text-sm text-muted-foreground">{t("minutes", { n: chapter.minutes })}</span>
              </span>
            </Link>
          </li>
        ))}
        {profile && profile.role !== "student" && (
          <li>
            <Link href="/aprende/pictogramas-lista" className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-4 transition-colors hover:bg-muted">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{t("listTitle")}</span>
                <span className="text-sm text-muted-foreground">{t("listHint")}</span>
              </span>
            </Link>
          </li>
        )}
      </ul>
    </AprendeFrame>
  );
}
