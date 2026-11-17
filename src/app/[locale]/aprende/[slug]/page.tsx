import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AprendeFrame } from "@/components/aprende/frame";
import { Markdown } from "@/components/aprende/markdown";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CHAPTERS, getChapter } from "@/lib/aprende";
import { getProfile } from "@/lib/content";
import { listThemes } from "@/lib/student-practice";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Saber más · Renshi",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/[locale]/aprende/[slug]">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Chapter params={params} />
    </Suspense>
  );
}

async function Chapter({ params }: { params: PageProps<"/[locale]/aprende/[slug]">["params"] }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const found = getChapter(slug);
  if (!found) notFound();
  const t = await getTranslations("Learn");
  const profile = await getProfile();
  const index = CHAPTERS.findIndex((c) => c.slug === slug);
  const prev = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];
  const title = found.title.replace(/^Cap\. \d+ · /, "");
  // Al final del capítulo: practicar su colección. Solo el alumno practica; sin
  // sesión se invita a entrar. La docente no ve el botón.
  let practiceHref: string | null = null;
  if (found.chapter.practiceTheme && profile?.role === "student") {
    const theme = (await listThemes()).find((th) => th.title === found.chapter.practiceTheme);
    if (theme) practiceHref = `/estudiante?fuente=tema-${theme.id}&n=20&ejercicio=tarjeta`;
  }
  const practiceCta = found.chapter.practiceTheme && !profile ? "/login" : practiceHref;
  return (
    <AprendeFrame profile={profile} title={title} subtitle={t("minutes", { n: found.chapter.minutes })} crumbs={[{ label: t("title"), href: "/aprende" }, { label: title }]}>
      <Markdown source={found.body} />
      {practiceCta && (
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{profile ? t("practiceHint") : t("practiceLogin")}</p>
          <Link href={practiceCta} className={cn(buttonVariants(), "mt-3")}>{profile ? t("practiceCta") : t("signIn")}</Link>
        </div>
      )}
      {found.chapter.labSlug && (
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t(`labHint.${found.chapter.labSlug}`)}</p>
          <Link href={`/lab/${found.chapter.labSlug}`} className={cn(buttonVariants({ variant: "outline" }), "mt-3")}>{t(`labCta.${found.chapter.labSlug}`)}</Link>
        </div>
      )}
      <nav className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm" aria-label={t("chapters")}>
        {prev ? <Link href={`/aprende/${prev.slug}`} className="text-primary hover:underline">← {t("previous")}</Link> : <span />}
        {next ? <Link href={`/aprende/${next.slug}`} className="text-primary hover:underline">{t("next")} →</Link> : <span />}
      </nav>
    </AprendeFrame>
  );
}
