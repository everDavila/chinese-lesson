import { PenLine, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { StudentShell } from "./student-shell";

// Inicio del alumno. Hoy solo ofrece lo que existe: practicar y saber con qué
// cuenta está. El resumen de lo que le cuesta se llena cuando la tarjeta
// guarde eventos con sesión (docs/DISENO-AVANCE-ESTUDIANTE.md).
export async function StudentHome({ name }: { name: string }) {
  const t = await getTranslations("StudentWorkspace");
  return (
    <StudentShell name={name}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <header>
          <h1 className="text-3xl font-semibold">{t("greeting", { name })}</h1>
          <p className="mt-1 text-muted-foreground">{t("intro")}</p>
        </header>

        <section aria-labelledby="practice-title" className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><PenLine className="size-6" aria-hidden /></span>
            <div className="min-w-48 flex-1">
              <h2 id="practice-title" className="text-lg font-semibold">{t("practiceTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("practiceHint")}</p>
            </div>
            <Link href="/estudiante" className={cn(buttonVariants())}>{t("practiceCta")}</Link>
          </div>
        </section>

        <section aria-labelledby="progress-title" className="rounded-xl border border-dashed border-border p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-1 size-5 text-primary" aria-hidden />
            <div>
              <h2 id="progress-title" className="text-lg font-semibold">{t("progressTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("progressEmpty")}</p>
            </div>
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
