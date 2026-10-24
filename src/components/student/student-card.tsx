"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Popover } from "@base-ui/react/popover";
import { ArrowLeft, ArrowRight, ChevronUp, HelpCircle, RotateCcw, Settings, Volume2 } from "lucide-react";
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

  const count = lesson.items.length;
  const item = lesson.items[index];
  const itemKey = item.senseId ?? `${item.word.hanzi}#${item.senseIndex}`;
  const chars = item.characters.map((c) => c.char);
  const guide = prefs.mode === "random" ? coin(`${itemKey}:${run}`) : prefs.mode === "guide";
  const cellsKey = `${itemKey}:${run}:${guide}`;

  const current = state?.key === cellsKey ? state.progress : null;
  const finished = current !== null && current.completed === current.total;
  const suggested = current ? suggestRating(current.mistakes, current.total, current.revealed) : 3;

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
  const rate = (rating: Rating) => {
    progressStore.save(itemKey, {
      rating,
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

  const segment =
    "flex cursor-pointer items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring hover:bg-muted has-checked:hover:bg-primary";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {side === "front" ? (
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
          <div>
            <Button variant="ghost" onClick={() => setView("list")}>
              <ArrowLeft /> Lista
            </Button>
          </div>
          <fieldset className="flex gap-1 rounded-full border border-border bg-card p-1">
            <legend className="sr-only">Modo de práctica</legend>
            {MODES.map((m) => (
              <label key={m.value} className={segment}>
                <input
                  type="radio"
                  name="modo"
                  className="sr-only"
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="icon" aria-label="Escuchar la palabra" onClick={() => speakChinese(item.word.hanzi)}>
              <Volume2 />
            </Button>
            <Popover.Root>
              <Popover.Trigger
                aria-label="Ajustes"
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
              >
                <Settings className="size-4" />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner sideOffset={6} align="end" className="z-50">
                  <Popover.Popup className="w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none">
                    <fieldset className="flex flex-col gap-1">
                      <legend className="mb-1 text-sm font-medium">Al terminar una palabra</legend>
                      {AFTER.map((a) => (
                        <label key={a.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
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
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </header>
      ) : (
        <header className="px-4 py-3 sm:px-6">
          <Button variant="outline" onClick={() => setSide("front")}>
            <ArrowLeft /> Volver a practicar
          </Button>
        </header>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4 sm:px-6">
        {side === "front" ? (
          <section className="flex flex-1 flex-col items-center justify-center gap-4">
            <h1 className="sr-only">Practica la palabra {index + 1} de {count}</h1>
            <StrokeCells
              key={cellsKey}
              ref={cells}
              chars={chars}
              guide={guide}
              onProgress={(p) => setState({ key: cellsKey, progress: p })}
            />

            {/* Puntos de progreso: uno por carácter. */}
            <div className="flex gap-2" role="img" aria-label={`${current?.completed ?? 0} de ${chars.length} caracteres`}>
              {chars.map((c, i) => (
                <span key={`${i}-${c}`} className={cn("size-2.5 rounded-full", i < (current?.completed ?? 0) ? "bg-primary" : "bg-border")} />
              ))}
            </div>

            {/* Franja de acciones de alto fijo: al terminar cambia el contenido, no la posición. */}
            <div className="flex min-h-28 flex-col items-center justify-start gap-3" aria-live="polite">
              {!finished ? (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button variant="secondary" onClick={restart}>
                      <RotateCcw /> Reiniciar
                    </Button>
                    <Button variant="outline" onClick={() => cells.current?.reveal()}>
                      <HelpCircle /> No me sale
                    </Button>
                  </div>
                  <Button variant="link" onClick={() => setSide("back")}>Ver detalle</Button>
                </>
              ) : prefs.after === "detail" ? (
                <>
                  <p className="font-medium">{feedback(current)}</p>
                  <div className="grid grid-cols-4 gap-2" role="group" aria-label="¿Cómo te fue? Toca para guardar y ver el detalle">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => rate(r.value)}
                        aria-label={`${r.label}${suggested === r.value ? " (sugerida)" : ""}`}
                        className={cn(
                          "flex min-w-24 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                          suggested === r.value ? "border-primary" : "border-border",
                        )}
                      >
                        <span className={cn("size-3 rounded-full", r.tone)} aria-hidden />
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={restart}>Reiniciar</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSide("back")}>Ver detalle sin valorar</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium">{feedback(current)}</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button variant="secondary" onClick={restart}>
                      <RotateCcw /> Reiniciar
                    </Button>
                    {index < count - 1 && <Button onClick={() => go(index + 1)}>Siguiente palabra</Button>}
                    <Button variant="link" onClick={() => setSide("back")}>Ver detalle</Button>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : (
          <div className="min-h-0 flex-1">
            <CardBack key={itemKey} item={item} showPinyin showTranslations lang="es" noteTerms={lesson.noteTerms} />
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
