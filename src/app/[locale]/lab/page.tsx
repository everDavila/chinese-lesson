import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CheckCircle2, FlaskConical, Lightbulb } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { mailto } from "@/lib/contact";
import { LABS } from "@/lib/labs";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/lab">): Promise<Metadata> {
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
  const groups = [
    { status: "testing" as const, title: t("testing") },
    { status: "implemented" as const, title: t("implemented") },
  ];
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="flex items-center gap-3 font-hanzi text-4xl font-semibold">
          <FlaskConical className="size-8 text-keyword-text" aria-hidden /> {t("title")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>
      </header>

      {groups.map((g) => (
        <section key={g.status} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">{g.title}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {LABS.filter((l) => l.status === g.status).map((l) => (
              <li key={l.slug}>
                <Link href={`/lab/${l.slug}`} className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-keyword-text">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-xs font-medium text-black",
                      l.status === "implemented" ? "bg-rating-3" : "bg-rating-2",
                    )}
                  >
                    {l.status === "implemented" ? <CheckCircle2 className="size-3.5" aria-hidden /> : <FlaskConical className="size-3.5" aria-hidden />}
                    {l.status === "implemented" ? t("implementedTag") : t("testingTag")}
                  </span>
                  <span className="font-hanzi text-xl font-semibold">{t(`items.${l.slug}.title`)}</span>
                  <span className="text-sm text-muted-foreground">{t(`items.${l.slug}.summary`)}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm text-keyword-text">
                    {t("open")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section id="ideas" className="scroll-mt-16 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-6">
        <h2 className="flex items-center gap-2 font-hanzi text-2xl font-semibold">
          <Lightbulb className="size-6 text-keyword-text" aria-hidden /> {t("ideasTitle")}
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
