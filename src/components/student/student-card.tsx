"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, ChevronUp, HelpCircle, RotateCcw, Volume2 } from "lucide-react";
import { CardBack } from "@/components/present/card-back";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/lib/lesson-types";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";
import {
  prefsStore,
  progressStore,
  suggestRating,
  type Prefs,
  type Rating,
} from "./student-store";
import { StrokeCells, type CellsProgress, type StrokeCellsHandle } from "./stroke-cells";

// Tarjeta del alumno (piloto, /lab/estudiante): sin cuenta, el avance vive en
// el dispositivo. Frente = practicar los trazos; al valorar gira al reverso.
// Texto solo en español mientras sea piloto (como /lab/escritura).

const RATINGS: { value: Rating; label: string; tone: string }[] = [
  { value: 1, label: "No la sé", tone: "bg-rating-1" },
  { value: 2, label: "Me costó", tone: "bg-rating-2" },
  { value: 3, label: "Bien", tone: "bg-rating-3" },
  { value: 4, label: "Fácil", tone: "bg-rating-4" },
];

const MODES: { value: Prefs["mode"]; label: string }[] = [
  { value: "guide", label: "Con guía" },
  { value: "free", label: "Sin guía" },
  { value: "random", label: "Aleatorio" },
];

const AFTER: { value: Prefs["after"]; label: string }[] = [
  { value: "detail", label: "Ver detalle" },
  { value: "practice", label: "Solo practicar" },
];

// Sorteo estable por palabra y repetición: sin Math.random en el render.
function coin(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (h & 1) === 0;
}

function feedback(progress: CellsProgress): string {
  if (progress.revealed) return "Aquí la tienes. Obsérvala y vuelve a intentarlo.";
  const perChar = progress.mistakes / progress.total;
  const errors = `${progress.mistakes} ${progress.mistakes === 1 ? "error" : "errores"}`;
  if (progress.mistakes === 0) return "¡Perfecto! Sin errores";
  if (perChar <= 2) return `¡Bien! ${errors}`;
  return `Sigue practicando · ${errors}`;
}

export function StudentCard({ lesson }: { lesson: Lesson }) {
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.snapshot, prefsStore.serverSnapshot);
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.snapshot, progressStore.serverSnapshot);
  const cells = useRef<StrokeCellsHandle>(null);

  const [view, setView] = useState<"list" | "card">("list");
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [run, setRun] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [state, setState] = useState<{ key: string; progress: CellsProgress } | null>(null);
  const [choice, setChoice] = useState<{ key: string; rating: Rating } | null>(null);

  const count = lesson.items.length;
  const item = lesson.items[index];
  const itemKey = item.senseId ?? `${item.word.hanzi}#${item.senseIndex}`;
  const sense = item.word.senses[item.senseIndex];
  const chars = item.characters.map((c) => c.char);
  const guide = prefs.mode === "random" ? coin(`${itemKey}:${run}`) : prefs.mode === "guide";
  const cellsKey = `${itemKey}:${run}:${guide}`;

  const current = state?.key === cellsKey ? state.progress : null;
  const finished = current !== null && current.completed === current.total;
  const suggested = current ? suggestRating(current.mistakes, current.total, current.revealed) : 3;
  const selected = choice?.key === cellsKey ? choice.rating : suggested;

  const go = (next: number) => {
    setIndex(Math.min(Math.max(next, 0), count - 1));
    setSide("front");
    setRun(0);
    setListOpen(false);
  };
  const restart = () => {
    setRun((r) => r + 1);
    setSide("front");
  };
  const rate = () => {
    progressStore.save(itemKey, {
      rating: selected,
      mistakes: current?.mistakes ?? 0,
      mode: guide ? "guide" : "free",
      gaveUp: current?.revealed ?? false,
      at: new Date().toISOString(),
    });
    if (prefs.after === "detail") setSide("back");
  };

  if (view === "list") {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <header>
          <h1 className="text-2xl font-semibold">Las palabras que aprenderás en esta lección</h1>
          <p className="text-sm text-muted-foreground">{lesson.title} · {count} palabras</p>
        </header>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lesson.items.map((it, i) => {
            const key = it.senseId ?? `${it.word.hanzi}#${it.senseIndex}`;
            const record = progress[key];
            const s = it.word.senses[it.senseIndex];
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    go(i);
                    setView("card");
                  }}
                  className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
                >
                  <span lang="zh-Hans" className="font-hanzi text-3xl">{it.word.hanzi}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span lang="zh-Latn" className="text-sm text-muted-foreground">{s.pinyin}</span>
                    <span className="truncate">{s.meaning.es}</span>
                  </span>
                  {record && (
                    <span
                      className={cn("size-3 shrink-0 rounded-full", RATINGS[record.rating - 1].tone)}
                      role="img"
                      aria-label={`Última valoración: ${RATINGS[record.rating - 1].label}`}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Button variant="outline" size="icon" aria-label="Lista de palabras" onClick={() => setView("list")}>
          <ArrowLeft />
        </Button>
        <span className="font-medium">Lista de palabras</span>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4 sm:px-6">
        {side === "front" ? (
          <section className="flex flex-1 flex-col items-center gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
            {/* El frente es solo práctica: no muestra significado ni pinyin. El
                audio es lo único que identifica la palabra sin texto. */}
            <h1 className="sr-only">Practica la palabra {index + 1} de {count}</h1>
            <Button variant="outline" onClick={() => speakChinese(item.word.hanzi)}>
              <Volume2 /> Escuchar la palabra
            </Button>

            <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:justify-center">
              <StrokeCells
                key={cellsKey}
                ref={cells}
                chars={chars}
                guide={guide}
                onProgress={(p) => setState({ key: cellsKey, progress: p })}
              />
              <fieldset className="flex shrink-0 flex-row gap-1 rounded-xl border border-border p-1 lg:flex-col">
                <legend className="sr-only">Modo de práctica</legend>
                {MODES.map((m) => (
                  <label
                    key={m.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      prefs.mode === m.value ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="modo"
                      className="accent-primary"
                      checked={prefs.mode === m.value}
                      onChange={() => {
                        prefsStore.set({ ...prefs, mode: m.value });
                        setRun((r) => r + 1);
                      }}
                    />
                    {m.label}
                  </label>
                ))}
              </fieldset>
            </div>

            <div className="flex min-h-20 flex-col items-center gap-3" aria-live="polite">
              {finished ? (
                <p className="rounded-full bg-rating-3/25 px-4 py-1.5 font-medium">{feedback(current)}</p>
              ) : (
                <p className={cn("text-sm font-medium", (current?.mistakes ?? 0) > 0 ? "text-destructive" : "text-muted-foreground")}>
                  Errores: {current?.mistakes ?? 0}
                </p>
              )}
            </div>

            {finished && prefs.after === "detail" && (
              <div className="flex w-full max-w-xl flex-col items-center gap-2">
                <div className="grid w-full grid-cols-4 gap-2" role="radiogroup" aria-label="¿Cómo te fue?">
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={selected === r.value}
                      onClick={() => setChoice({ key: cellsKey, rating: r.value })}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-sm font-medium transition-colors",
                        selected === r.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                      )}
                    >
                      <span className={cn("size-3 rounded-full", r.tone)} aria-hidden />
                      {r.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Elige cómo te fue para guardar tu avance.</p>
                <Button onClick={rate}>Guardar y ver detalle</Button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="secondary" onClick={restart}>
                <RotateCcw /> Reiniciar
              </Button>
              {!finished && (
                <Button variant="outline" onClick={() => cells.current?.reveal()}>
                  <HelpCircle /> No me sale
                </Button>
              )}
              {finished && prefs.after === "practice" && index < count - 1 && (
                <Button onClick={() => go(index + 1)}>Siguiente palabra</Button>
              )}
              <Button variant="link" onClick={() => setSide("back")}>Ver detalle</Button>
            </div>

            <div className="mt-auto flex items-center gap-3 border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">Al terminar:</span>
              <fieldset className="flex gap-1 rounded-xl border border-border p-1">
                <legend className="sr-only">Al terminar la palabra</legend>
                {AFTER.map((a) => (
                  <label
                    key={a.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      prefs.after === a.value ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="al-terminar"
                      className="accent-primary"
                      checked={prefs.after === a.value}
                      onChange={() => prefsStore.set({ ...prefs, after: a.value })}
                    />
                    {a.label}
                  </label>
                ))}
              </fieldset>
            </div>
          </section>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div>
              <Button variant="outline" onClick={() => setSide("front")}>
                <ArrowLeft /> Volver a practicar
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <CardBack
                key={itemKey}
                item={item}
                showPinyin
                showTranslations
                lang="es"
                noteTerms={lesson.noteTerms}
              />
            </div>
          </div>
        )}
      </main>

      {/* Paginación abajo, como la tarjeta del profesor. */}
      <nav aria-label="Palabras de la lección" className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        {listOpen && (
          <ul className="mx-auto grid max-h-60 max-w-6xl grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 overflow-y-auto p-3">
            {lesson.items.map((it, i) => {
              const key = it.senseId ?? `${it.word.hanzi}#${it.senseIndex}`;
              const record = progress[key];
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-left hover:bg-muted",
                      i === index && "border-primary bg-primary/10",
                    )}
                  >
                    <span lang="zh-Hans" className="font-hanzi text-lg">{it.word.hanzi}</span>
                    {record && <span className={cn("ml-auto size-2.5 rounded-full", RATINGS[record.rating - 1].tone)} aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Button variant="outline" size="icon" aria-label="Palabra anterior" disabled={index === 0} onClick={() => go(index - 1)}>
            <ArrowLeft />
          </Button>
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm tabular-nums text-muted-foreground hover:bg-muted"
          >
            {index + 1} / {count}
            <ChevronUp className={cn("size-4 transition-transform", listOpen && "rotate-180")} aria-hidden />
          </button>
          <Button variant="outline" size="icon" aria-label="Palabra siguiente" disabled={index === count - 1} onClick={() => go(index + 1)}>
            <ArrowRight />
          </Button>
        </div>
      </nav>
    </div>
  );
}
