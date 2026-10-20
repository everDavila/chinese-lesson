import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { labBySlug } from "@/lib/labs";

// Línea de tiempo de un experimento: cómo llegó hasta aquí. Sale del registro
// (src/lib/labs.ts); toda página de /lab la muestra.
export async function LabHistory({ slug }: { slug: string }) {
  const lab = labBySlug(slug);
  if (!lab) return null;
  const t = await getTranslations("Lab");
  const locale = await getLocale();
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-12 sm:px-6">
      <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">{t("historyTitle")}</h2>
      <ol className="flex flex-col border-l-2 border-border">
        {lab.history.map((e, i) => (
          <li key={`${e.id}-${i}`} className="relative pb-5 pl-5 last:pb-0">
            <span className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-keyword-text" aria-hidden />
            <p className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              {fmt.format(new Date(`${e.date}T00:00:00Z`))}
              {e.implemented && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rating-3 px-2 py-0.5 text-[11px] font-medium text-black">
                  <CheckCircle2 className="size-3" aria-hidden /> {t("implementedTag")}
                </span>
              )}
            </p>
            <p>{t(`items.${slug}.history.${e.id}`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
