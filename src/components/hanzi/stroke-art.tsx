"use client";

import { useId } from "react";
import type { StrokeData, StrokeRole } from "@/lib/lesson-types";

// Dibuja un carácter con los datos de hanzi-writer-data (sistema de
// coordenadas de 1024 con el eje Y invertido). Hanzi Writer solo colorea
// trazo y radical, y solo en hex; aquí cada trazo toma el color de su papel
// (radical verde, fonético azul) con los tokens CSS, en claro y en oscuro.

// "full": descomposición en color (reverso). "subtle": tinta con un matiz,
// para que el carácter se lea entero (anverso). "ink": todo en tinta.
export type StrokeTone = "full" | "subtle" | "ink";
const ROLE_COLOR: Record<StrokeTone, Record<StrokeRole, string>> = {
  full: { semantic: "var(--radical)", phonetic: "var(--phonetic)", other: "var(--foreground)" },
  subtle: { semantic: "var(--radical-subtle)", phonetic: "var(--phonetic-subtle)", other: "var(--foreground)" },
  ink: { semantic: "var(--foreground)", phonetic: "var(--foreground)", other: "var(--foreground)" },
};

// Unidades de la cuadrícula por segundo a velocidad 1, y pausa entre trazos.
const UNITS_PER_SECOND = 1000;
const STROKE_GAP = 0.12;

function medianLength(points: [number, number][]) {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return length;
}

// Duración y retardo de cada trazo; sirve para encadenar varios caracteres.
export function strokeTimings(strokes: StrokeData, speed: number, startDelay = 0) {
  let t = startDelay;
  const timings = strokes.medians.map((m) => {
    const length = medianLength(m);
    const duration = Math.max(0.25, length / (UNITS_PER_SECOND * speed));
    const timing = { length, delay: t, duration };
    t += duration + STROKE_GAP / speed;
    return timing;
  });
  return { timings, end: t };
}

type StrokeArtProps = {
  strokes: StrokeData;
  roles: StrokeRole[];
  /** "static": dibujado completo. "animate": trazo a trazo. */
  mode: "static" | "animate";
  playing?: boolean;
  speed?: number;
  startDelay?: number;
  tone?: StrokeTone;
  className?: string;
  title?: string;
};

export function StrokeArt({
  strokes,
  roles,
  mode,
  playing = true,
  speed = 1,
  startDelay = 0,
  tone = "full",
  className,
  title,
}: StrokeArtProps) {
  const id = useId();
  const colorOf = (i: number) => ROLE_COLOR[tone][roles[i] ?? "other"];

  if (mode === "static") {
    return (
      <svg viewBox="0 0 1024 1024" className={className} role="img" aria-label={title}>
        <g transform="translate(0, 900) scale(1, -1)">
          {strokes.strokes.map((d, i) => (
            <path key={i} d={d} fill={colorOf(i)} />
          ))}
        </g>
      </svg>
    );
  }

  const { timings } = strokeTimings(strokes, speed, startDelay);
  return (
    <svg viewBox="0 0 1024 1024" className={className} role="img" aria-label={title}>
      <defs>
        {strokes.strokes.map((d, i) => (
          <clipPath key={i} id={`${id}-clip-${i}`}>
            <path d={d} />
          </clipPath>
        ))}
      </defs>
      <g transform="translate(0, 900) scale(1, -1)">
        {strokes.strokes.map((d, i) => (
          <path key={i} d={d} fill="var(--stroke-ghost)" />
        ))}
        {strokes.medians.map((points, i) => {
          const { length, delay, duration } = timings[i];
          return (
            <path
              key={i}
              className="stroke-draw"
              d={`M ${points.map((p) => p.join(" ")).join(" L ")}`}
              clipPath={`url(#${id}-clip-${i})`}
              fill="none"
              stroke={colorOf(i)}
              strokeWidth={200}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={length + 200}
              strokeDashoffset={length + 200}
              style={{
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                animationPlayState: playing ? "running" : "paused",
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
