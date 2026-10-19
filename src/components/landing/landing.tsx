"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Languages, Lightbulb, Play, RotateCcw, Type, Volume2 } from "lucide-react";
import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { StrokeArt, strokeTimings } from "@/components/hanzi/stroke-art";
import { Highlighted } from "@/components/present/card-back";
import { ThemeToggle } from "@/components/theme-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import { IDEA_MAIL } from "@/lib/contact";
import type { LessonItem, NoteTerm, Sentence } from "@/lib/lesson-types";
import { studentLabels } from "@/lib/student-labels";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";

// Portada pública para profesoras y profesores (2026-10-18, referencia de
// Ever, aligerada). Español primero: los textos se traducen cuando estén
// validados. Usa la palabra 认识 de la Lección de ejemplo con los componentes
// reales; sin demo (base caída) quedan los textos y los botones. Las fuentes
// y licencias están en /creditos (enlace del pie). Pedir acceso está en el
// login: ahí llega quien quiere entrar y aún no tiene cuenta.

// Botón principal de la portada: rojo de la marca en claro y en oscuro.
const cta =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[oklch(0.5_0.15_25)] px-5 py-3 font-medium text-white shadow-sm transition-colors hover:bg-[oklch(0.45_0.15_25)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
const h2 = "font-hanzi text-[clamp(1.875rem,3.4vw,2.75rem)] leading-tight font-semibold";

function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
      {n} / {children}
      <span className="h-px w-16 bg-border" />
    </p>
  );
}

export function Landing({ item, noteTerms }: { item: LessonItem | null; noteTerms?: Record<string, NoteTerm> }) {
  const labels = studentLabels("es");
  const sense = item?.word.senses[item.senseIndex];

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-5 sm:px-6">
        <Link href="/" className="mr-auto flex items-baseline gap-2">
          <span lang="zh-Hans" className="font-hanzi text-2xl font-semibold">认识</span>
          <span className="font-hanzi text-lg text-muted-foreground">Renshi</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <a href="#como-funciona" className="hidden rounded-md px-2 py-1 hover:bg-muted sm:inline">Cómo funciona</a>
          <Link href="/login" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">Ingresar</Link>
          <ThemeToggle />
        </nav>
      </header>

      {/* Inicio: el titular y la palabra dibujándose con tinta. */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:pt-12">
        <div className="flex flex-col gap-6">
          <h1 className="font-hanzi text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.1] font-semibold">
            Enseña vocabulario chino <span className="text-keyword-text">en contexto,</span> sin crear tarjetas ni diapositivas.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Elige palabras del HSK 3.0 o pega las de tu libro. Renshi prepara las frases, el audio y los trazos. Tú
            enseñas.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/present" className={cta}>
              <Play className="size-4 fill-current" /> Ver una clase de ejemplo
            </Link>
            <a href="#como-funciona" className="inline-flex items-center gap-1 font-medium text-keyword-text underline-offset-4 hover:underline">
              Cómo funciona <ArrowRight className="size-4" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">La clase de ejemplo no pide registro.</p>
        </div>
        {item && sense && <TracedWord item={item} />}
      </section>

      {/* 01 · Preparar */}
      <section id="como-funciona" className="scroll-mt-4 border-y border-border bg-card/50">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Eyebrow n="01">Preparar</Eyebrow>
            <h2 className={h2}>
              Elige las palabras.
              <br />
              Renshi hace el resto.
            </h2>
            <p className="max-w-md text-muted-foreground">Del HSK o de tu libro, directo a clase.</p>
          </div>
          <CatalogPreview />
        </div>
      </section>

      {/* 02 · Enseñar */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <Eyebrow n="02">Enseñar</Eyebrow>
          <h2 className={h2}>Una palabra. Mucho más que una traducción.</h2>
          <p className="max-w-2xl text-muted-foreground">Frases, matices y cultura. Todo en contexto.</p>
        </div>
        {item && sense && (
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-2 text-sm font-medium">Frases en contexto</p>
              <ol>
                {sense.sentences.slice(0, 3).map((s, i) => (
                  <SentencePreview key={i} index={i} sentence={s} keyword={item.word.hanzi} />
                ))}
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">Cada clase muestra primero frases que el grupo aún no ha visto.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium"><BookOpen className="size-4" /> Notas y uso</p>
              {sense.nuance && (
                <p className="text-muted-foreground">
                  <Highlighted text={sense.nuance.es} keyword={item.word.hanzi} small noteTerms={noteTerms} lang="es" labels={labels} />
                </p>
              )}
              {item.word.culturalNote && (
                <div className="mt-4 rounded-xl bg-keyword/10 p-4">
                  <p className="mb-1 flex items-center gap-2 text-sm font-medium text-keyword-text"><Lightbulb className="size-4" /> Nota cultural</p>
                  <ClampedText>
                    <Highlighted text={item.word.culturalNote.es} keyword={item.word.hanzi} small noteTerms={noteTerms} lang="es" labels={labels} />
                  </ClampedText>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Toca las palabras subrayadas.</p>
            </div>
          </div>
        )}
      </section>

      {/* 03 · Participar */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-4">
            <Eyebrow n="03">Participar</Eyebrow>
            <h2 className={h2}>
              Pregunta si entendieron.
              <br />
              Ellos responden.
            </h2>
            <p className="max-w-md text-muted-foreground">Tus alumnos votan desde el celular, sin cuenta y de forma anónima.</p>
          </div>
          {item && sense && <PhonePreview item={item} />}
        </div>
      </section>

      {/* Cierre: el lema, las cifras (secundarias) y la clase de ejemplo. */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <p lang="zh-Hans" className="font-hanzi text-[clamp(1.5rem,3vw,2.25rem)]">认识一个词，不如认识一句话。</p>
        <p lang="zh-Latn" className="text-muted-foreground">Rènshi yí ge cí, bùrú rènshi yí jù huà.</p>
        <p className="text-muted-foreground">Conocer una palabra está bien. En una frase, mejor.</p>
        <Link href="/present" className={cn(cta, "mt-6")}>
          <Play className="size-4 fill-current" /> Ver una clase de ejemplo
        </Link>
        <a href={IDEA_MAIL} className="text-sm text-keyword-text underline-offset-4 hover:underline">¿Tienes una idea para Renshi? Escríbenos</a>
        <p className="mt-6 text-xs text-muted-foreground">10 896 palabras HSK 3.0 · ~2700 frases de ejemplo</p>
      </section>
    </div>
  );
}

// Texto largo cortado a dos líneas, con «Ver más» si no cabe (la nota
// cultural): el contenido no se recorta, solo se pliega.
function ClampedText({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setOverflows(el.scrollHeight > el.clientHeight + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <p ref={ref} className={cn(!open && "line-clamp-2")}>{children}</p>
      {(overflows || open) && (
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-1 text-sm text-keyword-text underline-offset-4 hover:underline">
          {open ? "Ver menos" : "Ver más"}
        </button>
      )}
    </>
  );
}

// La palabra en su cuadrícula, dibujándose con tinta china; con su pinyin,
// audio y significado debajo.
function TracedWord({ item }: { item: LessonItem }) {
  const labels = studentLabels("es");
  const sense = item.word.senses[item.senseIndex];
  const [run, setRun] = useState(0);
  // Cada carácter empieza donde acaba el anterior, como en el anverso.
  const starts = item.characters.map((_, i, all) =>
    all.slice(0, i).reduce((t, prev) => t + (prev.strokes ? strokeTimings(prev.strokes, 1).end + 0.2 : 0), 0.4),
  );
  return (
    <div className="flex flex-col items-center gap-4">
      <div lang="zh-Hans" className="flex">
        {item.characters.map((c, i) =>
          c.strokes ? (
            <CalligraphyGrid key={`${i}-${c.char}-${run}`} paper className={cn("bg-card", i > 0 && "-ml-px")}>
              <div className="size-[min(40vw,13rem)] p-[6%]">
                <StrokeArt strokes={c.strokes} roles={c.info?.strokeRoles ?? []} mode="animate" tone="ink" ink startDelay={starts[i]} className="size-full" title={c.char} />
              </div>
            </CalligraphyGrid>
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3">
        <p lang="zh-Latn" className="text-3xl">{sense.pinyin}</p>
        <button type="button" aria-label={labels.listenWord} onClick={() => speakChinese(item.word.hanzi)} className="rounded-md p-1.5 hover:bg-muted">
          <Volume2 className="size-5" />
        </button>
        <span className="text-xl text-muted-foreground">{sense.meaning.es}</span>
      </div>
      <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex items-center gap-2 text-sm text-keyword-text hover:underline">
        <RotateCcw className="size-4" /> Repetir el trazo
      </button>
    </div>
  );
}

// Una frase como en la tarjeta: audio, pinyin y traducción a demanda.
function SentencePreview({ sentence, keyword, index }: { sentence: Sentence; keyword: string; index: number }) {
  const labels = studentLabels("es");
  const [pinyin, setPinyin] = useState(false);
  const [translation, setTranslation] = useState(index === 0);
  const toggle = "rounded-md border border-border p-1.5 hover:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground";
  return (
    <li className="flex items-start gap-3 border-t border-border py-3 first:border-t-0">
      <span className="mt-1.5 text-xs text-muted-foreground">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p lang="zh-Hans" className="font-hanzi text-2xl"><Highlighted text={sentence.zh} keyword={keyword} /></p>
        {pinyin && <p lang="zh-Latn" className="text-muted-foreground">{sentence.pinyin}</p>}
        {translation && <p>{sentence.es}</p>}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button type="button" aria-label={labels.listenSentence} onClick={() => speakChinese(sentence.zh)} className={toggle}>
          <Volume2 className="size-4" />
        </button>
        <button type="button" aria-label={pinyin ? labels.hidePinyin : labels.showPinyin} aria-pressed={pinyin} onClick={() => setPinyin((v) => !v)} className={toggle}>
          <Type className="size-4" />
        </button>
        <button type="button" aria-label={translation ? labels.hideTranslation : labels.showTranslation} aria-pressed={translation} onClick={() => setTranslation((v) => !v)} className={toggle}>
          <Languages className="size-4" />
        </button>
      </div>
    </li>
  );
}

// El catálogo HSK como en la app (datos fijos de HSK 1): se puede marcar y
// desmarcar para entender la idea, sin llamar a la base.
const PREVIEW_ROWS = [
  { hanzi: "爱", pinyin: "ài", meaning: "amar; gustar mucho" },
  { hanzi: "吃", pinyin: "chī", meaning: "comer" },
  { hanzi: "认识", pinyin: "rènshi", meaning: "conocer (a una persona)" },
];

function CatalogPreview() {
  const [checked, setChecked] = useState<Set<number>>(new Set([0, 2]));
  const toggle = (i: number, on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(i);
      else next.delete(i);
      return next;
    });
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="w-8 py-2" />
            <th className="py-2 font-medium">Palabra</th>
            <th className="py-2 font-medium">Pinyin</th>
            <th className="py-2 font-medium">Significado</th>
          </tr>
        </thead>
        <tbody>
          {PREVIEW_ROWS.map((r, i) => (
            <tr key={r.hanzi} className={cn("border-b border-border last:border-b-0", checked.has(i) && "bg-muted/60")}>
              <td className="py-3">
                <Checkbox aria-label={`Marcar ${r.hanzi}`} checked={checked.has(i)} onCheckedChange={(on) => toggle(i, on)} />
              </td>
              <td lang="zh-Hans" className="py-3 font-hanzi text-xl">{r.hanzi}</td>
              <td lang="zh-Latn" className="py-3">{r.pinyin}</td>
              <td className="py-3 text-muted-foreground">{r.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <p className="mr-auto text-xs text-muted-foreground" aria-live="polite">
          {checked.size === 1 ? "1 palabra seleccionada" : `${checked.size} palabras seleccionadas`}
        </p>
        <span className="rounded-lg border border-border px-3 py-1.5 text-sm">Guardar lección</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.5_0.15_25)] px-3 py-1.5 text-sm text-white"><Play className="size-4" /> Presentar ({checked.size})</span>
      </div>
    </div>
  );
}

// El celular de un alumno con la palabra para votar (mismos textos y emojis
// que /v); se puede tocar.
const EMOJI = ["😕", "😣", "🙂", "😎"];

function PhonePreview({ item }: { item: LessonItem }) {
  const labels = studentLabels("es");
  const sense = item.word.senses[item.senseIndex];
  const [vote, setVote] = useState<number | null>(2);
  return (
    <div className="mx-auto w-72 rounded-[2.25rem] border-[10px] border-[oklch(0.18_0.01_240)] bg-background p-5 text-foreground shadow-2xl">
      <div className="flex items-center justify-between text-sm">
        <span lang="zh-Hans" className="font-hanzi text-lg">认识</span>
        <span className="font-mono text-xs tracking-widest text-muted-foreground">BA5BX4</span>
      </div>
      <p lang="zh-Hans" className="mt-4 text-center font-hanzi text-6xl">{item.word.hanzi}</p>
      <p lang="zh-Latn" className="text-center text-lg text-muted-foreground">{sense.pinyin}</p>
      <p className="mt-4 text-center font-medium">¿Qué tal entiendes esta palabra?</p>
      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ejemplo de votación">
        {labels.ratings.map((label, i) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={vote === i}
            onClick={() => setVote(vote === i ? null : i)}
            className={cn(
              "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-border bg-card text-sm transition-colors",
              vote === i && "border-rating-3 bg-rating-3/30 font-semibold",
            )}
          >
            <span className="text-2xl" aria-hidden>{EMOJI[i]}</span>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">{vote !== null ? "Voto registrado." : " "}</p>
    </div>
  );
}
