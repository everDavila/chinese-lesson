import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LabHistory } from "@/components/lab/lab-history";
import { CodeForm } from "@/components/vote/student-vote";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lab/votacion">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Lab" });
  return { title: `${t("items.votacion.title")} · ${t("title")} · Renshi` };
}

// Experimento ya implementado: cómo llegó la votación del alumno a ser lo que
// es (fechas del repositorio) y, al lado, el formulario real del código con
// el panda. Un código inventado muestra su reacción sin tocar ninguna clase.
export default async function VotingLab({
  params,
}: PageProps<"/[locale]/lab/votacion">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Lab");
  return (
    <>
      <main className="mx-auto grid w-full max-w-4xl flex-1 gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <h1 className="font-hanzi text-3xl font-semibold">
            {t("items.votacion.title")}
          </h1>
          <p className="text-muted-foreground">{t("items.votacion.body")}</p>
        </div>
        <div className="flex flex-col gap-3 self-start rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium">{t("tryPanda")}</p>
          <p className="text-xs text-muted-foreground">{t("tryPandaHint")}</p>
          <CodeForm />
        </div>
      </main>
      <LabHistory slug="votacion" />
    </>
  );
}
