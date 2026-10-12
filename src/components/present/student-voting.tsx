"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { closeVotingAction, openVotingAction, votingResultsAction, type VotingResults } from "@/actions/vote";
import { Button } from "@/components/ui/button";
import { combinedVerdict, teacherVerdict, votesVerdict, type Verdict } from "@/lib/semaphore";
import type { StudentLabels } from "@/lib/student-labels";
import { cn } from "@/lib/utils";
import type { Rating } from "./group-rating";

// Votación de los alumnos bajo la valoración de la docente (fase 2). Abre
// una ronda para el sentido de la tarjeta, muestra dónde entrar y los votos
// en vivo (sondeo cada 2,5 s mientras está abierta). Tecla V: abrir/cerrar.

const POLL_MS = 2500;
const DOT: Record<Verdict, string> = {
  nodata: "bg-muted-foreground/40",
  reinforce: "bg-rating-1",
  review: "bg-rating-2",
  mastered: "bg-rating-3",
};
const BAR = ["bg-rating-1", "bg-rating-2", "bg-rating-3", "bg-rating-4"];

export function StudentVoting({
  sessionId,
  senseId,
  joinCode,
  teacherRating,
  labels,
}: {
  sessionId: string;
  senseId: string;
  joinCode: string;
  teacherRating?: Rating;
  labels: StudentLabels;
}) {
  const [results, setResults] = useState<VotingResults>(null);
  const [pending, startTransition] = useTransition();
  // El dominio donde entran los alumnos (el de esta misma página).
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.host,
    () => "",
  );

  const refresh = useCallback(async () => {
    try {
      setResults(await votingResultsAction(sessionId, senseId));
    } catch {
      // Sin red: se reintenta en el siguiente sondeo.
    }
  }, [sessionId, senseId]);

  // La tarjeta se vuelve a montar al cambiar de palabra, así que esto carga
  // los últimos resultados de esta palabra; si la ronda está abierta, se sondea.
  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(first);
  }, [refresh]);
  useEffect(() => {
    if (!results?.open) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [results?.open, refresh]);

  const toggle = useCallback(
    () =>
      startTransition(async () => {
        if (results?.open) await closeVotingAction(sessionId);
        else await openVotingAction(sessionId, senseId);
        await refresh();
      }),
    [results?.open, sessionId, senseId, refresh],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "v" || e.key === "V") && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement)) toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const counts = results?.counts ?? [0, 0, 0, 0];
  const total = counts.reduce((a, b) => a + b, 0);
  const votes = votesVerdict(counts);
  const combined = teacherRating ? combinedVerdict(votes, teacherVerdict(teacherRating)) : null;
  const verdictText = (v: Verdict) => (v === "nodata" ? labels.votingNoData : labels.verdicts[v]);

  return (
    <section className="rounded-xl border border-border bg-background/60 px-5 py-3" aria-label={labels.votingTitle}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-medium">{labels.votingTitle}</h2>
          {results?.open ? (
            <p className="text-sm">
              {labels.votingJoin} <strong className="whitespace-nowrap">{origin}/v</strong> · {labels.votingCode}{" "}
              <strong className="font-mono text-2xl tracking-widest" data-testid="join-code">
                {joinCode}
              </strong>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{labels.votingHint}</p>
          )}
        </div>
        <Button
          variant={results?.open ? "outline" : "default"}
          className="ml-auto"
          disabled={pending}
          onClick={toggle}
        >
          {results?.open ? labels.votingClose : labels.votingOpen}
          <kbd className="hidden rounded bg-background/30 px-1.5 text-xs sm:inline">V</kbd>
        </Button>
      </div>

      {results && (
        <div className="mt-3 flex flex-col gap-2" aria-live="polite">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
            {counts.map((n, i) => (
              <span key={i} className={BAR[i]} style={{ width: total ? `${(n / total) * 100}%` : 0 }} />
            ))}
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium" data-testid="votes-total">
              {labels.votesCount(total)}
            </span>
            {counts.map((n, i) => (
              <span key={i} className="text-muted-foreground">
                {labels.ratings[i]}: {n}
              </span>
            ))}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", DOT[votes])} />
              {verdictText(votes)}
            </span>
            {combined && (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                {labels.votingCombined}:
                <span className={cn("size-2.5 rounded-full", DOT[combined])} />
                {verdictText(combined)}
              </span>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
