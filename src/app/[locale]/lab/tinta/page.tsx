import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InkCompare } from "@/components/lab/ink-compare";
import { LabHistory } from "@/components/lab/lab-history";
import { getDemoLesson } from "@/lib/demo-lesson";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lab/tinta">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Lab" });
  return { title: `${t("items.tinta.title")} · ${t("title")} · Renshi` };
}

// Experimento ya implementado: el trazo liso y el de tinta china, lado a lado,
// con la palabra 认识 de la Lección de ejemplo.
export default async function InkLab({
  params,
}: PageProps<"/[locale]/lab/tinta">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Lab");
  const lesson = await getDemoLesson();
  const item =
    lesson?.items.find((it) => it.word.hanzi === "认识") ??
    lesson?.items[0] ??
    null;
  return (
    <>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="font-hanzi text-3xl font-semibold">
          {t("items.tinta.title")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {t("items.tinta.body")}
        </p>
        {item ? (
          <InkCompare item={item} />
        ) : (
          <p className="text-muted-foreground">{t("unavailable")}</p>
        )}
      </main>
      <LabHistory slug="tinta" />
    </>
  );
}
