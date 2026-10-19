import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Inter, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { HskNote } from "@/components/hsk-note";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Las fuentes CJK no tienen subset "chinese": no se precargan y el navegador
// descarga solo los tramos de caracteres que la página usa.
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "700"],
  preload: false,
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  weight: ["400", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Renshi",
  description: "Vocabulario chino en contexto para enseñar en clase.",
  other: { google: "notranslate" },
};

// El HTML declara el idioma de la interfaz (zh-CN para que el navegador
// elija bien las fuentes y la voz).
const HTML_LANG = { zh: "zh-CN", es: "es", en: "en" } as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    // translate="no": la app ya tiene su selector de idioma, y el traductor
    // del navegador destrozaría el contenido (汉字 → "Chinese character").
    <html
      lang={HTML_LANG[locale]}
      translate="no"
      className={`${inter.variable} ${notoSansSC.variable} ${notoSerifSC.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          {/* Claro por defecto; el botón de tema de cada cabecera cambia a oscuro. */}
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            {/* usePathname fuera de Suspense bloquea el prerender (Cache Components). */}
            <Suspense fallback={null}>
              <HskNote />
            </Suspense>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
