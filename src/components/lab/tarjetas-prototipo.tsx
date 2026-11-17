"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, HelpCircle, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { CardBack, Highlighted, Piece, buildFormula } from "@/components/present/card-back";
import { CardFront } from "@/components/present/card-front";
import { Button } from "@/components/ui/button";
import { StrokeCells, type CellsProgress, type StrokeCellsHandle } from "@/components/student/stroke-cells";
import { RatingDot } from "@/components/student/rating-dot";
import { suggestRating, type Rating } from "@/components/student/student-store";
import { ToneText } from "@/components/student/tone-text";
import type { Lesson } from "@/lib/lesson-types";
import { categoryLabel, studentLabels } from "@/lib/student-labels";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";

// Prototipo (no guarda nada) de las tarjetas del alumno:
// · Estudiar: ficha propia en una columna (palabra, pinyin, significado, una frase,
//   el resto plegado); solo pasar, sin valorar.
// · Repasar: frente, giras, y la valoración solo en el reverso; pasar siempre a mano.
// · Escribir: casillas bloqueadas con aviso y un OK grande que pasa solo.

const RATINGS: { value: Rating; label: string; tone: string }[] = [
  { value: 1, label: "Aún no la sé", tone: "bg-rating-1" },
  { value: 2, label: "Difícil", tone: "bg-rating-2" },
  { value: 3, label: "Bien", tone: "bg-rating-3" },
  { value: 4, label: "Lo sé", tone: "bg-rating-4" },
];

export function TarjetasPrototipo({ lesson }: { lesson: Lesson }) {
  const [tab, setTab] = useState<"estudiar" | "repasar" | "escribir">("estudiar");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex justify-center px-4 pt-3">
        <div role="tablist" aria-label="Qué probar" className="flex gap-1 rounded-full border border-border bg-card p-1">
          {(["estudiar", "repasar", "escribir"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("rounded-full px-5 py-1.5 text-sm font-medium capitalize", tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === "estudiar" ? <Estudiar lesson={lesson} /> : tab === "repasar" ? <Repasar lesson={lesson} /> : <Escribir lesson={lesson} />}
    </div>
  );
}

// Ficha de estudio: una columna, orden fijo. Lo esencial a la vista, el resto plegado.
function FichaEstudio({ item }: { item: Lesson["items"][number] }) {
  const [more, setMore] = useState(false);
  const labels = studentLabels("es");
  const { word, senseIndex } = item;
  const sense = word.senses[senseIndex];
  const otherSenses = word.senses.filter((_, i) => i !== senseIndex);
  const formulas = item.characters.flatMap((c) => buildFormula(c.char, c.info));
  const sentences = [...sense.sentences].sort((a, b) => Number(Boolean(b.master)) - Number(Boolean(a.master)));
  const [first, ...rest] = sentences;
  const cat = sense.category ? categoryLabel(sense.category, labels) : null;

  const sentence = (sn: (typeof sentences)[number]) => (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p lang="zh-Hans" className="font-hanzi text-2xl leading-snug sm:text-3xl"><Highlighted text={sn.zh} keyword={word.hanzi} /></p>
        <p lang="zh-Latn" className="mt-1 text-muted-foreground">{sn.pinyin}</p>
        <p className="mt-1">{sn.es || sn.en}</p>
      </div>
      <Button variant="outline" size="icon" aria-label="Escuchar la frase" onClick={() => speakChinese(sn.zh)}><Volume2 /></Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pt-2">
      <section className="flex flex-col items-center gap-2 text-center">
        <p lang="zh-Hans" className="font-hanzi text-8xl leading-none sm:text-9xl">{word.hanzi}</p>
        <div className="flex items-center gap-2">
          <ToneText pinyin={sense.pinyin} colored className="text-3xl font-medium" />
          <Button variant="ghost" size="icon-lg" aria-label="Escuchar la palabra" onClick={() => speakChinese(word.hanzi)}><Volume2 /></Button>
        </div>
        <p className="text-2xl font-medium">{sense.meaning.es}</p>
        <p className="text-sm text-muted-foreground">
          {word.hsk ? `HSK ${word.hsk === 7 ? "7–9" : word.hsk}` : labels.noHsk}
          {cat && ` · ${cat}`}
        </p>
      </section>

      {first && (
        <section aria-label="Frase en contexto" className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">En una frase</h2>
          {sentence(first)}
          {rest.length > 0 && (
            <>
              <Button variant="link" className="mt-2 px-0" aria-expanded={more} onClick={() => setMore(!more)}>
                {more ? "Ver menos frases" : `Ver más frases (${rest.length})`}
              </Button>
              {more && <ul className="mt-2 flex flex-col gap-4 border-t border-border pt-4">{rest.map((sn, i) => <li key={i}>{sentence(sn)}</li>)}</ul>}
            </>
          )}
        </section>
      )}

      {formulas.length > 0 && (
        <details className="rounded-xl border border-border px-4 py-3">
          <summary className="cursor-pointer font-medium">{labels.howItsBuilt}</summary>
          <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
            {formulas.map((f, i) => (
              <p key={`${i}-${f.char}`} className="flex items-start gap-x-2 font-hanzi text-3xl leading-none">
                <Piece char={f.char} pinyin={f.pinyin} />
                <span className="pt-[0.15em] text-[0.6em] text-muted-foreground">=</span>
                {f.parts.map((p, j) => (
                  <span key={j} className="flex items-start gap-x-2">
                    {j > 0 && <span className="pt-[0.15em] text-[0.6em] text-muted-foreground">+</span>}
                    <Piece char={p.char} pinyin={p.pinyin} className={cn(p.role === "semantic" && "text-radical", p.role === "phonetic" && "text-phonetic")} />
                  </span>
                ))}
              </p>
            ))}
          </div>
        </details>
      )}
      {sense.nuance && (
        <details className="rounded-xl border border-border px-4 py-3">
          <summary className="cursor-pointer font-medium">{labels.nuance}</summary>
          <p className="mt-3 text-sm leading-relaxed"><Highlighted text={sense.nuance.es} keyword={word.hanzi} small /></p>
        </details>
      )}
      {otherSenses.length > 0 && (
        <details className="rounded-xl border border-border px-4 py-3">
          <summary className="cursor-pointer font-medium">{labels.otherUses}</summary>
          <ul className="mt-3 space-y-2 text-sm">{otherSenses.map((o, i) => <li key={i}>{o.meaning.es}</li>)}</ul>
        </details>
      )}
      {word.culturalNote && (
        <details className="rounded-xl border border-border px-4 py-3">
          <summary className="cursor-pointer font-medium">{labels.culturalNote}</summary>
          <p className="mt-3 text-sm leading-relaxed"><Highlighted text={word.culturalNote.es} keyword={word.hanzi} small /></p>
        </details>
      )}
    </div>
  );
}

// Conocer la palabra: todo visible, sin giro ni valoración. Solo avanzar.
const MUTE_KEY = "renshi:alumno:estudio-silencio";
const muteListeners = new Set<() => void>();
// En el servidor cuenta como silenciado: no suena nada antes de leer la preferencia.
const muteStore = {
  subscribe(cb: () => void) {
    muteListeners.add(cb);
    return () => void muteListeners.delete(cb);
  },
  snapshot() {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  },
  serverSnapshot: () => true,
  set(value: boolean) {
    try {
      localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    } catch {}
    muteListeners.forEach((l) => l());
  },
};

function Estudiar({ lesson }: { lesson: Lesson }) {
  const [index, setIndex] = useState(0);
  const muted = useSyncExternalStore(muteStore.subscribe, muteStore.snapshot, muteStore.serverSnapshot);
  const count = lesson.items.length;
  const item = lesson.items[index];

  // Al entrar en la palabra suena sola (solo la palabra, no la frase). La
  // pausa evita que suene a medias si pasas rápido.
  useEffect(() => {
    if (muted) return;
    const t = setTimeout(() => speakChinese(item.word.hanzi), 300);
    return () => clearTimeout(t);
  }, [index, muted, item.word.hanzi]);

  const toggleMute = () => {
    if (!muted && typeof window !== "undefined") window.speechSynthesis?.cancel();
    muteStore.set(!muted);
  };
  const go = (n: number) => setIndex(Math.min(Math.max(n, 0), count - 1));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={count} aria-valuenow={index + 1}>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${((index + 1) / count) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">{index + 1} / {count}</span>
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
        <FichaEstudio key={index} item={item} />
      </main>
      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <Button variant="outline" size="icon-lg" aria-label="Palabra anterior" disabled={index === 0} onClick={() => go(index - 1)}>
            <ArrowLeft />
          </Button>
          <Button size="lg" className="flex-1" disabled={index === count - 1} onClick={() => go(index + 1)}>
            {index === count - 1 ? "Última palabra" : <>Siguiente palabra <ArrowRight /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Repasar({ lesson }: { lesson: Lesson }) {
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [rated, setRated] = useState<Record<number, Rating>>({});
  // Pinyin oculto por defecto; es una ayuda que se pide palabra por palabra.
  const [showPy, setShowPy] = useState(false);
  const count = lesson.items.length;
  const item = lesson.items[index];

  const go = (n: number) => {
    setIndex(Math.min(Math.max(n, 0), count - 1));
    setSide("front");
    setShowPy(false);
  };
  const rate = (r: Rating) => {
    setRated((m) => ({ ...m, [index]: r }));
    go(index + 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={count} aria-valuenow={index}>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${((index + 1) / count) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">{index + 1} / {count}</span>
        <Button variant="outline" size="icon" aria-label="Escuchar la palabra" onClick={() => speakChinese(item.word.hanzi)}>
          <Volume2 />
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4 sm:px-6">
        {side === "front" ? (
          // Tocar la tarjeta también gira.
          <section
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-4"
            onClick={() => setSide("back")}
            aria-label={`Palabra ${index + 1} de ${count}. Toca para ver la respuesta`}
          >
            <CardFront key={index} item={item} playing speed={1} runId={0} showPinyin={showPy} ink={false} />
            <Button
              variant="outline"
              aria-pressed={showPy}
              onClick={(e) => {
                e.stopPropagation();
                setShowPy(!showPy);
              }}
            >
              {showPy ? <EyeOff /> : <Eye />} {showPy ? "Ocultar pinyin" : "Mostrar pinyin"}
            </Button>
            <p className="text-sm text-muted-foreground">Toca la tarjeta para ver la respuesta</p>
          </section>
        ) : (
          <div className="min-h-0 flex-1">
            <CardBack key={index} item={item} showPinyin showTranslations={false} lang="es" noteTerms={lesson.noteTerms} />
          </div>
        )}
      </main>

      {/* Barra fija: la valoración solo con la respuesta a la vista; pasar, siempre. */}
      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:px-6">
          {side === "back" && (
            <div>
              <p className="mb-2 text-center text-sm text-muted-foreground">¿Qué tal la recordabas?</p>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Valoración: guarda y pasa a la siguiente">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => rate(r.value)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-border px-1 py-2.5 text-sm font-medium transition-colors hover:bg-muted sm:flex-row sm:gap-2"
                  >
                    <RatingDot value={r.value} tone={r.tone} />
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="mt-1 flex justify-center">
                <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => go(index + 1)}>No me la preguntes más</Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-lg" aria-label="Palabra anterior" disabled={index === 0} onClick={() => go(index - 1)}>
              <ArrowLeft />
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setSide(side === "front" ? "back" : "front")}>
              {side === "front" ? <><Eye /> Mostrar respuesta</> : <><RotateCcw /> Ver el frente</>}
            </Button>
            <Button size="lg" className="flex-1" disabled={index === count - 1} onClick={() => go(index + 1)}>
              Siguiente palabra <ArrowRight />
            </Button>
          </div>
          {rated[index] && <p className="text-center text-xs text-muted-foreground">Ya la valoraste: {RATINGS[rated[index] - 1].label}</p>}
        </div>
      </div>
    </div>
  );
}

const AUTO_MS = 1800;

function Escribir({ lesson }: { lesson: Lesson }) {
  const [index, setIndex] = useState(0);
  const [run, setRun] = useState(0);
  const [state, setState] = useState<{ key: string; progress: CellsProgress } | null>(null);
  const [detail, setDetail] = useState(false);
  const cells = useRef<StrokeCellsHandle>(null);
  const count = lesson.items.length;
  const item = lesson.items[index];
  const chars = item.characters.map((c) => c.char);
  const key = `${index}:${run}`;
  const current = state?.key === key ? state.progress : null;
  const finished = current !== null && current.completed === current.total;
  const rating = current ? suggestRating(current.mistakes, current.total, current.revealed) : 3;
  const last = index === count - 1;
  const sense = item.word.senses[item.senseIndex];

  const next = () => {
    setDetail(false);
    setRun(0);
    setIndex((i) => Math.min(i + 1, count - 1));
  };
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });

  // OK a la vista un momento y pasa solo; no pasa si abres el detalle.
  useEffect(() => {
    if (!finished || last || detail) return;
    const t = setTimeout(() => nextRef.current(), AUTO_MS);
    return () => clearTimeout(t);
  }, [finished, last, detail, key]);

  const errors = current ? `${current.mistakes} ${current.mistakes === 1 ? "error" : "errores"}` : "";
  const headline = !current ? "" : current.revealed ? "Aquí la tienes" : current.mistakes === 0 ? "¡Perfecto!" : rating >= 3 ? "¡Bien!" : "Sigue practicando";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${((index + (finished ? 1 : 0)) / count) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">{index + 1} / {count}</span>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4 sm:px-6">
        {detail ? (
          <>
            <div className="py-2">
              <Button variant="outline" onClick={() => setDetail(false)}><ArrowLeft /> Volver</Button>
            </div>
            <div className="min-h-0 flex-1">
              <CardBack key={key} item={item} showPinyin showTranslations lang="es" noteTerms={lesson.noteTerms} />
            </div>
          </>
        ) : (
          <section className="relative flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-xl font-medium">{sense.meaning.es}</p>
            <StrokeCells key={key} ref={cells} chars={chars} guide lockHint onProgress={(p) => setState({ key, progress: p })} />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setRun((r) => r + 1)}><RotateCcw /> Reiniciar</Button>
              <Button variant="outline" onClick={() => cells.current?.reveal()}><HelpCircle /> No me sale</Button>
            </div>

            {/* OK grande sobre toda la tarjeta: resultado y errores, y pasa solo. */}
            {finished && current && (
              <div
                role="status"
                className={cn(
                  "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center text-black",
                  RATINGS[rating - 1].tone,
                )}
              >
                <p className="text-6xl font-bold sm:text-7xl">{headline}</p>
                <p className="text-3xl font-semibold">{current.revealed ? "Obsérvala y vuelve a intentarlo" : errors}</p>
                <p className="text-lg">{RATINGS[rating - 1].label}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <Button variant="secondary" size="lg" onClick={() => setRun((r) => r + 1)}><RotateCcw /> Reiniciar</Button>
                  <Button variant="secondary" size="lg" onClick={() => setDetail(true)}>Ver detalle</Button>
                  {last ? (
                    <Button size="lg" onClick={() => setIndex(0)}>Empezar de nuevo</Button>
                  ) : (
                    <Button size="lg" onClick={next}>Siguiente <ArrowRight /></Button>
                  )}
                </div>
                {!last && !detail && <p className="text-sm" aria-hidden>Pasa sola en un momento…</p>}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
