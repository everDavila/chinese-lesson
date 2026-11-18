"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { markStudied } from "@/actions/student";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Lesson } from "@/lib/lesson-types";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";
import { FichaEstudio, muteStore } from "./ficha-estudio";
import { usePracticeClock } from "./use-practice-clock";

// Ejercicio «Estudiar»: conocer palabras nuevas. Una ficha por palabra (la
// palabra, su pinyin, el significado y una frase; el resto plegado), sin giro
// ni valoración: solo se pasa. No guarda eventos; al pasar de una palabra la
// marca como vista (lista para repasar) y suma el tiempo a la sesión. Texto en
// español mientras sea piloto, como las otras tarjetas.

export function StudySheet({ lesson, signedIn = false, bookmarked = [] }: { lesson: Lesson; signedIn?: boolean; bookmarked?: string[] }) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const muted = useSyncExternalStore(muteStore.subscribe, muteStore.snapshot, muteStore.serverSnapshot);
  const sessionId = useRef<string | null>(null);
  // Las marcas se guardan en orden y «Terminar» espera a la última, para no perderla al navegar.
  const marks = useRef<Promise<unknown>>(Promise.resolve());
  const { touch, activeMs } = usePracticeClock(() => {});

  const count = lesson.items.length;
  const item = lesson.items[index];

  // Al entrar en la palabra suena sola (solo la palabra). La pausa evita que suene a medias si pasas rápido.
  useEffect(() => {
    if (muted || finished) return;
    const timer = setTimeout(() => speakChinese(item.word.hanzi), 300);
    return () => clearTimeout(timer);
  }, [index, muted, finished, item.word.hanzi]);

  const toggleMute = () => {
    if (!muted && typeof window !== "undefined") window.speechSynthesis?.cancel();
    muteStore.set(!muted);
  };

  // La palabra que se deja atrás queda como vista.
  const leave = () => {
    touch();
    if (!signedIn || !item.senseId) return;
    sessionId.current ??= crypto.randomUUID();
    const input = { sessionId: sessionId.current, senseId: item.senseId, activeMs: activeMs() };
    marks.current = marks.current.then(() => markStudied(input)).catch(() => false);
  };
  const next = async () => {
    leave();
    if (index < count - 1) {
      setIndex(index + 1);
      return;
    }
    setSaving(true);
    await marks.current;
    setFinished(true);
  };
  const back = () => index > 0 && setIndex(index - 1);

  if (finished) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">¡Listo!</h1>
        <p className="text-muted-foreground">
          Conociste {count} {count === 1 ? "palabra nueva" : "palabras nuevas"}. Ya están en tu repaso: cuanto antes las recuerdes, mejor se fijan.
        </p>
        <p lang="zh-Hans" className="font-hanzi text-3xl tracking-wider">{lesson.items.slice(0, 8).map((i) => i.word.hanzi).join(" ")}{count > 8 ? " …" : ""}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/estudiante?repaso=1&ejercicio=tarjeta" className={cn(buttonVariants())}>Repasarlas ahora</Link>
          <Link href="/estudiante" className={cn(buttonVariants({ variant: "outline" }))}>Elegir otra práctica</Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>Volver al inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/estudiante" className={cn(buttonVariants({ variant: "ghost" }))}>Salir</Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-center text-sm text-muted-foreground">{lesson.title}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Avance de la práctica" aria-valuemin={0} aria-valuemax={count} aria-valuenow={index + 1}>
            <div className="h-full bg-primary transition-[width]" style={{ width: `${((index + 1) / count) * 100}%` }} />
          </div>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">{index + 1} / {count}</span>
        {signedIn && item.senseId && <BookmarkButton key={item.senseId} senseId={item.senseId} initial={bookmarked.includes(item.senseId)} />}
        <Button variant="outline" size="icon" aria-label="Escuchar la palabra" onClick={() => speakChinese(item.word.hanzi)}>
          <Volume2 />
        </Button>
        <Button
          variant={muted ? "outline" : "secondary"}
          aria-pressed={!muted}
          aria-label={muted ? "Activar el audio automático" : "Silenciar el audio automático"}
          title={muted ? "Audio automático: apagado" : "Audio automático: encendido"}
          onClick={toggleMute}
        >
          {muted && <VolumeX />} Auto
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 pb-4 sm:px-6">
        <h1 className="sr-only">Conoce la palabra {index + 1} de {count}</h1>
        <FichaEstudio key={item.senseId ?? index} item={item} />
      </main>
      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <Button variant="outline" size="icon-lg" aria-label="Palabra anterior" disabled={index === 0} onClick={back}>
            <ArrowLeft />
          </Button>
          <Button size="lg" className="flex-1" onClick={next} disabled={saving}>
            {index === count - 1 ? (saving ? "Guardando…" : "Terminar") : <>Siguiente palabra <ArrowRight /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
