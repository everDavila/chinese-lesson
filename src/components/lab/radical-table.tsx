"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { pageList } from "@/lib/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type RadicalRow = {
  number: number;
  char: string;
  pinyin: string;
  strokes: number;
  meaning: string;
  variants: string[];
  hskCount: number;
  examples: string[];
};

type Labels = Record<
  | "search" | "filterAll" | "filterUsed" | "filterTop" | "sortLabel" | "sortNumber"
  | "sortFrequency" | "sortStrokes" | "colNumber" | "colRadical" | "colPinyin"
  | "colMeaning" | "colStrokes" | "colHsk" | "colExamples" | "empty" | "count"
  | "pagination" | "previous" | "next" | "pageN",
  string
>;

type Scope = "all" | "used" | "top";
type Sort = "number" | "frequency" | "strokes";

const TOP = 40;
const PAGE_SIZE = 25;

// Quita los tonos para que «shui» encuentre shuǐ.
const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Los 214 radicales con filtros mínimos: búsqueda (hanzi, pinyin o significado),
 * alcance (todos, con uso en HSK, los 40 más usados) y orden (número,
 * frecuencia, trazos). «Los 40 más usados» se calcula por frecuencia, no por
 * número de radical.
 */
export function RadicalTable({ rows, labels }: { rows: RadicalRow[]; labels: Labels }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("top");
  const [sort, setSort] = useState<Sort>("frequency");
  const [page, setPage] = useState(1);

  const topChars = useMemo(
    () => new Set([...rows].sort((a, b) => b.hskCount - a.hskCount).slice(0, TOP).map((r) => r.char)),
    [rows],
  );

  const shown = useMemo(() => {
    const q = plain(query.trim());
    const list = rows.filter((r) => {
      if (scope === "used" && r.hskCount === 0) return false;
      if (scope === "top" && !topChars.has(r.char)) return false;
      if (!q) return true;
      return (
        [r.char, ...r.variants].some((f) => f.includes(q)) ||
        plain(r.pinyin).includes(q) ||
        plain(r.meaning).includes(q)
      );
    });
    return list.sort((a, b) =>
      sort === "frequency" ? b.hskCount - a.hskCount || a.number - b.number
      : sort === "strokes" ? a.strokes - b.strokes || a.number - b.number
      : a.number - b.number,
    );
  }, [rows, query, scope, sort, topChars]);

  const last = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, last);
  const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  // Los enlaces de la paginación son botones: la tabla no vive en la dirección.
  const go = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (p >= 1 && p <= last) setPage(p);
  };

  const scopes: { value: Scope; label: string }[] = [
    { value: "top", label: labels.filterTop.replace("{n}", String(TOP)) },
    { value: "used", label: labels.filterUsed },
    { value: "all", label: labels.filterAll },
  ];
  const sorts: { value: Sort; label: string }[] = [
    { value: "frequency", label: labels.sortFrequency },
    { value: "number", label: labels.sortNumber },
    { value: "strokes", label: labels.sortStrokes },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder={labels.search}
            aria-label={labels.search}
            className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {labels.sortLabel}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as Sort); setPage(1); }}
            className="h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {scopes.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={scope === s.value}
            onClick={() => { setScope(s.value); setPage(1); }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              scope === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {labels.count.replace("{n}", String(shown.length))}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">{labels.colNumber}</TableHead>
              <TableHead>{labels.colRadical}</TableHead>
              <TableHead>{labels.colPinyin}</TableHead>
              <TableHead>{labels.colMeaning}</TableHead>
              <TableHead className="text-right">{labels.colStrokes}</TableHead>
              <TableHead className="text-right">{labels.colHsk}</TableHead>
              <TableHead>{labels.colExamples}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.number}>
                <TableCell className="text-muted-foreground tabular-nums">{r.number}</TableCell>
                <TableCell>
                  <span lang="zh-Hans" className="font-hanzi text-3xl leading-none">{r.char}</span>
                  {r.variants.length > 0 && (
                    <span lang="zh-Hans" className="ml-2 font-hanzi text-lg text-muted-foreground">{r.variants.join(" ")}</span>
                  )}
                </TableCell>
                <TableCell lang="zh-Latn">{r.pinyin}</TableCell>
                <TableCell className="whitespace-normal">{r.meaning}</TableCell>
                <TableCell className="text-right tabular-nums">{r.strokes}</TableCell>
                <TableCell className="text-right tabular-nums">{r.hskCount || "–"}</TableCell>
                <TableCell lang="zh-Hans" className="font-hanzi text-lg tracking-wider">{r.examples.join(" ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {shown.length === 0 && <p className="p-6 text-center text-muted-foreground">{labels.empty}</p>}
      </div>

      {last > 1 && (
        <Pagination aria-label={labels.pagination}>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text={labels.previous}
                role="link"
                aria-label={labels.previous}
                href="#"
                onClick={go(current - 1)}
                aria-disabled={current === 1}
                className={cn(current === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {pageList(current, last).map((p, i) =>
              p === "gap" ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink role="link" href="#" isActive={p === current} onClick={go(p)} aria-label={labels.pageN.replace("{n}", String(p))}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                text={labels.next}
                role="link"
                aria-label={labels.next}
                href="#"
                onClick={go(current + 1)}
                aria-disabled={current === last}
                className={cn(current === last && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
