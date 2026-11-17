"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildRound, RULES, score, type QuizMode, type QuizQuestion, type QuizWord } from "@/lib/quiz";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";

// Piloto: quiz mixto. Una misma ronda alterna «elegir entre 4» y «verdadero o
// falso», como Kahoot. Individual y sin base: los puntos se calculan aquí, así
// que no sirve todavía para competir (en el modo en vivo los calcularía el
// servidor). Todo en español, también «Verdadero / Falso».

const ROUND = 10;

// Colores y formas de Kahoot: el alumno los reconoce sin leer.
const SHAPES = [
  { glyph: "▲", cls: "bg-red-600 text-white", dim: "bg-red-600/25 text-red-900/60 dark:text-red-100/50" },
  { glyph: "◆", cls: "bg-blue-600 text-white", dim: "bg-blue-600/25 text-blue-900/60 dark:text-blue-100/50" },
  { glyph: "●", cls: "bg-amber-500 text-black", dim: "bg-amber-500/25 text-amber-900/60 dark:text-amber-100/50" },
  { glyph: "■", cls: "bg-green-600 text-white", dim: "bg-green-600/25 text-green-900/60 dark:text-green-100/50" },
] as const;
// Verdadero es azul ◆ y Falso es rojo ▲, como en Kahoot.
const TF_SHAPES = [SHAPES[1], SHAPES[0]] as const;
const TF_LABELS = ["Verdadero", "Falso"] as const;

type Result = { q: QuizQuestion; ok: boolean; points: number };
type Picked = number | "timeout";

function correctIndex(q: QuizQuestion): number {
  return q.kind === "choose" ? q.correct : q.truth ? 0 : 1;
}

export function QuizLab({ words }: { words: QuizWord[] }) {
  const [round, setRound] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [left, setLeft] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [mode, setMode] = useState<QuizMode>("reconocer");
  const [levels, setLevels] = useState<number[]>([1]);
  const [autoplay, setAutoplay] = useState(true);
  const deadline = useRef(0);

  const pool = useMemo(() => words.filter((w) => levels.includes(w.level ?? 1)), [words, levels]);
  const q = round?.[index] ?? null;
  const total = results.reduce((sum, r) => sum + r.points, 0);
  const done = round !== null && index >= round.length;
  const revealed = picked !== null;

  const start = (from?: QuizWord[]) => {
    setRound(buildRound(pool, ROUND, Math.random, from ?? pool, mode));
    setIndex(0);
    setPicked(null);
    setResults([]);
  };

  const answer = useCallback(
    (choice: Picked) => {
      if (!q || picked !== null) return;
      const secondsLeft = Math.max(0, (deadline.current - Date.now()) / 1000);
      const ok = choice !== "timeout" && choice === correctIndex(q);
      setPicked(choice);
      setResults((prev) => [...prev, { q, ok, points: ok ? score(q.kind, secondsLeft) : 0 }]);
    },
    [q, picked],
  );

  const next = useCallback(() => {
    if (picked === null) return;
    setIndex((i) => i + 1);
    setPicked(null);
  }, [picked]);

  // Cada pregunta nueva fija su límite; el servidor del futuro guardaría esto.
  useEffect(() => {
    if (!q || picked !== null) return;
    const seconds = RULES[q.kind].seconds;
    deadline.current = Date.now() + seconds * 1000;
    const tick = () => {
      const remaining = (deadline.current - Date.now()) / 1000;
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) answer("timeout");
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
    // `answer` cambia con `picked`; el efecto solo debe reiniciarse por pregunta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, picked === null]);

  // Teclado: 1–4 responden, Enter pasa a la siguiente.
  useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") return next();
      const n = Number(e.key);
      if (n >= 1 && n <= (q.kind === "choose" ? 4 : 2)) answer(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, answer, next]);

  // Audio: en «escuchar» la pregunta suena al aparecer; en todos, la palabra
  // suena al revelar. Siempre hay un botón para repetirlo.
  useEffect(() => {
    if (!q || !autoplay || revealed) return;
    if (q.kind === "choose" && q.direction === "listen") speakChinese(q.word.hanzi);
  }, [q, autoplay, revealed]);
  useEffect(() => {
    if (!q || !autoplay || !revealed) return;
    speakChinese(q.word.hanzi);
  }, [q, autoplay, revealed]);

  if (!round) {
    return (
      <Intro
        count={pool.length}
        mode={mode}
        onMode={setMode}
        levels={levels}
        onLevels={setLevels}
        autoplay={autoplay}
        onAutoplay={setAutoplay}
        onStart={() => start()}
      />
    );
  }
  if (done) return <Summary results={results} total={total} onAgain={() => start()} onRetry={(w) => start(w)} />;
  if (!q) return null;

  const seconds = RULES[q.kind].seconds;
  const fraction = revealed ? 0 : left / seconds;
  // Verde → ámbar → rojo al acabarse; el número lo dice también sin color.
  const barColor = fraction > 0.5 ? "bg-green-500" : fraction > 0.25 ? "bg-amber-400" : "bg-red-500";
  // Opciones cortas (hanzi, pinyin) van de a dos aun en celular; los significados, de a una.
  const twoCols = q.kind === "truefalse" || (q.kind === "choose" && q.direction !== "hanzi-es");
  const last = results[results.length - 1];
  const options =
    q.kind === "choose" ? q.options.map((label, i) => ({ label, ...SHAPES[i] })) : TF_LABELS.map((label, i) => ({ label, ...TF_SHAPES[i] }));
  const right = correctIndex(q);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="tabular-nums">
          Pregunta {index + 1} de {round.length}
        </span>
        <span className="font-medium tabular-nums text-foreground">{total} puntos</span>
      </header>

      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Tiempo restante"
          aria-valuemin={0}
          aria-valuemax={seconds}
          aria-valuenow={Math.ceil(revealed ? 0 : left)}
          className="h-3 flex-1 overflow-hidden rounded-full bg-foreground/20 ring-1 ring-foreground/30"
        >
          <div
            className={cn("h-full transition-[width] duration-100 ease-linear", barColor)}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
        <span className="w-10 text-right text-sm font-medium tabular-nums text-foreground" aria-hidden>
          {Math.ceil(revealed ? 0 : left)} s
        </span>
      </div>

      <section className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
        <Prompt q={q} />
      </section>

      <div className={cn("grid gap-3", twoCols ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
        {options.map((o, i) => {
          const isRight = revealed && i === right;
          const faded = revealed && !isRight && i !== picked;
          return (
            <button
              key={`${o.label}-${i}`}
              type="button"
              disabled={revealed}
              onClick={() => answer(i)}
              className={cn(
                "relative flex min-h-16 items-center justify-center rounded-lg py-3 text-lg font-semibold break-words shadow-[0_3px_0_rgb(0_0_0/0.25)] transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                twoCols ? "px-4 pt-6" : "px-10",
                q.kind === "choose" && (q.direction === "es-hanzi" || q.direction === "listen") && "font-hanzi text-3xl",
                faded ? o.dim : o.cls,
                isRight && "ring-4 ring-foreground",
                revealed && i === picked && !isRight && "line-through",
              )}
            >
              <span aria-hidden className="absolute top-2 left-3 text-sm">
                {o.glyph}
              </span>
              <span className="sr-only">{i + 1}. </span>
              {o.label}
              {isRight && <span className="sr-only"> (correcta)</span>}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="min-h-24">
        {revealed && last && (
          <div
            className={cn(
              "flex flex-col gap-1 rounded-lg border px-4 py-3",
              last.ok ? "border-rating-3 bg-rating-3/25" : "border-rating-1 bg-rating-1/25",
            )}
          >
            <p className="font-medium">
              {last.ok ? `Correcto · +${last.points}` : picked === "timeout" ? "Se acabó el tiempo" : "Incorrecto"}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 text-sm">
              <span lang="zh-Hans" className="font-hanzi text-lg">{q.word.hanzi}</span> <span>{q.word.pinyin}</span> ={" "}
              <strong>{q.word.es}</strong>
              <SpeakButton text={q.word.hanzi} label="Escuchar la palabra" />
            </p>
            {q.word.example && (
              <div className="mt-1 flex items-start gap-2 border-t border-foreground/15 pt-2">
                <div className="flex-1">
                  <p lang="zh-Hans" className="font-hanzi text-xl">{q.word.example.zh}</p>
                  <p className="text-sm text-muted-foreground">{q.word.example.pinyin}</p>
                  <p className="text-sm">{q.word.example.es}</p>
                </div>
                <SpeakButton text={q.word.example.zh} label="Escuchar la frase" />
              </div>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <Button size="lg" onClick={next} className="sticky bottom-4 h-11 w-full shadow-lg">
          {index + 1 === round.length ? "Ver resultado" : "Siguiente"}
        </Button>
      )}
    </main>
  );
}

function Prompt({ q }: { q: QuizQuestion }) {
  if (q.kind === "truefalse") {
    return (
      <>
        <p className="text-sm text-muted-foreground">Verdadero o falso</p>
        <p className="text-xl">
          <span className="font-hanzi text-4xl">{q.word.hanzi}</span> significa «{q.claim}».
        </p>
      </>
    );
  }
  if (q.direction === "hanzi-es") {
    return (
      <>
        <p className="text-sm text-muted-foreground">¿Qué significa?</p>
        <p className="font-hanzi text-5xl">{q.word.hanzi}</p>
      </>
    );
  }
  if (q.direction === "tone") {
    return (
      <>
        <p className="text-sm text-muted-foreground">¿Con qué tonos se dice?</p>
        <p lang="zh-Hans" className="font-hanzi text-5xl">{q.word.hanzi}</p>
        <p className="text-sm text-muted-foreground">{q.word.es}</p>
        <SpeakButton text={q.word.hanzi} label="Escuchar la palabra" />
      </>
    );
  }
  if (q.direction === "listen") {
    return (
      <>
        <p className="text-sm text-muted-foreground">¿Qué palabra oyes?</p>
        <SpeakButton text={q.word.hanzi} label="Escuchar otra vez" big />
      </>
    );
  }
  return (
    <>
      <p className="text-sm text-muted-foreground">¿Cómo se escribe?</p>
      <p className="text-3xl font-medium">{q.word.es}</p>
    </>
  );
}

function SpeakButton({ text, label, big = false }: { text: string; label: string; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => speakChinese(text)}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-foreground/30 bg-background text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        big ? "size-20" : "size-11 shrink-0",
      )}
    >
      <Volume2 className={big ? "size-9" : "size-5"} aria-hidden />
    </button>
  );
}

const MODES: { id: QuizMode; title: string; hint: string }[] = [
  { id: "reconocer", title: "Reconocer", hint: "Elegir entre cuatro y verdadero o falso: leer la palabra y su significado." },
  { id: "tonos", title: "Tonos", hint: "Ves el hanzi y eliges el pinyin con los tonos correctos." },
  { id: "escuchar", title: "Escuchar", hint: "Oyes la palabra y eliges el hanzi entre cuatro que se parecen." },
];

function Intro({
  count,
  mode,
  onMode,
  levels,
  onLevels,
  autoplay,
  onAutoplay,
  onStart,
}: {
  count: number;
  mode: QuizMode;
  onMode: (m: QuizMode) => void;
  levels: number[];
  onLevels: (l: number[]) => void;
  autoplay: boolean;
  onAutoplay: (v: boolean) => void;
  onStart: () => void;
}) {
  const toggle = (n: number) => {
    const next = levels.includes(n) ? levels.filter((l) => l !== n) : [...levels, n].sort();
    if (next.length > 0) onLevels(next);
  };
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Quiz · piloto</h1>
      <p className="text-muted-foreground">
        {ROUND} preguntas con tiempo y puntos: cuanto más rápido aciertas, más puntos. Al revelar la respuesta ves la
        palabra con su audio y una frase corta de su nivel.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Qué practicar</legend>
        {MODES.map((m) => (
          <label
            key={m.id}
            className={cn(
              "flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2",
              mode === m.id ? "border-primary bg-primary/10" : "border-border",
            )}
          >
            <input type="radio" name="modo" className="mt-1.5" checked={mode === m.id} onChange={() => onMode(m.id)} />
            <span>
              <span className="block font-medium">{m.title}</span>
              <span className="block text-sm text-muted-foreground">{m.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <legend className="mb-1 text-sm font-medium">Niveles</legend>
        {[1, 2, 3].map((n) => (
          <label key={n} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={levels.includes(n)} onChange={() => toggle(n)} />
            HSK {n}
          </label>
        ))}
      </fieldset>

      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" checked={autoplay} onChange={(e) => onAutoplay(e.target.checked)} />
        Reproducir el audio solo
      </label>

      <Button size="lg" className="h-11" onClick={onStart}>
        Empezar ({count} palabras en juego)
      </Button>
      <p className="text-xs text-muted-foreground">
        Si no oyes nada, tu teléfono quizá no tiene una voz en chino instalada. En «Reconocer»: elegir vale hasta{" "}
        {RULES.choose.maxPoints} puntos en {RULES.choose.seconds} s; verdadero o falso, hasta {RULES.truefalse.maxPoints} en{" "}
        {RULES.truefalse.seconds} s. Teclado: 1–4 responden y Enter sigue. Significados: borrador de Gushi (CC BY-SA 4.0),
        frases de Tatoeba (CC BY 2.0 FR) y generadas por IA, todo sin revisión humana. Los puntos no se guardan.
      </p>
    </main>
  );
}

function Summary({
  results,
  total,
  onAgain,
  onRetry,
}: {
  results: Result[];
  total: number;
  onAgain: () => void;
  onRetry: (words: QuizWord[]) => void;
}) {
  const hits = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).map((r) => r.q.word);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Resultado</h1>
      <p className="text-4xl font-semibold tabular-nums">{total} puntos</p>
      <p className="text-muted-foreground">
        {hits} de {results.length} aciertos.
      </p>
      {failed.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">Para repasar</h2>
          <ul className="flex flex-col gap-1">
            {failed.map((w) => (
              <li key={w.hanzi} className="flex items-baseline gap-2">
                <span className="font-hanzi text-2xl">{w.hanzi}</span>
                <span className="text-sm text-muted-foreground">{w.pinyin}</span>
                <span className="text-sm">{w.es}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex flex-col gap-2">
        {failed.length > 0 && (
          <Button size="lg" className="h-11" onClick={() => onRetry(failed)}>
            Repetir solo los fallos
          </Button>
        )}
        <Button size="lg" variant="outline" className="h-11" onClick={onAgain}>
          Otra ronda
        </Button>
      </div>
    </main>
  );
}
