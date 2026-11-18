import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StudentShell } from "@/components/student/student-shell";
import { WordConsult } from "@/components/student/word-consult";
import { Link } from "@/i18n/navigation";
import { requireProfile } from "@/lib/guard";
import { getPracticeLesson } from "@/lib/lessons";
import { getBookmarkIds, getSentenceBookmarkIds, getStars } from "@/lib/student-progress";

// Ficha de una palabra, abierta desde el rastreador de nivel. Solo consulta:
// no valora ni toca el avance. ?volver=… devuelve al rastreador con su filtro.
export const metadata: Metadata = {
  title: "Palabra · Renshi",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Page({ params, searchParams }: PageProps<"/[locale]/estudiante/palabra/[senseId]">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Word params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Word({
  params,
  searchParams,
}: {
  params: PageProps<"/[locale]/estudiante/palabra/[senseId]">["params"];
  searchParams: PageProps<"/[locale]/estudiante/palabra/[senseId]">["searchParams"];
}) {
  const { locale, senseId } = await params;
  setRequestLocale(locale);
  if (!UUID.test(senseId)) notFound();
  const profile = await requireProfile();
  const t = await getTranslations("StudentWorkspace");
  const sp = await searchParams;
  const from = Array.isArray(sp.volver) ? sp.volver[0] : sp.volver;
  // Solo se vuelve al rastreador: un destino cualquiera sería un redirect abierto.
  const back = from && /^\/estudiante\/progreso(\?[\w=%&.-]*)?$/.test(from) ? from : "/estudiante/progreso";
  const [lesson, bookmarks, favoriteSentences, stars] = await Promise.all([
    getPracticeLesson("Palabra", [senseId]),
    getBookmarkIds(),
    getSentenceBookmarkIds(),
    getStars([senseId]),
  ]);
  if (!lesson) notFound();
  const n = stars.get(senseId) ?? 0;
  return (
    <StudentShell name={profile.displayName}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <Link href={back} className="text-sm text-primary hover:underline">{t("wordBack")}</Link>
          <p className="text-sm text-muted-foreground" aria-label={t("wordStarsLabel", { n })}>
            <span aria-hidden>{"★".repeat(n)}{"☆".repeat(3 - n)}</span> {t("wordStars", { n })}
          </p>
        </header>
        <WordConsult lesson={lesson} bookmarked={bookmarks.includes(senseId)} favoriteSentences={favoriteSentences} />
      </main>
    </StudentShell>
  );
}
