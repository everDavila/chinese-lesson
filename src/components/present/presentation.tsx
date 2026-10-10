"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
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

export function Presentation({ lesson }: { lesson: Lesson }) {
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [runId, setRunId] = useState(0);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { resolvedTheme, setTheme } = useTheme();

  const item = lesson.items[index];
  const itemKey = `${item.word.hanzi}#${item.senseIndex}`;
  const count = lesson.items.length;

  const ratings = useSyncExternalStore(
    ratingsStore.subscribe,
    ratingsStore.getSnapshot,
    ratingsStore.getServerSnapshot,
  );
  const setRating = useCallback(
    (rating: Rating | undefined) => ratingsStore.set(itemKey, rating),
    [itemKey],
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

  // Los controles se ocultan solos para no distraer al compartir pantalla.
  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);
  useEffect(() => {
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    window.addEventListener("mousemove", pokeControls);
    return () => {
      clearTimeout(hideTimer.current);
      window.removeEventListener("mousemove", pokeControls);
    };
  }, [pokeControls]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <main className="relative flex min-h-0 flex-1 items-center justify-center px-[3vw] py-[3vh]">
        <div className="absolute top-4 left-6 text-lg text-muted-foreground tabular-nums">
          {index + 1} / {count}
        </div>
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
                componentMeanings={lesson.componentMeanings}
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

      <nav
        aria-label="Controles de la presentación"
        className={cn(
          "flex flex-wrap items-center justify-center gap-2 border-t border-border bg-card/80 px-4 py-2 backdrop-blur transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0 focus-within:opacity-100",
        )}
      >
        <Button variant="ghost" size="icon-lg" aria-label="Anterior (←)" onClick={() => goTo(index - 1)} disabled={index === 0}>
          <ChevronLeft />
        </Button>
        <select
          aria-label="Ir a la palabra"
          value={index}
          onChange={(e) => goTo(Number(e.target.value))}
          className="h-9 rounded-lg border border-border bg-background px-2 font-hanzi"
        >
          {lesson.items.map((it, i) => (
            <option key={i} value={i}>
              {i + 1}. {it.word.hanzi} · {it.word.senses[it.senseIndex].pinyin}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="icon-lg" aria-label="Siguiente (→)" onClick={() => goTo(index + 1)} disabled={index === count - 1}>
          <ChevronRight />
        </Button>

        <div className="mx-2 h-6 w-px bg-border" />

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

        {side === "front" && (
          <>
            <Button variant="ghost" size="lg" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pausar (P)" : "Reproducir (P)"}>
              {playing ? <Pause /> : <Play />}
              {playing ? "Pausar" : "Reproducir"}
            </Button>
            <Button variant="ghost" size="lg" onClick={replay} aria-label="Repetir (R)">
              <RotateCcw /> Repetir
            </Button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Velocidad
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                onChange={(e) => {
                  setSpeed(Number(e.target.value));
                  setRunId((r) => r + 1);
                }}
                className="w-24 accent-foreground"
              />
            </label>
          </>
        )}

        <div className="mx-2 h-6 w-px bg-border" />

        <Button variant={showPinyin ? "secondary" : "ghost"} size="lg" onClick={() => setShowPinyin((v) => !v)} aria-pressed={showPinyin} aria-label="Pinyin (Y)">
          <Type /> Pinyin
        </Button>
        {side === "back" && (
          <Button variant={showTranslations ? "secondary" : "ghost"} size="lg" onClick={() => setShowTranslations((v) => !v)} aria-pressed={showTranslations} aria-label="Traducciones (T)">
            <Languages /> Traducciones
          </Button>
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
        <Link href="/" aria-label="Salir" className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted">
          <X className="size-4" />
        </Link>
      </nav>
    </div>
  );
}
