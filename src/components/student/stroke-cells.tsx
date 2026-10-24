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
    const list = writers.current;
    const dark = document.documentElement.classList.contains("dark");
    const { leniency, hint } = SETTINGS[guide ? "guide" : "free"];

    const startQuiz = (i: number) => {
      const writer = writers.current[i];
      if (!writer || finished.current[i]) return;
      writer.quiz({
        leniency,
        showHintAfterMisses: hint,
        onMistake: () => {
          mistakes.current[i] += 1;
          report();
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
              .then(onLoad)
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
