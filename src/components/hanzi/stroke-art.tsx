"use client";

import { useEffect, useId, useRef } from "react";
import type { StrokeData, StrokeRole } from "@/lib/lesson-types";

// Dibuja un carácter con los datos de hanzi-writer-data (sistema de
// coordenadas de 1024 con el eje Y invertido). Hanzi Writer solo colorea
// trazo y radical, y solo en hex; aquí cada trazo toma el color de su papel
// (radical verde, fonético azul) con los tokens CSS, en claro y en oscuro.

// "full": descomposición en color (reverso). "subtle": tinta con un matiz,
// para que el carácter se lea entero (anverso). "ink": todo en tinta.
export type StrokeTone = "full" | "subtle" | "ink";
const ROLE_COLOR: Record<StrokeTone, Record<StrokeRole, string>> = {
  full: { semantic: "var(--radical)", phonetic: "var(--phonetic)", other: "var(--hanzi-ink)" },
  subtle: { semantic: "var(--radical-subtle)", phonetic: "var(--phonetic-subtle)", other: "var(--hanzi-ink)" },
  ink: { semantic: "var(--hanzi-ink)", phonetic: "var(--hanzi-ink)", other: "var(--hanzi-ink)" },
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
  /** Solo al animar: bordes de pincel, tinta corrida, zonas secas y la punta del pincel. */
  ink?: boolean;
  className?: string;
  title?: string;
};

// Tinta china con filtros SVG (unidades de la cuadrícula de 1024): el borde se
// deforma con ruido grueso, se corre con un desenfoque leve y un ruido fino
// deja zonas más secas. La punta del pincel recorre la mediana del trazo con
// la misma curva que la animación de la tinta (ease-in-out).
const EASE_IN_OUT = "0.42 0 0.58 1";

function InkFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="2" result="edge" />
      <feDisplacementMap in="SourceGraphic" in2="edge" scale="10" xChannelSelector="R" yChannelSelector="G" result="rough" />
      <feGaussianBlur in="rough" stdDeviation="1.6" result="bleed" />
      {/* Carga de tinta: manchas amplias algo más claras, casi todo sólido. */}
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="9" result="load" />
      <feColorMatrix in="load" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.65" result="loadAlpha" />
      <feComposite in="bleed" in2="loadAlpha" operator="in" />
    </filter>
  );
}

export function StrokeArt({
  strokes,
  roles,
  mode,
  playing = true,
  speed = 1,
  startDelay = 0,
  tone = "full",
  ink = false,
  className,
  title,
}: StrokeArtProps) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const colorOf = (i: number) => ROLE_COLOR[tone][roles[i] ?? "other"];

  // La punta del pincel es SMIL (animateMotion): se pausa con el SVG entero,
  // igual que la animación CSS de la tinta.
  useEffect(() => {
    const svg = svgRef.current;
    if (!ink || !svg) return;
    if (playing) svg.unpauseAnimations();
    else svg.pauseAnimations();
  }, [ink, playing]);

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
  const medianPath = (points: [number, number][]) => `M ${points.map((p) => p.join(" ")).join(" L ")}`;
  return (
    <svg ref={svgRef} viewBox="0 0 1024 1024" className={className} role="img" aria-label={title}>
      <defs>
        {strokes.strokes.map((d, i) => (
          <clipPath key={i} id={`${id}-clip-${i}`}>
            <path d={d} />
          </clipPath>
        ))}
        {ink && <InkFilter id={`${id}-ink`} />}
      </defs>
      <g transform="translate(0, 900) scale(1, -1)">
        {strokes.strokes.map((d, i) => (
          <path key={i} d={d} fill="var(--stroke-ghost)" />
        ))}
        <g filter={ink ? `url(#${id}-ink)` : undefined}>
          {strokes.medians.map((points, i) => {
            const { length, delay, duration } = timings[i];
            return (
              <path
                key={i}
                className="stroke-draw"
                d={medianPath(points)}
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
        {ink &&
          strokes.medians.map((points, i) => {
            const { delay, duration } = timings[i];
            return (
              <circle key={i} className="brush-tip" r={30} fill="var(--keyword)" opacity={0}>
                <animateMotion
                  path={medianPath(points)}
                  begin={`${delay}s`}
                  dur={`${duration}s`}
                  calcMode="spline"
                  keyPoints="0;1"
                  keyTimes="0;1"
                  keySplines={EASE_IN_OUT}
                />
                <set attributeName="opacity" to="1" begin={`${delay}s`} dur={`${duration}s`} />
              </circle>
            );
          })}
      </g>
    </svg>
  );
}
