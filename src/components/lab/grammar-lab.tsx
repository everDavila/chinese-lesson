"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkSentence, type CheckResult, type GrammarPrompt } from "@/lib/grammar-check";
import { cn } from "@/lib/utils";
import data from "../../../contenido/gramatica-hsk1-piloto.json";

// Piloto (no enlazado): armar una frase con un punto de gramática de HSK 1.
// Dos usos: el alumno practica solo y escribe con el teclado pinyin, o la
// profesora proyecta la consigna en Zoom y los alumnos responden por el chat.
// Solo en español y sin base: si sirve en clase, se lleva a las lecciones.

type Point = {
  id: string;
  point: string;
  title: string;
  pattern: string;
  explanation: string;
  example: { zh: string; es: string };
  prompts: GrammarPrompt[];
};

const points = data.points as Point[];
const items = points.flatMap((point) => point.prompts.map((prompt) => ({ point, prompt })));

// Mismos colores que la valoración de la clase: verde, amarillo, rojo.
const TONE: Record<Exclude<CheckResult["kind"], "empty">, string> = {
  match: "border-rating-3 bg-rating-3/25",
  pattern: "border-rating-2 bg-rating-2/25",
  "not-hanzi": "border-rating-2 bg-rating-2/25",
  avoid: "border-rating-1 bg-rating-1/25",
  missing: "border-rating-1 bg-rating-1/25",
};

function feedbackText(result: CheckResult): string {
  switch (result.kind) {
    case "match":
      return "Coincide con una respuesta modelo.";
    case "pattern":
      return "Usa la estructura en el orden correcto, pero no coincide con las respuestas que tengo. Puede estar bien: compárala o pregúntale a tu profesora.";
    case "avoid":
      return result.why;
    case "missing":
      return `Falta «${result.piece}» o está en otro orden.`;
    case "not-hanzi":
      return "Escríbela en caracteres: en el celular, con el teclado de chino pinyin.";
    case "empty":
      return "";
  }
}

export function GrammarLab() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [projecting, setProjecting] = useState(false);
  const { point, prompt } = items[index];

  const go = (next: number) => {
    setIndex((next + items.length) % items.length);
    setAnswer("");
    setResult(null);
    setRevealed(false);
  };
  const check = () => setResult(checkSentence(answer, prompt));
  const shown = result && result.kind !== "empty" ? result : null;

  return (
    <main className={cn("mx-auto flex w-full flex-1 flex-col gap-5 px-4 py-6", projecting ? "max-w-3xl" : "max-w-md")}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Gramática: arma la frase · piloto</h1>
        <p className="text-sm text-muted-foreground">
          HSK 1 · {points.length} puntos · {items.length} frases. Consignas sin revisar.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Punto de gramática</span>
          <select
            value={point.id}
            onChange={(e) => go(items.findIndex((i) => i.point.id === e.target.value))}
            className="h-11 rounded-lg border border-input bg-background px-2"
          >
            {points.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <Button variant={projecting ? "default" : "outline"} aria-pressed={projecting} onClick={() => setProjecting((v) => !v)}>
          Proyectar en clase
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            {point.title}
            {point.pattern && <span className="ml-2 font-hanzi">{point.pattern}</span>}
          </p>
          <p className={cn("font-medium", projecting ? "text-4xl leading-tight" : "text-2xl")}>{prompt.es}</p>
          <p className={cn("text-muted-foreground", projecting ? "text-xl" : "text-sm")}>{prompt.hint}</p>
        </div>

        {projecting ? (
          <p className="text-sm text-muted-foreground">Los alumnos escriben su frase en el chat de Zoom.</p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Tu frase en chino</span>
              <input
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setResult(null);
                }}
                lang="zh-CN"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="h-12 rounded-lg border border-input bg-background px-3 font-hanzi text-2xl"
              />
            </label>
            <Button type="submit" disabled={!answer.trim()}>
              Revisar
            </Button>
          </form>
        )}

        <div aria-live="polite">
          {shown && !projecting && (
            <p className={cn("rounded-lg border px-3 py-2 text-sm", TONE[shown.kind])}>{feedbackText(shown)}</p>
          )}
        </div>

        {revealed ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {prompt.answers.length > 1 ? "Respuestas modelo" : "Respuesta modelo"}
              </p>
              <ul className={cn("font-hanzi", projecting ? "text-4xl" : "text-2xl")}>
                {prompt.answers.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="text-sm">
              <p>{point.explanation}</p>
              <p className="mt-1">
                <span className="font-hanzi text-base">{point.example.zh}</span>{" "}
                <span className="text-muted-foreground">{point.example.es}</span>
              </p>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setRevealed(true)}>
            Ver respuesta
          </Button>
        )}
      </section>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => go(index - 1)}>
          Anterior
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          {index + 1} / {items.length}
        </span>
        <Button variant="outline" onClick={() => go(index + 1)}>
          Siguiente
        </Button>
      </div>

      <footer className="text-xs text-muted-foreground">
        Explicaciones y ejemplos de cada punto:{" "}
        <a href={data.metadata.points.page} className="underline" target="_blank" rel="noreferrer">
          Gushi
        </a>
        , CC BY-SA 4.0. Consignas y respuestas: borrador generado con IA, sin revisión humana.
      </footer>
    </main>
  );
}
