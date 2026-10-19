import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CodeForm } from "@/components/vote/student-vote";

export async function generateMetadata({ params }: PageProps<"/[locale]/lab/votacion">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Lab" });
  return { title: `${t("items.votacion.title")} · ${t("title")} · Renshi` };
}

// Experimento ya implementado: cómo llegó la votación del alumno a ser lo que
// es (fechas del repositorio) y, al lado, el formulario real del código con
// el panda. Un código inventado muestra su reacción sin tocar ninguna clase.
const STEPS = ["2026-10-11", "2026-10-12a", "2026-10-12b", "2026-10-12c", "2026-10-12d", "2026-10-16"] as const;

export default async function VotingLab({ params }: PageProps<"/[locale]/lab/votacion">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Lab");
  return (
    <main className="mx-auto grid w-full max-w-4xl flex-1 gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col gap-4">
        <h1 className="font-hanzi text-3xl font-semibold">{t("items.votacion.title")}</h1>
        <p className="text-muted-foreground">{t("items.votacion.body")}</p>
        <ol className="mt-2 flex flex-col border-l-2 border-border">
          {STEPS.map((s) => (
            <li key={s} className="relative pb-5 pl-5 last:pb-0">
              <span className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-keyword-text" aria-hidden />
              <p className="text-xs text-muted-foreground tabular-nums">{s.slice(0, 10)}</p>
              <p>{t(`votingSteps.${s}`)}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-3 self-start rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium">{t("tryPanda")}</p>
        <p className="text-xs text-muted-foreground">{t("tryPandaHint")}</p>
        <CodeForm />
      </div>
    </main>
  );
}
