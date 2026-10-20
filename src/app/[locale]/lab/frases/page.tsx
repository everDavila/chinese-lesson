import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Play } from "lucide-react";
import { LabHistory } from "@/components/lab/lab-history";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lab/frases">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Lab" });
  return { title: `${t("items.frases.title")} · ${t("title")} · Renshi` };
}

// Experimento en prueba: elegir en qué idioma empiezan las frases del reverso
// (selector «Frases en» de la barra de la presentación, tecla L). Se prueba en
// la clase de ejemplo.
export default async function SentencesLab({
  params,
}: PageProps<"/[locale]/lab/frases">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Lab");
  const steps = ["frasesStep1", "frasesStep2", "frasesStep3"] as const;
  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="font-hanzi text-3xl font-semibold">
          {t("items.frases.title")}
        </h1>
        <p className="text-muted-foreground">{t("items.frases.body")}</p>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li
              key={s}
              className="flex gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                {i + 1}
              </span>
              <span>{t(s)}</span>
            </li>
          ))}
        </ol>
        <Link
          href="/present"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[oklch(0.5_0.15_25)] px-5 py-3 font-medium text-white hover:bg-[oklch(0.45_0.15_25)]"
        >
          <Play className="size-4 fill-current" /> {t("tryInDemo")}
        </Link>
      </main>
      <LabHistory slug="frases" />
    </>
  );
}
