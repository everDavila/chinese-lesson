import { defineRouting } from "next-intl/routing";

// Idioma de la interfaz (ARQUITECTURA.md §2, "Idiomas"): el del navegador si
// es chino, español o inglés; si no, inglés. Lo elegido en el selector se
// recuerda (cookie NEXT_LOCALE) y manda sobre el navegador. El idioma del
// contenido para los alumnos es otro ajuste y no depende de este.
export const routing = defineRouting({
  locales: ["zh", "es", "en"],
  // Respaldo cuando el navegador no pide ninguno de los tres; va sin prefijo.
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  zh: "中文",
  es: "Español",
  en: "English",
};
