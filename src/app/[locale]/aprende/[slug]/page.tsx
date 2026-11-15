import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AprendeFrame } from "@/components/aprende/frame";
import { Markdown } from "@/components/aprende/markdown";
import { Link } from "@/i18n/navigation";
import { CHAPTERS, getChapter } from "@/lib/aprende";
import { getProfile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Aprende · Renshi",
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
  return (
    <AprendeFrame profile={profile} title={title} subtitle={t("minutes", { n: found.chapter.minutes })} crumbs={[{ label: t("title"), href: "/aprende" }, { label: title }]}>
      <Markdown source={found.body} />
      <nav className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm" aria-label={t("chapters")}>
        {prev ? <Link href={`/aprende/${prev.slug}`} className="text-primary hover:underline">← {t("previous")}</Link> : <span />}
        {next ? <Link href={`/aprende/${next.slug}`} className="text-primary hover:underline">{t("next")} →</Link> : <span />}
      </nav>
    </AprendeFrame>
  );
}
