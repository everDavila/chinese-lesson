"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

// "HSK 1" a secas es ambiguo: el HSK 2.0 tenía 6 niveles y 150 palabras en el
// 1; el 3.0 tiene 9 y 300. Una sola nota al pie de toda la web dice cuál se
// usa. En clase (pantalla completa) no hay pie: lo dice el "HSK n" de la
// tarjeta al pasar el cursor.
export function HskNote() {
  const t = useTranslations("Common");
  const pathname = usePathname();
  if (pathname.startsWith("/present") || pathname.endsWith("/preview")) return null;
  return <footer className="px-4 py-3 text-center text-xs text-muted-foreground">{t("hskNote")}</footer>;
}
