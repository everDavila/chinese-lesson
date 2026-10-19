"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Claro por defecto (layout); este botón cambia a oscuro y next-themes lo
// recuerda. Va en todas las cabeceras: portada, área docente, admin y clase.
export function ThemeToggle({ size = "icon" }: { size?: "icon" | "icon-lg" }) {
  const t = useTranslations("Common");
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size={size} aria-label={t("theme")} title={t("theme")} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      {/* Los dos iconos y CSS decide: el tema no se conoce en el servidor. */}
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
