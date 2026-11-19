"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { writeResultsAction, type WriteResults } from "@/actions/vote";
import { CONNECTION_WARNING_AFTER, nextConnectionFailures } from "@/lib/polling";
import { cn } from "@/lib/utils";
import { SECTION_TITLE } from "./card-back";

// Escritura en clase, lado de la profesora (docs/DISENO-ESCRITURA-EN-CLASE.md):
// lo que escribió la clase en la palabra que está mostrando. Se sondea cada
// 2,5 s como los votos; sin sondeo carga los últimos resultados de la palabra.

const POLL_MS = 2500;

type Held = { senseId: string; data: WriteResults | null };

export function useWriteResults(sessionId: string | undefined, senseId: string | undefined, enabled: boolean, polling: boolean) {
  const [held, setHeld] = useState<Held | null>(null);
  const [failures, setFailures] = useState(0);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!sessionId || !senseId || busy.current) return;
    busy.current = true;
    try {
      const data = await writeResultsAction(sessionId, senseId);
      setHeld({ senseId, data });
      setFailures((n) => nextConnectionFailures(n, true));
    } catch {
      setFailures((n) => nextConnectionFailures(n, false));
    } finally {
      busy.current = false;
    }
  }, [sessionId, senseId]);

  useEffect(() => {
    if (!enabled) return;
    const first = window.setTimeout(() => void refresh(), 0);
    const id = polling ? window.setInterval(() => void refresh(), POLL_MS) : undefined;
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [enabled, polling, refresh]);

  // Los de otra palabra no se muestran mientras llegan los de esta.
  return { results: held && held.senseId === senseId ? held.data : null, failures };
}

const seconds = (ms: number | null) => (ms === null ? "—" : Math.round(ms / 1000));

/** Cuántos terminaron, para la barra de arriba (visible aunque la tarjeta esté de frente). */
export function WriteCounter({ results }: { results: WriteResults | null }) {
  const t = useTranslations("WriteClass");
  if (!results) return null;
  const done = results.summary.n;
  return (
    <span className="tabular-nums" data-testid="write-counter" aria-live="polite">
      {results.expected ? t("counter", { done, expected: results.expected }) : t("counterNoExpected", { done })}
    </span>
  );
}

export function WriteResultsPanel({ results, failures }: { results: WriteResults | null; failures: number }) {
  const t = useTranslations("WriteClass");
  const s = results?.summary;
  const device = { touch: t("devTouch"), mouse: t("devMouse"), pen: t("devPen") } as const;

  return (
    <section aria-label={t("panelTitle")}>
      <h2 className={cn("mb-2", SECTION_TITLE)}>{t("panelTitle")}</h2>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 px-5 py-4" data-testid="write-panel">
        {failures >= CONNECTION_WARNING_AFTER && (
          <p role="status" className="text-sm text-destructive">{t("reconnecting")}</p>
        )}
        {!results || !s || s.mode === "none" ? (
          <p className="text-sm text-muted-foreground">{t("panelWaiting")}</p>
        ) : (
          <div className="flex flex-col gap-3" aria-live="polite">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-semibold" data-testid="write-headline">
                {s.mode === "individual" ? t("panelHeadlineSmall", { n: s.n }) : t("panelHeadline", { passed: s.passed, n: s.n })}
              </span>
              <span className="text-sm text-muted-foreground">
                {results.expected ? t("panelOf", { expected: results.expected }) : results.joined > 0 ? t("panelJoined", { n: results.joined }) : ""}
              </span>
              <span className="text-xs text-muted-foreground">{results.open ? t("panelOpen") : t("panelClosed")}</span>
            </p>

            {s.mode === "individual" ? (
              <p className="text-sm text-muted-foreground">{t("panelSmall")}</p>
            ) : (
              <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {s.medianPrecision !== null && <span>{t("panelMedian", { n: Math.round(s.medianPrecision) })}</span>}
                {s.minPrecision !== null && s.maxPrecision !== null && <span>{t("panelRange", { min: s.minPrecision, max: s.maxPrecision })}</span>}
                {s.medianActiveMs !== null && <span>{t("panelTime", { s: seconds(s.medianActiveMs) })}</span>}
              </p>
            )}

            <details open={s.mode !== "full"} className="rounded-lg border border-border">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{t("panelStudents")} ({s.n})</summary>
              <ul className="max-h-56 divide-y divide-border overflow-y-auto">
                {s.rows.map((r) => (
                  <li key={r.name} className="grid grid-cols-[minmax(6rem,1fr)_minmax(5rem,2fr)_auto] items-center gap-3 px-3 py-2 text-sm">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="flex items-center gap-2" title={t("precisionCol")}>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <span
                          className={cn("block h-full", r.passed ? "bg-rating-3" : (r.precision ?? 0) >= 50 ? "bg-rating-2" : "bg-rating-1")}
                          style={{ width: `${r.precision ?? 0}%` }}
                        />
                      </span>
                      <span className="w-10 text-right tabular-nums">{r.precision === null ? "—" : `${r.precision} %`}</span>
                    </span>
                    <span className="text-right text-xs text-muted-foreground">
                      {seconds(r.activeMs)} s{r.pointer ? ` · ${device[r.pointer]}` : ""}
                      {r.shown > 0 && <span className="block">{t("shown", { n: r.shown })}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
            <p className="text-xs text-muted-foreground">{t("thresholdNote", { pass: results.config.pass })}</p>
          </div>
        )}
      </div>
    </section>
  );
}
