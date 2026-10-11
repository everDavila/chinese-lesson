import { defineRouting } from "next-intl/routing";

// Idioma de la interfaz (ARQUITECTURA.md §2, "Idiomas"): chino por defecto,
// sin prefijo; español e inglés con /es y /en. El idioma del contenido para
// los alumnos es otro ajuste y no depende de este.
export const routing = defineRouting({
  locales: ["zh", "es", "en"],
  defaultLocale: "zh",
  localePrefix: "as-needed",
  // No se deduce del navegador: sin prefijo siempre es chino; el selector
  // lleva a /es o /en y los enlaces internos conservan ese prefijo.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  zh: "中文",
  es: "Español",
  en: "English",
};
