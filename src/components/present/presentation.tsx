"use client";

import { startTransition, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Expand,
  Languages,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Type,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/lib/lesson-types";
import { cn } from "@/lib/utils";
import { CardBack } from "./card-back";
import { CardFront } from "./card-front";
import { GroupRating, type Rating } from "./group-rating";
import { ratingsStore } from "./ratings-store";
import { endSessionAction, rateSenseAction } from "@/app/(present)/actions";

type LiveSession = { id: string; joinCode: string; ratings: Record<string, Rating> };

/**
 * Sin `session`: lección de demo, valoraciones en el navegador.
 * Con `session`: clase en vivo, valoraciones guardadas en Supabase.
 */
export function Presentation({ lesson, session }: { lesson: Lesson; session?: LiveSession }) {
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [runId, setRunId] = useState(0);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const item = lesson.items[index];
  const itemKey = item.senseId ?? `${item.word.hanzi}#${item.senseIndex}`;
  const count = lesson.items.length;

  const localRatings = useSyncExternalStore(
    ratingsStore.subscribe,
    ratingsStore.getSnapshot,
    ratingsStore.getServerSnapshot,
  );
  const [sessionRatings, setSessionRatings] = useState<Record<string, Rating>>(session?.ratings ?? {});
  const [saveError, setSaveError] = useState<string | null>(null);
  const ratings = session ? sessionRatings : localRatings;

  const setRating = useCallback(
    (rating: Rating | undefined) => {
      if (!session || !item.senseId) {
        ratingsStore.set(itemKey, rating);
        return;
      }
      // Optimista: se marca al instante y se guarda en segundo plano.
      const senseId = item.senseId;
      setSessionRatings((prev) => {
        const next = { ...prev };
        if (rating) next[senseId] = rating;
        else delete next[senseId];
        return next;
      });
      setSaveError(null);
      startTransition(async () => {
        try {
          await rateSenseAction(session.id, senseId, rating ?? null);
        } catch {
          setSaveError("No se pudo guardar la valoración. Revisa la conexión.");
        }
      });
    },
    [session, item.senseId, itemKey],
  );

  const goTo = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(count - 1, i)));
      setSide("front");
      setPlaying(true);
      setRunId((r) => r + 1);
    },
    [count],
  );

  const flip = () => setSide((s) => (s === "front" ? "back" : "front"));

  const replay = () => {
    setPlaying(true);
    setRunId((r) => r + 1);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  // Atajos de teclado (DIAGNOSTICO-MODO-CLASE.md §F.10).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
          goTo(index + 1);
          break;
        case "ArrowLeft":
          goTo(index - 1);
          break;
        case " ":
          e.preventDefault();
          flip();
          break;
        case "p":
        case "P":
          setPlaying((p) => !p);
          break;
        case "r":
        case "R":
          replay();
          break;
        case "y":
        case "Y":
          setShowPinyin((v) => !v);
          break;
        case "t":
        case "T":
          setShowTranslations((v) => !v);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
          if (side === "back") {
            const r = Number(e.key) as Rating;
            setRating(ratings[itemKey] === r ? undefined : r);
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, side, ratings, itemKey, setRating]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <main className="relative flex min-h-0 flex-1 items-center justify-center px-[3vw] pt-[3vh] pb-2">
        {/* Una tarjeta con dos caras: clic en cualquier zona libre la gira.
            Las dos caras siguen montadas para no perder la animación ni lo revelado. */}
        <div className="h-full w-full max-w-[min(1400px,160vh)] perspective-[2400px]">
          <div
            role="button"
            tabIndex={-1}
            aria-label={side === "front" ? "Girar la tarjeta (Espacio)" : "Volver al anverso (Espacio)"}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("button, a, select, input, label, summary, [data-no-flip]")) return;
              flip();
            }}
            className={cn(
              "relative h-full w-full cursor-pointer transition-transform duration-500 ease-out transform-3d motion-reduce:transition-none",
              side === "back" && "rotate-y-180",
            )}
          >
            <section
              aria-hidden={side !== "front"}
              className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl backface-hidden"
            >
              <CardFront
                item={item}
                playing={playing && side === "front"}
                speed={speed}
                runId={runId}
                showPinyin={showPinyin}
              />
              <p className="pb-3 text-center text-sm text-muted-foreground">Clic o Espacio para girar</p>
            </section>
            <section
              aria-hidden={side !== "back"}
              className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card p-[clamp(1rem,2.5vw,2.5rem)] shadow-xl backface-hidden rotate-y-180"
            >
              <CardBack
                key={itemKey}
                item={item}
                showPinyin={showPinyin}
                showTranslations={showTranslations}
                componentMeanings={lesson.componentMeanings}
                footer={<GroupRating value={ratings[itemKey]} onChange={setRating} />}
              />
            </section>
          </div>
        </div>
      </main>

      {saveError && (
        <p role="alert" className="px-[3vw] text-center text-sm text-destructive">
          {saveError}
        </p>
      )}
      {/* Controles al estilo Quizlet: ← n / total → al centro, siempre visibles. */}
      <nav
        aria-label="Controles de la presentación"
        className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-[3vw] pt-1 pb-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Cara de la tarjeta (Espacio)">
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={side === s}
                onClick={() => setSide(s)}
                className={cn("rounded-md px-3 py-1 text-sm", side === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                {s === "front" ? "Anverso" : "Reverso"}
              </button>
            ))}
          </div>
          <Button variant={showPinyin ? "secondary" : "ghost"} onClick={() => setShowPinyin((v) => !v)} aria-pressed={showPinyin} aria-label="Pinyin (Y)">
            <Type /> Pinyin
          </Button>
          {side === "back" && (
            <Button variant={showTranslations ? "secondary" : "ghost"} onClick={() => setShowTranslations((v) => !v)} aria-pressed={showTranslations} aria-label="Traducciones (T)">
              <Languages /> Traducciones
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            aria-label="Palabra anterior (←)"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="h-12 w-20 rounded-full [&_svg:not([class*='size-'])]:size-6"
          >
            <ArrowLeft />
          </Button>
          {/* El contador también sirve para saltar a cualquier palabra. */}
          <select
            aria-label="Ir a la palabra"
            value={index}
            onChange={(e) => goTo(Number(e.target.value))}
            className="h-12 cursor-pointer appearance-none rounded-full bg-transparent px-3 text-center text-lg tabular-nums hover:bg-muted"
          >
            {lesson.items.map((it, i) => (
              <option key={i} value={i}>
                {i + 1} / {count} · {it.word.hanzi}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            aria-label="Palabra siguiente (→)"
            onClick={() => goTo(index + 1)}
            disabled={index === count - 1}
            className="h-12 w-20 rounded-full [&_svg:not([class*='size-'])]:size-6"
          >
            <ArrowRight />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          {side === "front" && (
            <>
              <Button variant="ghost" size="icon-lg" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pausar trazos (P)" : "Reproducir trazos (P)"}>
                {playing ? <Pause /> : <Play />}
              </Button>
              <Button variant="ghost" size="icon-lg" onClick={replay} aria-label="Repetir trazos (R)">
                <RotateCcw />
              </Button>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                aria-label="Velocidad de los trazos"
                onChange={(e) => {
                  setSpeed(Number(e.target.value));
                  setRunId((r) => r + 1);
                }}
                className="mx-1 w-20 accent-foreground"
              />
            </>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Cambiar tema"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {/* Los dos iconos y CSS decide: el tema no se conoce en el servidor. */}
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
          <Button variant="ghost" size="icon-lg" aria-label="Pantalla completa (F)" onClick={toggleFullscreen}>
            <Expand />
          </Button>
          {session ? (
            <form action={endSessionAction.bind(null, session.id)}>
              <Button type="submit" variant="ghost" aria-label="Terminar la clase">
                <X /> Terminar clase
              </Button>
            </form>
          ) : (
            <Link href="/" aria-label="Salir" className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted">
              <X className="size-4" />
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
