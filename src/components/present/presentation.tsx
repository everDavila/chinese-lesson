"use client";

import { startTransition, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brush,
  CopyCheck,
  Expand,
  Languages,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/lib/lesson-types";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { CardBack } from "./card-back";
import { CardFront } from "./card-front";
import { GroupRating, type Rating } from "./group-rating";
import { StudentVoting, VotingBar } from "./student-voting";
import { advanceStore } from "./advance-store";
import { inkStyleStore } from "./ink-style-store";
import { ratingsStore } from "./ratings-store";
import { endSessionAction, rateSenseAction } from "@/actions/class";
import { closeVotingAction, openVotingAction, votingLiveAction } from "@/actions/vote";
import { Link } from "@/i18n/navigation";
import { studentLabels, type ContentLanguage } from "@/lib/student-labels";
import { useTranslations } from "next-intl";

type LiveSession = { id: string; joinCode: string; ratings: Record<string, Rating> };

/**
 * Sin `session`: lección de demo, valoraciones en el navegador.
 * Con `session`: clase en vivo, valoraciones guardadas en Supabase.
 */
export function Presentation({
  lesson,
  session,
  contentLanguage = "es",
  exitHref = "/",
}: {
  lesson: Lesson;
  session?: LiveSession;
  /** Idioma de los alumnos para la tarjeta; los controles van en el de la interfaz. */
  contentLanguage?: ContentLanguage;
  /** Adónde lleva la X fuera de una clase en vivo (la vista previa del admin vuelve al editor). */
  exitHref?: string;
}) {
  const t = useTranslations("Controls");
  const labels = studentLabels(contentLanguage);
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [runId, setRunId] = useState(0);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const ink = useSyncExternalStore(inkStyleStore.subscribe, inkStyleStore.getSnapshot, inkStyleStore.getServerSnapshot);
  // Al pasar de palabra: en clase en vivo vuelve al anverso; en la demo o un
  // enlace compartido (repaso), mantiene la cara. La docente lo cambia (tecla A).
  const advanceContext = session ? "class" : "review";
  const advance = useSyncExternalStore(advanceStore.subscribe, advanceStore.snapshot(advanceContext), advanceStore.serverSnapshot(advanceContext));

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
          setSaveError(t("saveError"));
        }
      });
    },
    [session, item.senseId, itemKey, t],
  );

  // Votación de los alumnos: se activa una vez y sigue a la tarjeta. Al
  // recargar, sigue activa si la sesión tenía una ronda abierta.
  const [voting, setVoting] = useState(false);
  // Si la docente ya pulsó V, la respuesta (lenta) de "¿estaba activa?" llega
  // tarde y no debe deshacer lo que ella eligió.
  const votingTouched = useRef(false);
  const sessionId = session?.id;
  const senseId = item.senseId;
  useEffect(() => {
    if (!sessionId) return;
    votingLiveAction(sessionId).then((live) => !votingTouched.current && setVoting(live), () => {});
  }, [sessionId]);
  useEffect(() => {
    if (!sessionId || !voting || !senseId) return;
    openVotingAction(sessionId, senseId)
      .then(() => setSaveError(null), () => setSaveError(t("votingError")));
  }, [sessionId, voting, senseId, t]);
  const toggleVoting = useCallback(() => {
    if (!sessionId) return;
    votingTouched.current = true;
    if (!voting) return setVoting(true);
    setVoting(false);
    closeVotingAction(sessionId).catch(() => setSaveError(t("votingError")));
  }, [sessionId, voting, t]);

  const goTo = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(count - 1, i)));
      // «Mantener cara»: repasando en el reverso, la siguiente palabra se abre
      // por el reverso; el trazo se dibuja al girar al anverso.
      if (advance === "front") setSide("front");
      setPlaying(true);
      setRunId((r) => r + 1);
    },
    [count, advance],
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
        case "a":
        case "A":
          advanceStore.toggle(advanceContext);
          break;
        case "i":
        case "I":
          inkStyleStore.toggle();
          break;
        case "v":
        case "V":
          toggleVoting();
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
  }, [goTo, index, side, ratings, itemKey, setRating, toggleVoting]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {session && (
        <VotingBar joinCode={session.joinCode} live={voting} onToggle={toggleVoting} labels={labels} />
      )}
      <main className="relative flex min-h-0 flex-1 items-center justify-center px-[3vw] pt-[3vh] pb-2">
        {/* Una tarjeta con dos caras. En el anverso, clic en cualquier zona la
            gira (no hay nada más que tocar). En el reverso hay mucho que
            explorar, así que un clic suelto no la gira: se vuelve con el botón
            de la esquina o con Espacio. Las dos caras siguen montadas para no
            perder la animación ni lo revelado. */}
        <div className="h-full w-full max-w-[min(1400px,160vh)] perspective-[2400px]">
          <div
            role={side === "front" ? "button" : undefined}
            tabIndex={side === "front" ? -1 : undefined}
            aria-label={side === "front" ? t("flip") : undefined}
            onClick={(e) => {
              if (side !== "front") return;
              const target = e.target as HTMLElement;
              if (target.closest("button, a, select, input, label, summary, [data-no-flip]")) return;
              flip();
            }}
            className={cn(
              "relative h-full w-full transition-transform duration-500 ease-out transform-3d motion-reduce:transition-none",
              side === "front" ? "cursor-pointer" : "rotate-y-180",
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
                ink={ink}
              />
              <p className="pb-3 text-center text-sm text-muted-foreground">{t("flipHint")}</p>
            </section>
            <section
              aria-hidden={side !== "back"}
              className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card p-[clamp(1rem,2.5vw,2.5rem)] pt-16 shadow-xl backface-hidden rotate-y-180 md:pt-[clamp(1rem,2.5vw,2.5rem)]"
            >
              <Button
                variant="outline"
                onClick={flip}
                aria-label={t("flipBack")}
                className="absolute top-3 right-3 z-10 shadow-sm"
              >
                <Undo2 /> {t("front")}
              </Button>
              <CardBack
                key={itemKey}
                item={item}
                showPinyin={showPinyin}
                showTranslations={showTranslations}
                lang={contentLanguage}
                noteTerms={lesson.noteTerms}
                footer={
                  <>
                    <GroupRating value={ratings[itemKey]} onChange={setRating} labels={labels} />
                    {session && item.senseId && (
                      <StudentVoting
                        sessionId={session.id}
                        senseId={item.senseId}
                        live={voting}
                        teacherRating={ratings[itemKey]}
                        labels={labels}
                      />
                    )}
                  </>
                }
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
        aria-label={t("label")}
        className="grid grid-cols-2 items-center gap-x-4 gap-y-2 px-[3vw] pt-1 pb-4 md:grid-cols-[1fr_auto_1fr]"
      >
        {/* En móvil: flechas arriba a lo ancho; caras y pinyin a la izquierda y
            el resto a la derecha en la fila de abajo. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5" role="tablist" aria-label={t("faces")}>
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={side === s}
                onClick={() => setSide(s)}
                className={cn("rounded-md px-3 py-1 text-sm", side === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                {s === "front" ? t("front") : t("back")}
              </button>
            ))}
          </div>
          <Button variant={showPinyin ? "secondary" : "ghost"} onClick={() => setShowPinyin((v) => !v)} aria-pressed={showPinyin} aria-label={`${t("pinyin")} (Y)`}>
            <Type /> {t("pinyin")}
          </Button>
          {side === "front" && (
            <Button variant={ink ? "secondary" : "ghost"} onClick={inkStyleStore.toggle} aria-pressed={ink} aria-label={`${t("ink")} (I)`}>
              <Brush /> {t("ink")}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => advanceStore.toggle(advanceContext)}
            aria-label={`${advance === "keep" ? t("advanceKeep") : t("advanceFront")} (A)`}
            title={t("advanceHint")}
          >
            {advance === "keep" ? <CopyCheck /> : <RotateCcw />} {advance === "keep" ? t("advanceKeep") : t("advanceFront")}
          </Button>
          {side === "back" && (
            <Button variant={showTranslations ? "secondary" : "ghost"} onClick={() => setShowTranslations((v) => !v)} aria-pressed={showTranslations} aria-label={`${t("translations")} (T)`}>
              <Languages /> {t("translations")}
            </Button>
          )}
        </div>

        <div className="order-first col-span-2 flex items-center justify-center gap-3 md:order-none md:col-span-1">
          <Button
            variant="secondary"
            aria-label={t("previous")}
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="h-12 w-20 rounded-full [&_svg:not([class*='size-'])]:size-6"
          >
            <ArrowLeft />
          </Button>
          {/* El contador también sirve para saltar a cualquier palabra. */}
          <select
            aria-label={t("goTo")}
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
            aria-label={t("next")}
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
              <Button variant="ghost" size="icon-lg" onClick={() => setPlaying((p) => !p)} aria-label={playing ? t("pause") : t("play")}>
                {playing ? <Pause /> : <Play />}
              </Button>
              <Button variant="ghost" size="icon-lg" onClick={replay} aria-label={t("replay")}>
                <RotateCcw />
              </Button>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                aria-label={t("speed")}
                onChange={(e) => {
                  setSpeed(Number(e.target.value));
                  setRunId((r) => r + 1);
                }}
                className="mx-1 w-20 accent-foreground"
              />
            </>
          )}
          <ThemeToggle size="icon-lg" />
          <Button variant="ghost" size="icon-lg" aria-label={t("fullscreen")} onClick={toggleFullscreen}>
            <Expand />
          </Button>
          {session ? (
            <form action={endSessionAction.bind(null, session.id)}>
              <Button type="submit" variant="ghost" aria-label={t("endClass")}>
                <X /> {t("endClass")}
              </Button>
            </form>
          ) : (
            <Link href={exitHref} aria-label={t("exit")} className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted">
              <X className="size-4" />
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
