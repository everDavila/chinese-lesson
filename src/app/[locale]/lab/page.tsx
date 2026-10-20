import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { FlaskConical, Lightbulb } from "lucide-react";
import { LabList, type LabCard } from "@/components/lab/lab-list";
import { mailto } from "@/lib/contact";
import { LABS } from "@/lib/labs";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lab">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Lab" });
  return { title: `${t("title")} · Renshi` };
}

// Índice del laboratorio: lo que probamos, en prueba o ya implementado, y una
// invitación a proponer ideas. Los experimentos salen de src/lib/labs.ts.
export default async function LabIndex({ params }: PageProps<"/[locale]/lab">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Lab");
  const tc = await getTranslations("Contact");
  const cards: LabCard[] = LABS.map((l) => ({
    slug: l.slug,
    status: l.status,
    title: t(`items.${l.slug}.title`),
    summary: t(`items.${l.slug}.summary`),
    since: l.since,
    implementedOn: l.implementedOn,
  }));
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="flex items-center gap-3 font-hanzi text-4xl font-semibold">
          <FlaskConical className="size-8 text-keyword-text" aria-hidden />{" "}
          {t("title")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>
      </header>

      {/* Tarjetas horizontales, de la novedad más reciente a la más antigua, con
          su fecha y filtros por estado (?estado=…). */}
      <Suspense fallback={null}>
        <LabList labs={cards} />
      </Suspense>

      <section
        id="ideas"
        className="scroll-mt-16 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-6"
      >
        <h2 className="flex items-center gap-2 font-hanzi text-2xl font-semibold">
          <Lightbulb className="size-6 text-keyword-text" aria-hidden />{" "}
          {t("ideasTitle")}
        </h2>
        <p className="text-muted-foreground">{t("ideasText")}</p>
        <a
          href={mailto(tc("ideaSubject"), tc("ideaBody"))}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.5_0.15_25)] px-5 py-3 font-medium text-white hover:bg-[oklch(0.45_0.15_25)]"
        >
          {t("ideasButton")}
        </a>
      </section>
    </main>
  );
}
