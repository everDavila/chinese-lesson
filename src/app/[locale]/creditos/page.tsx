import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: "Créditos · Renshi" };

// Fuentes y licencias del contenido. Las licencias abiertas (CC BY, CC BY-SA,
// LGPL, Arphic) piden citar la fuente: se hace aquí, enlazado desde el pie de
// toda la web. Español primero, como la portada.
const SOURCES = [
  {
    what: "Temario y niveles del HSK 3.0",
    who: "Chinese Test International (中文考试服务网), temario oficial publicado en noviembre de 2025",
    url: "https://www.chinesetest.cn/syllabus",
    license: "Material oficial",
  },
  {
    what: "Significados en español y parte de los ejemplos",
    who: "Gushi, listas de palabras HSK 3.0 traducidas a mano",
    url: "https://gushichinese.com/es/hsk-3.0/downloads",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.es",
  },
  {
    what: "Frases de ejemplo con traducción",
    who: "Tatoeba Project",
    url: "https://tatoeba.org",
    license: "CC BY 2.0 FR",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/fr/deed.es",
  },
  {
    what: "De qué piezas está hecho cada carácter",
    who: "Make Me a Hanzi",
    url: "https://github.com/skishore/makemeahanzi",
    license: "LGPL v3 o posterior",
    licenseUrl: "https://www.gnu.org/licenses/lgpl-3.0.html",
  },
  {
    what: "Trazos y su orden",
    who: "hanzi-writer-data (a partir de las fuentes Arphic)",
    url: "https://github.com/chanind/hanzi-writer-data",
    license: "Arphic Public License",
    licenseUrl: "https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT",
  },
];

export default async function CreditsPage({ params }: PageProps<"/[locale]/creditos">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6">
      <Link href="/" className="flex items-baseline gap-2 self-start">
        <span lang="zh-Hans" className="font-hanzi text-2xl font-semibold">认识</span>
        <span className="font-hanzi text-lg text-muted-foreground">Renshi</span>
      </Link>
      <h1 className="font-hanzi text-4xl font-semibold">Créditos</h1>
      <p className="text-muted-foreground">
        Renshi se apoya en el temario oficial del HSK 3.0 y en proyectos abiertos que permiten usar su trabajo citándolo.
        Las frases y notas propias de Renshi se suman a estas fuentes; el contenido derivado de Gushi se comparte con su
        misma licencia.
      </p>
      <ul className="flex flex-col gap-3">
        {SOURCES.map((s) => (
          <li key={s.url} className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{s.what}</p>
            <p className="text-sm text-muted-foreground">
              <a href={s.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">{s.who}</a>
              {" · "}
              {s.licenseUrl ? (
                <a href={s.licenseUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">{s.license}</a>
              ) : (
                s.license
              )}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
