"use client";

import { useEffect, useRef, useState } from "react";
import type HanziWriter from "hanzi-writer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Página de prueba (no enlazada): practicar la escritura de un carácter con el
// modo quiz de Hanzi Writer, para calibrar con el dedo la tolerancia de cada
// nivel antes de llevarlo a la clase. Solo en español: es para Ever.

type Mode = "calcar" | "memoria";
type Level = "flexible" | "normal" | "estricto";

// Punto de partida, a calibrar en el celular.
const LEVELS: Record<Level, { label: string; who: string; leniency: number; hint: number | false }> = {
  flexible: { label: "Flexible", who: "principiantes", leniency: 1.5, hint: 2 },
  normal: { label: "Normal", who: "la mayoría", leniency: 1, hint: 3 },
  estricto: { label: "Estricto", who: "avanzados", leniency: 0.7, hint: false },
};

type LogLine = { stroke: number; ok: boolean; backwards?: boolean };

export function WritingLab() {
  const [word, setWord] = useState("认识");
  const chars = [...word].filter((c) => /\p{Script=Han}/u.test(c));
  const [index, setIndex] = useState(0);
  const char = chars[Math.min(index, chars.length - 1)] ?? "";
  const [mode, setMode] = useState<Mode>("calcar");
  const [level, setLevel] = useState<Level | null>("normal");
  const [leniency, setLeniency] = useState(LEVELS.normal.leniency);
  const [hint, setHint] = useState<number | false>(LEVELS.normal.hint);
  const [run, setRun] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const [done, setDone] = useState<number | null>(null);
  const [missing, setMissing] = useState(false);
  const target = useRef<HTMLDivElement>(null);

  const pickLevel = (l: Level) => {
    setLevel(l);
    setLeniency(LEVELS[l].leniency);
    setHint(LEVELS[l].hint);
  };

  useEffect(() => {
    const el = target.current;
    if (!el || !char) return;
    let writer: HanziWriter | null = null;
    let cancelled = false;
    // Reiniciar el registro va en un setTimeout: la regla de React no admite
    // setState síncrono dentro de un efecto.
    const reset = window.setTimeout(() => {
      setLog([]);
      setDone(null);
      setMissing(false);
    }, 0);
    el.innerHTML = "";
    const dark = document.documentElement.classList.contains("dark");
    const size = Math.min(el.clientWidth || 320, 360);
    import("hanzi-writer").then(({ default: HW }) => {
      if (cancelled) return;
      writer = HW.create(el, char, {
        width: size,
        height: size,
        padding: 12,
        showCharacter: false,
        showOutline: mode === "calcar",
        strokeColor: dark ? "#efe6d6" : "#2b2420",
        outlineColor: dark ? "#4a443d" : "#d9cfc2",
        drawingColor: dark ? "#e6a08f" : "#b4533c",
        highlightColor: dark ? "#7fb0e6" : "#3d7cc9",
        drawingWidth: 6,
        charDataLoader: (c, onLoad, onError) => {
          fetch(`/hanzi-writer/${encodeURIComponent(c)}.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then(onLoad)
            .catch((e) => {
              setMissing(true);
              onError(e);
            });
        },
      });
      writer.quiz({
        leniency,
        showHintAfterMisses: hint,
        onCorrectStroke: (d) => setLog((l) => [...l, { stroke: d.strokeNum + 1, ok: true }]),
        onMistake: (d) => setLog((l) => [...l, { stroke: d.strokeNum + 1, ok: false, backwards: d.isBackwards }]),
        onComplete: (s) => setDone(s.totalMistakes),
      });
    });
    return () => {
      cancelled = true;
      window.clearTimeout(reset);
      writer?.cancelQuiz();
    };
  }, [char, mode, leniency, hint, run]);

  const mistakes = log.filter((l) => !l.ok).length;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Práctica de escritura · prueba</h1>
        <p className="text-sm text-muted-foreground">
          Traza el carácter con el dedo. Sirve para calibrar la tolerancia de cada nivel.
        </p>
      </header>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Palabra</span>
        <input
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            setIndex(0);
          }}
          className="h-11 rounded-lg border border-input bg-background px-3 font-hanzi text-xl"
        />
      </label>

      {chars.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label="Carácter">
          {chars.map((c, i) => (
            <button
              key={`${c}-${i}`}
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "size-11 rounded-lg border border-border font-hanzi text-2xl",
                i === index && "border-foreground bg-muted",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-muted-foreground">Modo</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["calcar", "memoria"] as const).map((m) => (
            <Button key={m} variant={mode === m ? "default" : "outline"} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m === "calcar" ? "Calcar" : "De memoria"}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-muted-foreground">Nivel</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <Button
              key={l}
              variant={level === l ? "default" : "outline"}
              aria-pressed={level === l}
              onClick={() => pickLevel(l)}
              className="h-auto flex-col py-2"
            >
              {LEVELS[l].label}
              <span className="text-xs font-normal opacity-80">{LEVELS[l].who}</span>
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Cuadrícula 米字格 detrás del carácter, como en la tarjeta. */}
      <div
        className="relative mx-auto aspect-square w-full max-w-[360px] touch-none rounded-xl border border-grid-line bg-card"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line), var(--grid-line)), linear-gradient(var(--grid-line), var(--grid-line)), linear-gradient(45deg, transparent calc(50% - 0.5px), var(--grid-line) 50%, transparent calc(50% + 0.5px)), linear-gradient(-45deg, transparent calc(50% - 0.5px), var(--grid-line) 50%, transparent calc(50% + 0.5px))",
          backgroundSize: "100% 1px, 1px 100%, 100% 100%, 100% 100%",
          backgroundPosition: "center, center, center, center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div ref={target} className="absolute inset-0" />
        {missing && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            No hay datos de trazos para {char}.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setRun((r) => r + 1)}>
          Repetir
        </Button>
        {chars.length > 1 && index < chars.length - 1 && (
          <Button variant="outline" onClick={() => setIndex((i) => i + 1)}>
            Siguiente carácter
          </Button>
        )}
        <p className="text-sm" aria-live="polite">
          {done !== null
            ? done === 0
              ? "¡Completo sin errores!"
              : `Completo con ${done} ${done === 1 ? "error" : "errores"}.`
            : `${mistakes} ${mistakes === 1 ? "error" : "errores"} hasta ahora`}
        </p>
      </div>

      <details className="rounded-xl border border-border p-3" open>
        <summary className="cursor-pointer text-sm font-medium">Ajuste fino (para calibrar)</summary>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span>
              Tolerancia: <strong className="tabular-nums">{leniency.toFixed(1)}</strong>{" "}
              <span className="text-muted-foreground">(más alto = más permisivo; la librería trae 1)</span>
            </span>
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.1}
              value={leniency}
              onChange={(e) => {
                setLeniency(Number(e.target.value));
                setLevel(null);
              }}
              className="accent-foreground"
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Pista tras</span>
            <select
              value={hint === false ? "no" : String(hint)}
              onChange={(e) => {
                setHint(e.target.value === "no" ? false : Number(e.target.value));
                setLevel(null);
              }}
              className="h-9 rounded-lg border border-input bg-background px-2"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "fallo" : "fallos"}
                </option>
              ))}
              <option value="no">sin pista</option>
            </select>
          </label>
          <p className="text-muted-foreground">
            Ajuste actual: {mode === "calcar" ? "calcar" : "de memoria"} · tolerancia {leniency.toFixed(1)} ·{" "}
            {hint === false ? "sin pista" : `pista tras ${hint}`}
          </p>
        </div>
      </details>

      {log.length > 0 && (
        <ol className="flex flex-col gap-1 text-sm">
          {log.map((l, i) => (
            <li key={i} className={l.ok ? "text-muted-foreground" : "text-destructive"}>
              Trazo {l.stroke}: {l.ok ? "bien" : l.backwards ? "al revés" : "no encaja"}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
