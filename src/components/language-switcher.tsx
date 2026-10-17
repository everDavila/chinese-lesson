"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe2 } from "lucide-react";
import { LOCALE_NAMES, routing, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

// Selector del idioma de la interfaz (no cambia el idioma del contenido).
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  return (
    <label className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm transition-colors hover:bg-muted focus-within:ring-3 focus-within:ring-ring/50">
      <Globe2 className="size-5" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className="min-w-0 cursor-pointer border-0 bg-transparent text-foreground outline-none [&>option]:bg-popover [&>option]:text-popover-foreground"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
