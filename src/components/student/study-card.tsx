"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Eye, EyeOff, RotateCcw, Volume2 } from "lucide-react";
import { markKnown, recordPracticeEvent } from "@/actions/student";
import { CardBack } from "@/components/present/card-back";
import { CardFront } from "@/components/present/card-front";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Lesson } from "@/lib/lesson-types";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";
import { prefsStore, type Rating } from "./student-store";
import { clock, usePracticeClock } from "./use-practice-clock";

// Tarjeta de estudio del alumno: la palabra se dibuja trazo a trazo, la
// reconoce y, al mostrar la respuesta, ve sus lecturas con frases y se valora.
// Es la habilidad «recognize»; escribir con el dedo es otro ejercicio
// (StudentCard). Texto en español mientras sea piloto, como la otra tarjeta.

const RATINGS: { value: Rating; label: string; tone: string }[] = [
  { value: 1, label: "Otra vez", tone: "bg-rating-1" },
  { value: 2, label: "Difícil", tone: "bg-rating-2" },
  { value: 3, label: "Bien", tone: "bg-rating-3" },
  { value: 4, label: "Fácil", tone: "bg-rating-4" },
];

export function StudyCard({ lesson, signedIn = false, bookmarked = [] }: { lesson: Lesson; signedIn?: boolean; bookmarked?: string[] }) {
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.snapshot, prefsStore.serverSnapshot);
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [runId, setRunId] = useState(0);
  const [counts, setCounts] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [finished, setFinished] = useState(false);

  const sessionId = useRef<string | null>(null);
  const shownAt = useRef(clock());
  const revealMs = useRef<number | null>(null);
  const usedHelp = useRef(false);
  const { touch, activeMs } = usePracticeClock(() => {});

  const count = lesson.items.length;
  const item = lesson.items[index];

  // Cada palabra empieza con el reloj a cero y sin ayuda.
  const begin = (next: number) => {
    setIndex(next);
    setSide("front");
    setRunId(0);
    shownAt.current = clock();
    revealMs.current = null;
    usedHelp.current = prefs.studyPinyin;
  };

  const reveal = () => {
    revealMs.current ??= clock() - shownAt.current;
    setSide("back");
  };
  const replay = () => {
    usedHelp.current = true;
    setRunId((r) => r + 1);
  };
  const next = () => (index < count - 1 ? begin(index + 1) : setFinished(true));

  const rate = (rating: Rating) => {
    touch();
    setCounts((c) => c.map((n, i) => (i === rating - 1 ? n + 1 : n)) as [number, number, number, number]);
    if (signedIn && item.senseId) {
      sessionId.current ??= crypto.randomUUID();
      void recordPracticeEvent({
        skill: "recognize",
        sessionId: sessionId.current,
        senseId: item.senseId,
        outcome: rating >= 3 ? "correct" : "wrong",
        rating,
        mistakes: 0,
        strokesTotal: null,
        failedStrokes: [],
        usedHelp: usedHelp.current,
        msToFirstAction: revealMs.current,
        msTotal: clock() - shownAt.current,
        activeMs: activeMs(),
      });
    }
    next();
  };

  const mark = (kind: "known" | "dismissed") => {
    if (!signedIn || !item.senseId) return;
    sessionId.current ??= crypto.randomUUID();
    void markKnown(item.senseId, kind, sessionId.current, "recognize");
    next();
  };

  // Teclado: Espacio o Intro muestra la respuesta; 1–4 valora.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    onKey.current = (e) => {
      if (finished || e.metaKey || e.ctrlKey || e.altKey) return;
      if (side === "front" && (e.key === " " || e.key === "Enter") && e.target === document.body) {
        e.preventDefault();
        reveal();
      } else if (side === "back" && ["1", "2", "3", "4"].includes(e.key)) {
        rate(Number(e.key) as Rating);
      }
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (finished) {
    const total = counts.reduce((a, b) => a + b, 0);
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">¡Listo!</h1>
        <p className="text-muted-foreground">Estudiaste {total} {total === 1 ? "palabra" : "palabras"}. Lo que te costó volverá pronto; lo que te salió fácil, más adelante.</p>
        <ul className="flex flex-wrap justify-center gap-3" aria-label="Cómo te fue">
          {RATINGS.map((r) => (
            <li key={r.value} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
              <span className={cn("size-3 rounded-full", r.tone)} aria-hidden /> {r.label}: <strong className="tabular-nums">{counts[r.value - 1]}</strong>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/estudiante" className={cn(buttonVariants())}>Elegir otra práctica</Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>Volver al inicio</Link>
        </div>
      </main>
    );
  }

  // Barra fija abajo: la valoración siempre a mano, también en el celular.
  const ratingBar = (
    <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <p className="text-center text-sm text-muted-foreground">¿Qué tal la recordabas?</p>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="¿Qué tal la recordabas? Toca para guardar y pasar a la siguiente">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => rate(r.value)}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-border px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:gap-2 sm:px-3"
            >
              <span className={cn("size-3 rounded-full", r.tone)} aria-hidden />
              {r.label}
              <kbd className="hidden text-xs text-muted-foreground sm:inline" aria-hidden>{r.value}</kbd>
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setSide("front")}>Volver a verla</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/estudiante" className={cn(buttonVariants({ variant: "ghost" }))}>Salir</Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-center text-sm text-muted-foreground">{lesson.title}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={count} aria-valuenow={index} aria-label="Avance de la práctica">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${(index / count) * 100}%` }} />
          </div>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">{index + 1} / {count}</span>
        <div className="flex gap-2">
          {signedIn && item.senseId && <BookmarkButton key={item.senseId} senseId={item.senseId} initial={bookmarked.includes(item.senseId)} />}
          <Button variant="outline" size="icon" aria-label="Escuchar la palabra" onClick={() => speakChinese(item.word.hanzi)}>
            <Volume2 />
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-6 sm:px-6">
        {side === "front" ? (
          <section className="flex flex-1 flex-col items-center justify-center gap-5" aria-label={`Palabra ${index + 1} de ${count}`}>
            <h1 className="sr-only">¿Recuerdas esta palabra?</h1>
            <CardFront key={item.senseId ?? index} item={item} playing speed={1} runId={runId} showPinyin={prefs.studyPinyin} ink={false} />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="secondary" onClick={replay}>
                <RotateCcw /> Ver el trazo otra vez
              </Button>
              <Button
                variant="outline"
                aria-pressed={prefs.studyPinyin}
                onClick={() => {
                  usedHelp.current = true;
                  prefsStore.set({ ...prefs, studyPinyin: !prefs.studyPinyin });
                }}
              >
                {prefs.studyPinyin ? <EyeOff /> : <Eye />} {prefs.studyPinyin ? "Ocultar pinyin" : "Mostrar pinyin"}
              </Button>
              <Button size="lg" onClick={reveal}>Mostrar respuesta</Button>
            </div>
            {signedIn && item.senseId && (
              <div className="flex flex-wrap items-center justify-center gap-1">
                <Button variant="link" onClick={() => mark("known")}>Ya la sé</Button>
                <Button variant="link" className="text-muted-foreground" onClick={() => mark("dismissed")}>No me la preguntes más</Button>
              </div>
            )}
            <p className="hidden text-xs text-muted-foreground sm:block" aria-hidden>Espacio: mostrar respuesta</p>
          </section>
        ) : (
          <>
            <div className="min-h-0 flex-1">
              <CardBack key={item.senseId ?? index} item={item} showPinyin showTranslations={false} lang="es" noteTerms={lesson.noteTerms} />
            </div>
            {ratingBar}
          </>
        )}
      </main>
    </div>
  );
}
