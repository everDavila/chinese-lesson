"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { votingResultsAction, type VotingResults } from "@/actions/vote";
import { Button } from "@/components/ui/button";
import { combinedVerdict, teacherVerdict, votesVerdict, type Verdict } from "@/lib/semaphore";
import { CONNECTION_WARNING_AFTER, nextConnectionFailures } from "@/lib/polling";
import type { StudentLabels } from "@/lib/student-labels";
import { cn } from "@/lib/utils";
import type { Rating } from "./group-rating";

// Votación de los alumnos (fase 2). La docente la activa una vez por clase
// con la barra de arriba (VotingBar, tecla V) y desde ahí sigue a la tarjeta:
// al cambiar de palabra se cierra la ronda anterior y se abre la nueva, y el
// celular de cada alumno cambia solo. El código queda a la vista toda la
// clase. Bajo la tarjeta, los votos de esta palabra en vivo (sondeo cada 2,5 s).

const POLL_MS = 2500;
const DOT: Record<Verdict, string> = {
  nodata: "bg-muted-foreground/40",
  reinforce: "bg-rating-1",
  review: "bg-rating-2",
  mastered: "bg-rating-3",
};
const BAR = ["bg-rating-1", "bg-rating-2", "bg-rating-3", "bg-rating-4"];

/** Barra fija de la clase: dónde entrar, el código y activar/pausar. */
export function VotingBar({
  joinCode,
  live,
  onToggle,
  labels,
}: {
  joinCode: string;
  live: boolean;
  onToggle: () => void;
  labels: StudentLabels;
}) {
  // El dominio donde entran los alumnos (el de esta misma página).
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.host,
    () => "",
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-[3vw] pt-2 text-sm">
      {live ? (
        <p>
          {labels.votingJoin} <strong className="whitespace-nowrap">{origin}/v</strong> · {labels.votingCode}{" "}
          <strong className="font-mono text-xl tracking-widest" data-testid="join-code">
            {joinCode}
          </strong>
        </p>
      ) : (
        <p className="text-muted-foreground">{labels.votingHint}</p>
      )}
      <Button size="sm" variant={live ? "outline" : "default"} onClick={onToggle} aria-pressed={live}>
        {live ? labels.votingClose : labels.votingOpen}
        <kbd className="hidden rounded bg-background/30 px-1.5 text-xs sm:inline">V</kbd>
      </Button>
    </div>
  );
}

/** Votos de esta palabra en la clase, bajo la valoración de la docente. */
export function StudentVoting({
  sessionId,
  senseId,
  live,
  teacherRating,
  labels,
}: {
  sessionId: string;
  senseId: string;
  live: boolean;
  teacherRating?: Rating;
  labels: StudentLabels;
}) {
  const [results, setResults] = useState<VotingResults>(null);
  const [connectionFailures, setConnectionFailures] = useState(0);
  const polling = useRef(false);

  const refresh = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      setResults(await votingResultsAction(sessionId, senseId));
      setConnectionFailures((failures) => nextConnectionFailures(failures, true));
    } catch {
      setConnectionFailures((failures) => nextConnectionFailures(failures, false));
    } finally {
      polling.current = false;
    }
  }, [sessionId, senseId]);

  // La tarjeta se vuelve a montar al cambiar de palabra, así que esto carga
  // los últimos resultados de esta palabra; con la votación activa, se sondea.
  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0);
    const id = live ? window.setInterval(() => void refresh(), POLL_MS) : undefined;
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [live, refresh]);

  const counts = results?.counts ?? [0, 0, 0, 0];
  const total = counts.reduce((a, b) => a + b, 0);
  const votes = votesVerdict(counts);
  const combined = teacherRating ? combinedVerdict(votes, teacherVerdict(teacherRating)) : null;
  const verdictText = (v: Verdict) => (v === "nodata" ? labels.votingNoData : labels.verdicts[v]);

  return (
    <section className="rounded-xl border border-border bg-background/60 px-5 py-3" aria-label={labels.votingTitle}>
      <h2 className="font-medium">{labels.votingTitle}</h2>
      {connectionFailures >= CONNECTION_WARNING_AFTER && (
        <p role="status" className="text-sm text-destructive">{labels.votingReconnecting}</p>
      )}
      {!results && !live && <p className="text-sm text-muted-foreground">{labels.votingHint}</p>}

      {(results || live) && (
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
