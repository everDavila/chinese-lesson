"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type HanziWriter from "hanzi-writer";
import { Check, Eye } from "lucide-react";
import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { cn } from "@/lib/utils";
import { limitFor, type AttemptChar, type WriteConfig } from "@/lib/write-stats";

// Práctica de trazos de una palabra: una casilla por carácter, con el modo
// quiz de Hanzi Writer (valida cada trazo al dibujarlo; no hay «comprobar»).
// Sale de /lab/escritura. Quien lo usa lo remonta con `key` para reiniciar.

export type CellsProgress = {
  mistakes: number;
  completed: number;
  total: number;
  /** El alumno pidió ver la respuesta («No me sale»). */
  revealed: boolean;
  /** Trazos de toda la palabra; null si falta algún dato de trazos. */
  strokesTotal: number | null;
  /** Posición (en toda la palabra) de cada trazo en el que se equivocó. */
  failedStrokes: number[];
  /** Ms desde que se mostró la palabra hasta el primer trazo; null si no hubo. */
  msToFirstAction: number | null;
  /** Ms desde que se mostró la palabra hasta este momento. */
  msTotal: number;
  /** Por carácter: trazos, completados, errores por trazo y si se le mostró (Escritura en clase). */
  chars: AttemptChar[];
  /** Instante (ms desde que se mostró la palabra) de cada acción de trazo, acertada o no. */
  events: number[];
};

export type StrokeCellsHandle = { reveal: () => void };

type Props = {
  chars: string[];
  /** Con contorno de guía (calcar) o de memoria. */
  guide: boolean;
  onProgress: (progress: CellsProgress) => void;
  /** Piloto: atenúa las casillas que aún no tocan y avisa si las tocas. */
  lockHint?: boolean;
  /**
   * Escritura en clase: límites de errores. Un carácter que llega a su límite
   * (según sus trazos) se le muestra y se sigue con el siguiente; tras
   * `perStroke` errores en un trazo, el siguiente intento se da por bueno.
   */
  config?: WriteConfig;
  ref?: Ref<StrokeCellsHandle>;
};

// Punto de partida de los niveles de /lab/escritura: con guía es más
// permisivo y da pista antes.
const SETTINGS = {
  guide: { leniency: 1.5, hint: 2 },
  free: { leniency: 1, hint: 3 },
} as const;

export function StrokeCells({ chars, guide, onProgress, lockHint = false, config, ref }: Props) {
  const targets = useRef<(HTMLDivElement | null)[]>([]);
  const writers = useRef<(HanziWriter | null)[]>([]);
  const mistakes = useRef<number[]>(chars.map(() => 0));
  const finished = useRef<boolean[]>(chars.map(() => false));
  const revealed = useRef(false);
  const strokeCounts = useRef<(number | null)[]>(chars.map(() => null));
  const failed = useRef<number[]>([]);
  // Por carácter: errores por trazo, trazos completados y si se le mostró (Escritura en clase).
  const errorsBy = useRef<number[][]>(chars.map(() => []));
  const doneBy = useRef<number[]>(chars.map(() => 0));
  const shownBy = useRef<boolean[]>(chars.map(() => false));
  const events = useRef<number[]>([]);
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });
  const shownAt = useRef(0);
  const firstActionMs = useRef<number | null>(null);
  const [done, setDone] = useState<boolean[]>(() => chars.map(() => false));
  // Caracteres que se le mostraron (límite o «No me sale»): se marcan distinto de los que escribió.
  const [shown, setShown] = useState<boolean[]>(() => chars.map(() => false));
  const [nudge, setNudge] = useState(0);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  const report = () =>
    onProgressRef.current({
      mistakes: mistakes.current.reduce((a, b) => a + b, 0),
      completed: finished.current.filter(Boolean).length,
      total: chars.length,
      revealed: revealed.current,
      strokesTotal: strokeCounts.current.every((n) => n !== null) ? strokeCounts.current.reduce((a, b) => a! + b!, 0) : null,
      failedStrokes: [...failed.current],
      msToFirstAction: firstActionMs.current,
      msTotal: Math.round(performance.now() - shownAt.current),
      chars: chars.map((char, i) => ({
        char,
        strokes: strokeCounts.current[i],
        done: doneBy.current[i],
        errors: errorsBy.current[i],
        shown: shownBy.current[i],
      })),
      events: [...events.current],
    });

  const markDone = (i: number) => {
    if (finished.current[i]) return;
    finished.current[i] = true;
    setDone([...finished.current]);
    report();
  };

  useImperativeHandle(ref, () => ({
    reveal() {
      revealed.current = true;
      writers.current.forEach((w, i) => {
        if (!w || finished.current[i]) return;
        w.cancelQuiz();
        void w.animateCharacter();
        finished.current[i] = true;
        shownBy.current[i] = true;
      });
      setShown([...shownBy.current]);
      setDone([...finished.current]);
      report();
    },
  }));

  useEffect(() => {
    let cancelled = false;
    shownAt.current = performance.now();
    const list = writers.current;
    const dark = document.documentElement.classList.contains("dark");
    const { leniency, hint } = SETTINGS[guide ? "guide" : "free"];

    const startQuiz = (i: number) => {
      const writer = writers.current[i];
      if (!writer || finished.current[i]) return;
      const cfg = configRef.current;
      writer.quiz({
        leniency,
        showHintAfterMisses: hint,
        // Tras `perStroke` errores en un trazo, el siguiente intento se da por bueno.
        ...(cfg ? { markStrokeCorrectAfterMisses: cfg.perStroke + 1 } : {}),
        onMistake: (stroke) => {
          const at = Math.round(performance.now() - shownAt.current);
          firstActionMs.current ??= at;
          events.current.push(at);
          mistakes.current[i] += 1;
          if (errorsBy.current[i][stroke.strokeNum] !== undefined) errorsBy.current[i][stroke.strokeNum] += 1;
          const before = strokeCounts.current.slice(0, i).reduce<number>((a, n) => a + (n ?? 0), 0);
          failed.current.push(before + stroke.strokeNum);
          // Escritura en clase: al llegar al límite del carácter (según sus trazos) se le muestra y sigue el siguiente.
          const total = strokeCounts.current[i];
          if (cfg && total !== null && mistakes.current[i] >= limitFor(total, cfg)) {
            writer.cancelQuiz();
            void writer.animateCharacter();
            shownBy.current[i] = true;
            finished.current[i] = true;
            setShown([...shownBy.current]);
            setDone([...finished.current]);
            report();
            startQuiz(i + 1);
            return;
          }
          report();
        },
        onCorrectStroke: (stroke) => {
          const at = Math.round(performance.now() - shownAt.current);
          firstActionMs.current ??= at;
          events.current.push(at);
          doneBy.current[i] = Math.max(doneBy.current[i], stroke.strokeNum + 1);
        },
        onComplete: () => {
          markDone(i);
          startQuiz(i + 1);
        },
      });
    };

    import("hanzi-writer").then(({ default: HW }) => {
      if (cancelled) return;
      chars.forEach((char, i) => {
        const el = targets.current[i];
        if (!el) return;
        el.innerHTML = "";
        const size = el.clientWidth || 240;
        writers.current[i] = HW.create(el, char, {
          width: size,
          height: size,
          padding: 12,
          showCharacter: false,
          showOutline: guide,
          strokeColor: dark ? "#efe6d6" : "#2b2420",
          outlineColor: dark ? "#5a5249" : "#cbbfae",
          drawingColor: dark ? "#e6a08f" : "#b4533c",
          highlightColor: dark ? "#7fb0e6" : "#3d7cc9",
          drawingWidth: 6,
          charDataLoader: (c, onLoad, onError) => {
            fetch(`/hanzi-writer/${encodeURIComponent(c)}.json`)
              .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
              .then((data) => {
                strokeCounts.current[i] = Array.isArray(data?.strokes) ? data.strokes.length : null;
                if (strokeCounts.current[i] !== null) errorsBy.current[i] = Array<number>(strokeCounts.current[i]!).fill(0);
                onLoad(data);
              })
              .catch((e) => {
                // Sin datos de trazos no se puede practicar: se salta la casilla.
                markDone(i);
                startQuiz(i + 1);
                onError(e);
              });
          },
        });
      });
      startQuiz(0);
    });

    return () => {
      cancelled = true;
      list.forEach((w) => w?.cancelQuiz());
    };
    // Se monta una vez por palabra y modo: quien lo usa cambia la `key` para reiniciar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = done.findIndex((d) => !d);
  const n = chars.length;

  return (
    <div lang="zh-Hans" className="flex flex-wrap justify-center gap-4">
      {chars.map((char, i) => (
        <CalligraphyGrid
          key={`${i}-${char}`}
          className={cn(
            "rounded-xl bg-card transition-shadow",
            i === active && "border-primary shadow-[0_0_0_2px_var(--primary)]",
            i === active && nudge > 0 && "animate-pulse",
            lockHint && i > active && active !== -1 && "opacity-40",
          )}
        >
          <div
            style={{ width: `min(30rem, 55dvh, calc((100vw - 4rem) / ${n}))` }}
            className="relative aspect-square touch-none"
            onPointerDownCapture={() => {
              if (!lockHint || active === -1 || i <= active) return;
              setNudge((k) => k + 1);
              setTimeout(() => setNudge(0), 900);
            }}
          >
            {lockHint && i > active && active !== -1 && (
              <span className="pointer-events-none absolute inset-x-2 top-2 z-10 rounded-full bg-foreground px-3 py-1 text-center text-xs font-medium text-background">
                Empieza por el {active + 1 === 1 ? "primero" : `n.º ${active + 1}`}
              </span>
            )}
            <div ref={(el) => void (targets.current[i] = el)} className="absolute inset-0" aria-label={`Casilla ${i + 1}: ${char}`} />
            {done[i] && !shown[i] && (
              <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-rating-3 text-black">
                <Check className="size-4" aria-hidden />
              </span>
            )}
            {done[i] && shown[i] && (
              <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground" title="Te lo mostramos">
                <Eye className="size-4" aria-hidden />
              </span>
            )}
          </div>
        </CalligraphyGrid>
      ))}
    </div>
  );
}
