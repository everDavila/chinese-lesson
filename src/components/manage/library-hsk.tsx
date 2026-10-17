"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Copy, X } from "lucide-react";
import { copyTemplateAction } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useRouter } from "@/i18n/navigation";
import type { CatalogPage } from "@/lib/content";
import { categoryLabel, studentLabels } from "@/lib/student-labels";
import { cn } from "@/lib/utils";
import { ManageShell, SearchInput, meaningFor, useRunner } from "./shell";
import { catalogSelection, type SelectedEntry } from "./catalog-selection";

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

/** Páginas a mostrar: 1 … actual−1 actual actual+1 … última ("gap" = puntos suspensivos). */
export function pageList(current: number, last: number): (number | "gap")[] {
  const keep = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : "gap");
    out.push(p);
  });
  return out;
}

const DEBOUNCE_MS = 300;

/**
 * Vocabulario completo de un nivel: tabla (shadcn Table) con búsqueda, 25/50/
 * 100 filas por página y páginas numeradas (shadcn Pagination). Búsqueda,
 * página y tamaño viven en la dirección; el servidor entrega cada página.
 */
export function HskCatalogScreen({
  isAdmin,
  level,
  query,
  page,
  size,
  sizes,
  data,
  template,
}: {
  isAdmin: boolean;
  level: number;
  query: string;
  page: number;
  size: number;
  sizes: number[];
  data: CatalogPage;
  /** Plantilla en lecciones de 15 de este nivel (solo HSK 1–3): copia temporal. */
  template: { id: string; title: string } | null;
}) {
  const t = useTranslations("HskLibrary");
  const locale = useLocale();
  const router = useRouter();
  const nav = useNextRouter();
  const pathname = usePathname();
  const [navigating, startNavigation] = useTransition();
  const { pending, error, run } = useRunner();
  const labels = studentLabels(locale === "es" ? "es" : "en");
  const [text, setText] = useState(query);
  // Selección por sense_id: se mantiene entre páginas y niveles (catalog-selection).
  const selection = useSyncExternalStore(catalogSelection.subscribe, catalogSelection.getSnapshot, catalogSelection.getServerSnapshot);
  const selected = new Set(selection.map((e) => e.senseId));
  const [showSelection, setShowSelection] = useState(false);
  const entryOf = (row: CatalogPage["rows"][number]): SelectedEntry | null =>
    row.senseId ? { senseId: row.senseId, hanzi: row.hanzi, pinyin: row.pinyin, level, order: row.order } : null;
  const pageEntries = data.rows.flatMap((row) => entryOf(row) ?? []);
  const pageSelected = pageEntries.filter((e) => selected.has(e.senseId)).length;
  const typed = useRef(false);

  const last = Math.max(1, Math.ceil(data.total / size));
  const from = data.rows.length ? (page - 1) * size + 1 : 0;
  const to = (page - 1) * size + data.rows.length;

  // La dirección de una página con esta búsqueda y este tamaño.
  const hrefFor = (p: number, q = query, s = size) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("pagina", String(p));
    if (s !== sizes[0]) params.set("tamano", String(s));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const go = (href: string, replace = false) =>
    startNavigation(() => (replace ? nav.replace(href, { scroll: false }) : nav.push(href)));
  // Los números son enlaces reales (se pueden abrir en otra pestaña); el clic
  // normal navega sin recargar la página entera.
  const onPage = (p: number) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (p >= 1 && p <= last && p !== page) go(hrefFor(p));
  };

  // Buscar mientras se escribe: espera a que se deje de teclear y vuelve a la
  // primera página. Reemplaza la dirección (no llena el historial).
  useEffect(() => {
    if (!typed.current) return;
    const q = text.trim();
    if (q === query) return;
    const timer = window.setTimeout(() => go(hrefFor(1, q), true), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // hrefFor/go dependen de la página actual; lo que dispara la búsqueda es el texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

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
      <SearchInput
        value={text}
        onChange={(v) => {
          typed.current = true;
          setText(v);
        }}
        label={t("searchVocabulary")}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground" aria-live="polite" data-testid="catalog-range">
          {t("range", { from, to, total: data.total })}
        </p>
        <label className="flex items-center gap-2 text-muted-foreground">
          {t("perPage")}
          <select
            value={size}
            onChange={(e) => go(hrefFor(1, query, Number(e.target.value)))}
            className="h-9 rounded-lg border border-input bg-background px-2 text-foreground"
          >
            {sizes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={cn("rounded-xl border border-border transition-opacity", navigating && "opacity-60")} aria-busy={navigating}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  aria-label={t("selectPage")}
                  // A medias (algunas de la página): un guion en vez del ✓. El
                  // componente no deja cambiar el icono; Base UI marca el estado
                  // con data-indeterminate y se resuelve con clases.
                  className="data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:before:absolute data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-primary-foreground [&[data-indeterminate]_svg]:hidden"
                  checked={pageEntries.length > 0 && pageSelected === pageEntries.length}
                  indeterminate={pageSelected > 0 && pageSelected < pageEntries.length}
                  disabled={!pageEntries.length}
                  onCheckedChange={(on) =>
                    on ? catalogSelection.add(pageEntries) : catalogSelection.remove(pageEntries.map((e) => e.senseId))
                  }
                />
              </TableHead>
              <TableHead className="hidden sm:table-cell">#</TableHead>
              <TableHead>{t("colWord")}</TableHead>
              <TableHead>{t("colPinyin")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("colMeaning")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("colCategory")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("colSentences")}</TableHead>
              <TableHead>{t("colLevels")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow
                key={row.order}
                className="align-top"
                data-testid="catalog-row"
                data-state={row.senseId && selected.has(row.senseId) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    aria-label={t("selectWord", { hanzi: row.hanzi, pinyin: row.pinyin })}
                    checked={!!row.senseId && selected.has(row.senseId)}
                    disabled={!row.senseId}
                    onCheckedChange={(on) => {
                      const entry = entryOf(row);
                      if (!entry) return;
                      if (on) catalogSelection.add([entry]);
                      else catalogSelection.remove([entry.senseId]);
                    }}
                  />
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell" data-testid="catalog-order">
                  {row.order}
                </TableCell>
                <TableCell className="font-hanzi text-xl">{row.hanzi}</TableCell>
                <TableCell className="whitespace-normal">
                  <span className="font-medium">{row.pinyin}</span>
                  {/* En celular, el significado va bajo el pinyin. */}
                  <span className="mt-0.5 block text-muted-foreground md:hidden">{meaningFor(locale, row)}</span>
                </TableCell>
                <TableCell className="hidden max-w-96 whitespace-normal text-muted-foreground md:table-cell">{meaningFor(locale, row)}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{categoryLabel(row.category, labels)}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {row.sentences ? t("sentencesCount", { count: row.sentences }) : t("noSentences")}
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    {row.levels.map((l) =>
                      l === level ? (
                        <span key={l} className="rounded-md bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                          HSK {levelName(l)}
                        </span>
                      ) : (
                        <Link
                          key={l}
                          href={`/library/hsk/nivel/${l}?q=${encodeURIComponent(row.hanzi)}`}
                          className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          title={t("alsoIn", { level: levelName(l) })}
                        >
                          HSK {levelName(l)}
                        </Link>
                      ),
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {!data.rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                  {t("noResults", { query })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* role="link": el Button de Base UI marca el <a> como botón; son enlaces
          (y así los anuncia el lector de pantalla). Se pasa por props, sin tocar
          el componente de shadcn. */}
      {last > 1 && (
        <Pagination aria-label={t("pagination")}>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text={t("previous")}
                role="link"
                aria-label={t("previous")}
                href={hrefFor(Math.max(1, page - 1))}
                onClick={onPage(page - 1)}
                aria-disabled={page === 1}
                className={cn(page === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {pageList(page, last).map((p, i) =>
              p === "gap" ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink role="link" href={hrefFor(p)} isActive={p === page} onClick={onPage(p)} aria-label={t("pageN", { n: p })}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                text={t("next")}
                role="link"
                aria-label={t("next")}
                href={hrefFor(Math.min(last, page + 1))}
                onClick={onPage(page + 1)}
                aria-disabled={page === last}
                className={cn(page === last && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      {template && <p className="text-sm text-muted-foreground">{t("copyTemplateHint")}</p>}

      {/* Barra de la selección: fija abajo mientras haya algo elegido. */}
      {selection.length > 0 && (
        <section
          aria-label={t("selectionTitle")}
          className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium" aria-live="polite" data-testid="selection-count">
              {t("selectedCount", { count: selection.length })}
            </p>
            <span className="hidden text-sm text-muted-foreground sm:inline">{t("selectionHint")}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" aria-expanded={showSelection} onClick={() => setShowSelection((v) => !v)}>
                {showSelection ? t("hideSelection") : t("showSelection")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => catalogSelection.clear()}>
                {t("clearSelection")}
              </Button>
            </div>
          </div>
          {showSelection && (
            <ul className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
              {selection.map((e) => (
                <li key={e.senseId} className="flex items-center gap-1 rounded-md bg-muted py-0.5 pr-0.5 pl-2 text-sm">
                  <span className="font-hanzi">{e.hanzi}</span>
                  <span className="text-muted-foreground">{e.pinyin}</span>
                  <span className="text-xs text-muted-foreground">HSK {levelName(e.level)}</span>
                  <Button variant="ghost" size="icon-xs" aria-label={t("removeFromSelection", { hanzi: e.hanzi })} onClick={() => catalogSelection.remove([e.senseId])}>
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </ManageShell>
  );
}
