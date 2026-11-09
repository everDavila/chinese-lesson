import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { RadicalTable, type RadicalRow } from "@/components/lab/radical-table";
import radicals from "../../../../../data/radicals.json";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lab/radicales">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Lab" });
  return { title: `${t("items.radicales.title")} · ${t("title")} · Renshi` };
}

// Experimento en prueba: los 214 radicales Kangxi en una tabla con búsqueda,
// filtro por uso y orden. Los datos salen de scripts/build-radicals.mjs; los
// significados son una primera versión pendiente de revisión de la docente.
export default async function RadicalsLab({
  params,
}: PageProps<"/[locale]/lab/radicales">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Lab");
  const rows: RadicalRow[] = radicals.map((r) => ({
    number: r.number,
    char: r.char,
    pinyin: r.pinyin,
    strokes: r.strokes,
    meaning: locale === "es" ? r.meaning.es : r.meaning.en,
    variants: r.variants,
    hskCount: r.hskCount,
    examples: r.examples,
  }));
  const keys = [
    "search", "filterAll", "filterUsed", "filterTop", "sortLabel", "sortNumber",
    "sortFrequency", "sortStrokes", "colNumber", "colRadical", "colPinyin",
    "colMeaning", "colStrokes", "colHsk", "colExamples", "empty", "count",
    "pagination", "previous", "next", "pageN",
  ] as const;
  const labels = Object.fromEntries(keys.map((k) => [k, t(`items.radicales.ui.${k}`)])) as Record<(typeof keys)[number], string>;
  return (
    <>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="font-hanzi text-3xl font-semibold">{t("items.radicales.title")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("items.radicales.body")}</p>
        <RadicalTable rows={rows} labels={labels} />
      </main>
      <LabHistory slug="radicales" />
    </>
  );
}
