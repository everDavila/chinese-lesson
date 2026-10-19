import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/creditos">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Credits" });
  return { title: `${t("title")} · Renshi` };
}

// Fuentes y licencias del contenido. Las licencias abiertas (CC BY, CC BY-SA,
// LGPL, Arphic) piden citar la fuente: se hace aquí, enlazado desde el pie de
// toda la web.
export default async function CreditsPage({ params }: PageProps<"/[locale]/creditos">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Credits");
  const sources = [
    { what: t("syllabus"), who: t("syllabusWho"), url: "https://www.chinesetest.cn/syllabus", license: t("official") },
    {
      what: t("gushi"),
      who: t("gushiWho"),
      url: "https://gushichinese.com/es/hsk-3.0/downloads",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    { what: t("tatoeba"), who: "Tatoeba Project", url: "https://tatoeba.org", license: "CC BY 2.0 FR", licenseUrl: "https://creativecommons.org/licenses/by/2.0/fr/" },
    {
      what: t("makemeahanzi"),
      who: "Make Me a Hanzi",
      url: "https://github.com/skishore/makemeahanzi",
      license: t("lgpl"),
      licenseUrl: "https://www.gnu.org/licenses/lgpl-3.0.html",
    },
    {
      what: t("strokes"),
      who: t("strokesWho"),
      url: "https://github.com/chanind/hanzi-writer-data",
      license: "Arphic Public License",
      licenseUrl: "https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT",
    },
  ];
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span lang="zh-Hans" className="font-hanzi text-2xl font-semibold">认识</span>
          <span className="font-hanzi text-lg text-muted-foreground">Renshi</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>
      <h1 className="font-hanzi text-4xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("intro")}</p>
      <ul className="flex flex-col gap-3">
        {sources.map((s) => (
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
