"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { labBySlug } from "@/lib/labs";
import { cn } from "@/lib/utils";

// Franja y barra de toda página de /lab. Ever graba la pantalla: quien vea el
// video tiene que saber si algo es un piloto o ya forma parte de Renshi. El
// estado sale del registro (src/lib/labs.ts), así una página nueva no puede
// olvidarla.
export function LabChrome() {
  const t = useTranslations("Lab");
  const pathname = usePathname();
  const slug = pathname.split("/")[2];
  const lab = slug ? labBySlug(slug) : undefined;
  const implemented = lab?.status === "implemented";
  return (
    <>
      <div
        role="note"
        className={cn(
          "sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b px-4 py-2 text-center text-sm font-medium text-black",
          implemented ? "border-rating-3 bg-rating-3" : "border-rating-2 bg-rating-2",
        )}
      >
        {implemented ? <CheckCircle2 aria-hidden className="size-4 shrink-0" /> : <FlaskConical aria-hidden className="size-4 shrink-0" />}
        <span>
          <strong className="tracking-wide uppercase">{t("banner")}</strong> ·{" "}
          {lab ? (implemented ? t("bannerImplemented") : t("bannerTesting")) : t("bannerIndex")}
        </span>
        {implemented && lab?.usedIn && (
          <Link href={lab.usedIn} className="underline underline-offset-2">
            {t("seeInRenshi")}
          </Link>
        )}
      </div>
      <nav className="mx-auto flex w-full max-w-4xl items-center gap-1 px-4 pt-3 text-sm sm:px-6">
        <Link href="/" className="mr-auto flex items-baseline gap-2">
          <span lang="zh-Hans" className="font-hanzi text-xl font-semibold">认识</span>
          <span className="hidden font-hanzi text-muted-foreground sm:inline">Renshi</span>
        </Link>
        {lab && (
          <Link href="/lab" className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted">
            <FlaskConical className="size-4" aria-hidden /> {t("title")}
          </Link>
        )}
        <ThemeToggle />
        <LanguageSwitcher />
      </nav>
    </>
  );
}
