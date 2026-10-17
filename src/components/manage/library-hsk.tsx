"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import { hskCatalogAction } from "@/actions/search";
import { copyTemplateAction } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { CatalogPage, CatalogRow } from "@/lib/content";
import { categoryLabel, studentLabels } from "@/lib/student-labels";
import { cn } from "@/lib/utils";
import { ManageShell, SearchInput, meaningFor, useRunner } from "./shell";

// Biblioteca HSK: el temario oficial completo por nivel, sin lecciones
// artificiales. Cada fila es una ENTRADA (sentido) en su orden oficial; una
// palabra que está en varios niveles muestra todos, pero solo es fila en el
// suyo. Solo lectura. "Copiar HSK n" (las plantillas en lecciones de 15) se
// mantiene mientras no exista crear lecciones desde el catálogo.

/** En la base, la banda 7–9 es el nivel 7. */
const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
const levelName = (level: number) => (level === 7 ? "7–9" : String(level));

export function HskLevelsScreen({ isAdmin, counts }: { isAdmin: boolean; counts: Record<number, number> }) {
  const t = useTranslations("HskLibrary");
  return (
    <ManageShell isAdmin={isAdmin} crumbs={[{ label: t("library"), href: "/library" }, { label: t("title") }]} title={t("title")} wide>
      <p className="max-w-3xl text-muted-foreground">{t("intro")}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {HSK_LEVELS.map((level) => {
          const count = counts[level] ?? 0;
          return (
            <li key={level} className="flex min-h-40 flex-col rounded-xl border border-border bg-card p-5">
              <h2 className="text-2xl font-semibold">HSK {levelName(level)}</h2>
              {count ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">{t("entriesCount", { count })}</p>
                  <Link href={`/library/hsk/nivel/${level}`} className="mt-auto pt-8 text-sm font-medium text-primary hover:underline">
                    {t("viewVocabulary")} →
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">{t("unavailableHint")}</p>
                  <span className="mt-auto pt-8 text-sm font-medium text-muted-foreground">{t("unavailable")}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="rounded-xl border-l-2 border-primary bg-card px-4 py-3 text-sm text-muted-foreground">{t("officialBand")}</p>
    </ManageShell>
  );
}

const DEBOUNCE_MS = 250;

/** Vocabulario completo de un nivel: búsqueda y "Mostrar más" por cursor. */
export function HskCatalogScreen({
  isAdmin,
  level,
  initialQuery,
  initial,
  template,
}: {
  isAdmin: boolean;
  level: number;
  initialQuery: string;
  initial: CatalogPage;
  /** Plantilla en lecciones de 15 de este nivel (solo HSK 1–3): copia temporal. */
  template: { id: string; title: string } | null;
}) {
  const t = useTranslations("HskLibrary");
  const locale = useLocale();
  const router = useRouter();
  const { pending, error, run } = useRunner();
  const labels = studentLabels(locale === "es" ? "es" : "en");
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<CatalogRow[]>(initial.rows);
  const [total, setTotal] = useState(initial.total);
  const [next, setNext] = useState<number | null>(initial.next);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const firstQuery = useRef<string | null>(initialQuery.trim());

  // Nueva búsqueda: espera a que se deje de teclear y descarta respuestas viejas.
  useEffect(() => {
    const q = query.trim();
    if (firstQuery.current === q) {
      firstQuery.current = null;
      return;
    }
    const id = ++latest.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const page = await hskCatalogAction(level, q, 0);
        if (id !== latest.current || !page) return;
        setRows(page.rows);
        setTotal(page.total);
        setNext(page.next);
        setFailed(false);
      } catch {
        if (id === latest.current) setFailed(true);
      } finally {
        if (id === latest.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, level]);

  const showMore = async () => {
    if (next == null) return;
    const id = latest.current;
    setLoading(true);
    try {
      const page = await hskCatalogAction(level, query.trim(), next);
      if (id !== latest.current || !page) return;
      // El cursor es el orden oficial y no repite filas; por si acaso, se filtra.
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.order));
        return [...prev, ...page.rows.filter((r) => !seen.has(r.order))];
      });
      setNext(page.next);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManageShell
      isAdmin={isAdmin}
      wide
      crumbs={[{ label: t("library"), href: "/library" }, { label: t("title"), href: "/library/hsk" }, { label: `HSK ${levelName(level)}` }]}
      title={<>HSK {levelName(level)} <span className="ml-2 align-middle text-sm font-medium text-primary">{t("readOnly")}</span></>}
      error={error}
      actions={
        template && (
          <Button
            variant="outline"
            disabled={pending}
            title={t("copyTemplateHint")}
            onClick={() => run(() => copyTemplateAction(template.id), (r) => router.push(`/collections/${r.id}`))}
          >
            <Copy /> {t("copyTemplate", { level: levelName(level) })}
          </Button>
        )
      }
    >
      <p className="max-w-3xl text-muted-foreground">{t("catalogIntro")}</p>
      <SearchInput value={query} onChange={setQuery} label={t("searchVocabulary")} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("showing", { shown: rows.length, total })}
      </p>

      <div className={cn("overflow-x-auto rounded-xl border border-border transition-opacity", loading && "opacity-60")} aria-busy={loading}>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">#</th>
              <th className="px-3 py-2 font-medium">{t("colWord")}</th>
              <th className="px-3 py-2 font-medium">{t("colPinyin")}</th>
              <th className="hidden px-3 py-2 font-medium md:table-cell">{t("colMeaning")}</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">{t("colCategory")}</th>
              <th className="hidden px-3 py-2 font-medium md:table-cell">{t("colSentences")}</th>
              <th className="px-3 py-2 font-medium">{t("colLevels")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.order} className="border-t border-border align-top hover:bg-muted/40" data-testid="catalog-row">
                <td className="hidden px-3 py-2 text-muted-foreground tabular-nums sm:table-cell">{row.order}</td>
                <td className="px-3 py-2 font-hanzi text-xl whitespace-nowrap">{row.hanzi}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{row.pinyin}</span>
                  {/* En celular, el significado va bajo el pinyin. */}
                  <span className="mt-0.5 block text-muted-foreground md:hidden">{meaningFor(locale, row)}</span>
                </td>
                <td className="hidden max-w-96 px-3 py-2 text-muted-foreground md:table-cell">{meaningFor(locale, row)}</td>
                <td className="hidden px-3 py-2 text-muted-foreground lg:table-cell">{categoryLabel(row.category, labels)}</td>
                <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">
                  {row.sentences ? t("sentencesCount", { count: row.sentences }) : t("noSentences")}
                </td>
                <td className="px-3 py-2">
                  <span className="flex flex-wrap gap-1">
                    {row.levels.map((l) =>
                      l === level ? (
                        <span key={l} className="rounded-md bg-primary px-1.5 py-0.5 text-xs whitespace-nowrap text-primary-foreground">
                          HSK {levelName(l)}
                        </span>
                      ) : (
                        <Link
                          key={l}
                          href={`/library/hsk/nivel/${l}?q=${encodeURIComponent(row.hanzi)}`}
                          className="rounded-md bg-muted px-1.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground hover:text-foreground hover:underline"
                          title={t("alsoIn", { level: levelName(l) })}
                        >
                          HSK {levelName(l)}
                        </Link>
                      ),
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  {failed ? t("searchFailed") : t("noResults", { query: query.trim() })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {failed && rows.length > 0 && <p className="text-sm text-destructive">{t("searchFailed")}</p>}
      {next != null && (
        <Button variant="outline" className="self-center" disabled={loading} onClick={showMore}>
          {t("showMore")}
        </Button>
      )}
      {template && <p className="text-sm text-muted-foreground">{t("copyTemplateHint")}</p>}
    </ManageShell>
  );
}
