import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FavoriteSentences } from "@/components/student/favorite-sentences";
import { StudentShell } from "@/components/student/student-shell";
import { Link } from "@/i18n/navigation";
import { requireProfile } from "@/lib/guard";
import { getSentenceTerms } from "@/lib/lessons";
import { getFavoriteSentences } from "@/lib/student-progress";

export const metadata: Metadata = {
  title: "Mis frases · Renshi",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/[locale]/estudiante/frases">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Sentences params={params} />
    </Suspense>
  );
}

async function Sentences({ params }: { params: PageProps<"/[locale]/estudiante/frases">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await requireProfile();
  const t = await getTranslations("StudentWorkspace");
  const sentences = await getFavoriteSentences();
  const terms = await getSentenceTerms(sentences.map((s) => s.zh));
  return (
    <StudentShell name={profile.displayName}>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="space-y-1">
          <Link href="/" className="text-sm text-primary hover:underline">{t("trackerBack")}</Link>
          <h1 className="text-3xl font-semibold">{t("sentencesTitle")}</h1>
          <p className="text-muted-foreground">{t("sentencesIntro")}</p>
        </header>
        {sentences.length ? (
          <FavoriteSentences sentences={sentences} terms={terms} />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">{t("sentencesEmpty")}</p>
        )}
      </main>
    </StudentShell>
  );
}
