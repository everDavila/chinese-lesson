"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import { StudentVoting, VotingBar } from "./student-voting";
import { advanceStore } from "./advance-store";
import { inkStyleStore } from "./ink-style-store";
import { SENTENCE_MODES, sentenceModeStore } from "./sentence-mode-store";
import { endSessionAction } from "@/actions/class";
import { closeVotingAction, openVotingAction, votingLiveAction } from "@/actions/vote";
import { Link } from "@/i18n/navigation";
import { studentLabels, type ContentLanguage } from "@/lib/student-labels";
import { useTranslations } from "next-intl";

type LiveSession = { id: string; joinCode: string };

/**
 * Sin `session`: lección de demo, sin votación.
 * Con `session`: clase en vivo; la comprensión del grupo sale de los votos.
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsRef = useRef<HTMLElement>(null);
  const ink = useSyncExternalStore(inkStyleStore.subscribe, inkStyleStore.getSnapshot, inkStyleStore.getServerSnapshot);
  // En qué idioma empiezan las frases del reverso (tecla L).
  const sentenceMode = useSyncExternalStore(sentenceModeStore.subscribe, sentenceModeStore.getSnapshot, sentenceModeStore.getServerSnapshot);
  // Al pasar de palabra: en clase en vivo vuelve al anverso; en la demo o un
  // enlace compartido (repaso), mantiene la cara. La docente lo cambia (tecla A).
  const advanceContext = session ? "class" : "review";
  const advance = useSyncExternalStore(advanceStore.subscribe, advanceStore.snapshot(advanceContext), advanceStore.serverSnapshot(advanceContext));

  const item = lesson.items[index];
  const itemKey = item.senseId ?? `${item.word.hanzi}#${item.senseIndex}`;
  const count = lesson.items.length;

  const [saveError, setSaveError] = useState<string | null>(null);

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

  // En una computadora compartiendo pantalla, la barra desaparece cuando la
  // docente deja de usar el ratón. Teclado, foco y tacto siempre la conservan.
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let timer: number | undefined;
    const reveal = () => {
      setControlsVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!controlsRef.current?.contains(document.activeElement)) setControlsVisible(false);
      }, 3000);
    };
    reveal();
    window.addEventListener("pointermove", reveal, { passive: true });
    window.addEventListener("pointerdown", reveal, { passive: true });
    window.addEventListener("keydown", reveal);
    window.addEventListener("focusin", reveal);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", reveal);
      window.removeEventListener("pointerdown", reveal);
      window.removeEventListener("keydown", reveal);
      window.removeEventListener("focusin", reveal);
    };
  }, []);

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
        case "l":
        case "L":
          sentenceModeStore.next();
          break;
        case "i":
        case "I":
          inkStyleStore.toggle();
          break;
        case "v":
        case "V":
          toggleVoting();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, side, toggleVoting, advanceContext]);

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
                sentenceMode={sentenceMode}
                lang={contentLanguage}
                noteTerms={lesson.noteTerms}
                footer={
                  // Comprensión del grupo: solo los votos de los alumnos. La
                  // docente ya no valora a mano (decisión de Ever, 2026-10-20).
                  <StudentVoting
                    session={session && item.senseId ? { id: session.id, senseId: item.senseId } : undefined}
                    live={voting}
                    labels={labels}
                  />
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
        ref={controlsRef}
        aria-label={t("label")}
        className={cn(
          "grid grid-cols-2 items-center gap-x-4 gap-y-2 px-[3vw] pt-1 pb-4 transition-[opacity,transform] duration-200 motion-reduce:transition-none md:grid-cols-[1fr_auto_1fr]",
          !controlsVisible && "md:pointer-events-none md:translate-y-2 md:opacity-0",
        )}
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
            <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label={`${t("sentencesIn")} (L)`} title={t("sentencesHint")}>
              {SENTENCE_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={sentenceMode === m}
                  onClick={() => sentenceModeStore.set(m)}
                  className={cn("rounded-md px-2.5 py-1 text-sm", sentenceMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  {m === "zh" ? <span lang="zh-Hans">中文</span> : m.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          {side === "back" && (
            <Button variant={showTranslations ? "secondary" : "ghost"} onClick={() => setShowTranslations((v) => !v)} aria-pressed={showTranslations} aria-label={`${sentenceMode === "zh" ? t("translations") : t("chinese")} (T)`}>
              {sentenceMode === "zh" ? <Languages /> : <span lang="zh-Hans" className="font-hanzi">中</span>} {sentenceMode === "zh" ? t("translations") : t("chinese")}
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
