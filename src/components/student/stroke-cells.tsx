"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type HanziWriter from "hanzi-writer";
import { Check } from "lucide-react";
import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { cn } from "@/lib/utils";

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
};

export type StrokeCellsHandle = { reveal: () => void };

type Props = {
  chars: string[];
  /** Con contorno de guía (calcar) o de memoria. */
  guide: boolean;
  onProgress: (progress: CellsProgress) => void;
  ref?: Ref<StrokeCellsHandle>;
};

// Punto de partida de los niveles de /lab/escritura: con guía es más
// permisivo y da pista antes.
const SETTINGS = {
  guide: { leniency: 1.5, hint: 2 },
  free: { leniency: 1, hint: 3 },
} as const;

export function StrokeCells({ chars, guide, onProgress, ref }: Props) {
  const targets = useRef<(HTMLDivElement | null)[]>([]);
  const writers = useRef<(HanziWriter | null)[]>([]);
  const mistakes = useRef<number[]>(chars.map(() => 0));
  const finished = useRef<boolean[]>(chars.map(() => false));
  const revealed = useRef(false);
  const strokeCounts = useRef<(number | null)[]>(chars.map(() => null));
  const failed = useRef<number[]>([]);
  const shownAt = useRef(0);
  const firstActionMs = useRef<number | null>(null);
  const [done, setDone] = useState<boolean[]>(() => chars.map(() => false));
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
      });
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
      writer.quiz({
        leniency,
        showHintAfterMisses: hint,
        onMistake: (stroke) => {
          firstActionMs.current ??= Math.round(performance.now() - shownAt.current);
          mistakes.current[i] += 1;
          const before = strokeCounts.current.slice(0, i).reduce<number>((a, n) => a + (n ?? 0), 0);
          failed.current.push(before + stroke.strokeNum);
          report();
        },
        onCorrectStroke: () => {
          firstActionMs.current ??= Math.round(performance.now() - shownAt.current);
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
          )}
        >
          <div style={{ width: `min(30rem, 55dvh, calc((100vw - 4rem) / ${n}))` }} className="relative aspect-square touch-none">
            <div ref={(el) => void (targets.current[i] = el)} className="absolute inset-0" aria-label={`Casilla ${i + 1}: ${char}`} />
            {done[i] && (
              <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-rating-3 text-black">
                <Check className="size-4" aria-hidden />
              </span>
            )}
          </div>
        </CalligraphyGrid>
      ))}
    </div>
  );
}
