"use client";

import { useState } from "react";
import { ArrowRight, Bookmark, BookOpen, Lightbulb, Mail, MessageSquare, Play, RefreshCw, RotateCcw, Search, Volume2 } from "lucide-react";
import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { StrokeArt, strokeTimings } from "@/components/hanzi/stroke-art";
import { Highlighted, Piece, buildFormula } from "@/components/present/card-back";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import type { LessonItem, NoteTerm } from "@/lib/lesson-types";
import { categoryLabel, studentLabels } from "@/lib/student-labels";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";

// Portada pública para profesoras y profesores (2026-10-18, referencia de
// Ever). Español primero: los textos se traducen cuando estén validados.
// Muestra la palabra 认识 de la Lección de ejemplo con los componentes reales
// de la tarjeta; sin demo (base caída) quedan los textos y los botones.

const CONTACT = "renshi@davila.uno";
const mailto = (subject: string, body: string) =>
  `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const ACCESS_MAIL = mailto(
  "Quiero acceso a Renshi",
  "Hola:\n\nEnseño chino y me gustaría probar Renshi.\n\n¿A quién enseño? (niveles, clases por videollamada o presenciales):\n\n¿Qué uso hoy para preparar el vocabulario?\n\nGracias.",
);
const IDEA_MAIL = mailto("Una idea para Renshi", "Hola:\n\nEnseño o aprendo chino y me gustaría que Renshi…\n");

// Botón principal de la portada: rojo de la marca en claro y en oscuro.
const cta =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[oklch(0.5_0.15_25)] px-5 py-3 font-medium text-white shadow-sm transition-colors hover:bg-[oklch(0.45_0.15_25)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
const ghostCta =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted";

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
  const formulas = item ? item.characters.flatMap((c) => buildFormula(c.char, c.info)) : [];
  const [run, setRun] = useState(0);
  // Cada carácter empieza donde acaba el anterior, como en el anverso.
  const starts = (item?.characters ?? []).map((_, i, all) =>
    all.slice(0, i).reduce((t, prev) => t + (prev.strokes ? strokeTimings(prev.strokes, 1).end + 0.2 : 0), 0.3),
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Cabecera */}
      <header className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-5 sm:px-6">
        <Link href="/" className="mr-auto flex items-baseline gap-2">
          <span lang="zh-Hans" className="font-hanzi text-2xl font-semibold">认识</span>
          <span className="font-hanzi text-lg text-muted-foreground">Renshi</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <a href="#como-funciona" className="hidden rounded-md px-2 py-1 hover:bg-muted sm:inline">Cómo funciona</a>
          <Link href="/present" className="hidden rounded-md px-2 py-1 hover:bg-muted sm:inline">Demo</Link>
          <a href={ACCESS_MAIL} className="rounded-md px-2 py-1 hover:bg-muted">Pedir acceso</a>
          <Link href="/login" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">Ingresar</Link>
        </nav>
      </header>

      {/* 01 · Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pt-12">
        <div className="flex flex-col gap-6">
          <h1 className="font-hanzi text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.1] font-semibold">
            Enseña vocabulario chino <span className="text-keyword-text">en contexto,</span> sin armar tarjetas ni diapositivas.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Elige las palabras del HSK 3.0 o pega la lista de tu libro. Renshi prepara las frases, el pinyin, el audio y
            el trazo de cada carácter. Tú compartes pantalla y enseñas.
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

        {item && sense && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6" aria-label="Reverso de la tarjeta de 认识">
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 gap-1">
                {item.characters.map((c, i) =>
                  c.strokes ? (
                    <StrokeArt key={`${i}-${c.char}`} strokes={c.strokes} roles={c.info?.strokeRoles ?? []} mode="static" tone="ink" className="size-20 rounded-lg border border-grid-line bg-background p-2 sm:size-24" title={c.char} />
                  ) : null,
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p lang="zh-Latn" className="text-4xl leading-none">{sense.pinyin}</p>
                  <button type="button" aria-label={labels.listenWord} onClick={() => speakChinese(item.word.hanzi)} className="rounded-md p-1.5 hover:bg-muted">
                    <Volume2 className="size-5" />
                  </button>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    HSK {item.word.hsk}
                    {sense.category && ` · ${categoryLabel(sense.category, labels)}`}
                  </span>
                </div>
                <p className="mt-2 text-xl">{sense.meaning.es}</p>
                <p className="text-sm text-muted-foreground">{sense.meaning.en}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              {formulas.length > 0 && (
                <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{labels.howItsBuilt}</p>
                  {formulas.map((f, i) => (
                    <p key={`${i}-${f.char}`} className="mb-2 flex items-start gap-x-1.5 font-hanzi text-xl leading-none last:mb-0">
                      <Piece char={f.char} pinyin={f.pinyin} />
                      <span className="pt-[0.15em] text-[0.6em] text-muted-foreground">=</span>
                      {f.parts.map((p, j) => (
                        <span key={j} className="flex items-start gap-x-1.5">
                          {j > 0 && <span className="pt-[0.15em] text-[0.6em] text-muted-foreground">+</span>}
                          <Piece char={p.char} pinyin={p.pinyin} className={cn(p.role === "semantic" && "text-radical", p.role === "phonetic" && "text-phonetic")} />
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              )}
              <ol className="rounded-xl border border-border bg-background/60 px-4">
                {sense.sentences.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">{i + 1}</span>
                    <p lang="zh-Hans" className="min-w-0 flex-1 font-hanzi text-xl"><Highlighted text={s.zh} keyword={item.word.hanzi} /></p>
                    <button type="button" aria-label={labels.listenSentence} onClick={() => speakChinese(s.zh)} className="rounded-md border border-border p-1.5 hover:bg-muted">
                      <Volume2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>

      {/* 02 · Preparar */}
      <section id="como-funciona" className="scroll-mt-4 border-y border-border bg-card/50">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col gap-4">
            <Eyebrow n="02">Preparar</Eyebrow>
            <h2 className="font-hanzi text-[clamp(1.875rem,3.4vw,2.75rem)] leading-tight font-semibold">
              Elige las palabras.
              <br />
              Lo demás ya está preparado.
            </h2>
            <p className="max-w-md text-muted-foreground">
              Marca vocabulario del HSK 3.0 o pega la lista de tu libro. Preséntalo en el momento o guárdalo como lección
              para la próxima clase.
            </p>
          </div>
          <CatalogPreview />
        </div>
      </section>

      {/* 03 · Enseñar */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
            <Eyebrow n="03">Enseñar</Eyebrow>
            <h2 className="font-hanzi text-[clamp(1.875rem,3.4vw,2.75rem)] leading-tight font-semibold">La palabra en frases, no sola.</h2>
            <p className="max-w-xl text-muted-foreground">
              Frases reales, matices, notas culturales y trazos animados. Tú decides cuándo mostrar el pinyin o la
              traducción.
            </p>
          </div>
          <p className="flex items-center gap-3 rounded-xl bg-keyword/10 px-4 py-3 text-sm text-keyword-text lg:max-w-xs">
            <RefreshCw className="size-5 shrink-0" />
            Las frases rotan: primero aparecen las que tu grupo aún no vio.
          </p>
        </div>

        {item && sense && (
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-sm font-medium">Frases en contexto</p>
              <ol>
                {sense.sentences.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-3 border-t border-border py-3 first:border-t-0">
                    <span className="mt-1 text-xs text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p lang="zh-Hans" className="font-hanzi text-xl"><Highlighted text={s.zh} keyword={item.word.hanzi} /></p>
                      <p className="text-sm text-muted-foreground">{s.es}</p>
                    </div>
                    <button type="button" aria-label={labels.listenSentence} onClick={() => speakChinese(s.zh)} className="rounded-md border border-border p-1.5 hover:bg-muted">
                      <Volume2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-sm font-medium">Trazos animados</p>
              <div lang="zh-Hans" className="mx-auto flex">
                {item.characters.map((c, i) =>
                  c.strokes ? (
                    <CalligraphyGrid key={`${i}-${c.char}-${run}`} paper className={cn("bg-background/60", i > 0 && "-ml-px")}>
                      <div className="size-32 p-[6%] sm:size-36">
                        <StrokeArt strokes={c.strokes} roles={c.info?.strokeRoles ?? []} mode="animate" tone="ink" ink startDelay={starts[i]} className="size-full" title={c.char} />
                      </div>
                    </CalligraphyGrid>
                  ) : null,
                )}
              </div>
              <button type="button" onClick={() => setRun((r) => r + 1)} className="mt-auto inline-flex items-center gap-2 self-center pt-4 text-sm text-keyword-text hover:underline">
                <RotateCcw className="size-4" /> Repetir el trazo
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium"><BookOpen className="size-4" /> Notas y uso</p>
              {sense.nuance && (
                <p className="text-sm text-muted-foreground">
                  <Highlighted text={sense.nuance.es} keyword={item.word.hanzi} small noteTerms={noteTerms} lang="es" labels={labels} />
                </p>
              )}
              {item.word.culturalNote && (
                <div className="mt-4 rounded-xl bg-keyword/10 p-4">
                  <p className="mb-1 flex items-center gap-2 text-sm font-medium text-keyword-text"><Lightbulb className="size-4" /> Nota cultural</p>
                  <p className="text-sm">
                    <Highlighted text={item.word.culturalNote.es} keyword={item.word.hanzi} small noteTerms={noteTerms} lang="es" labels={labels} />
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Toca las palabras subrayadas: muestran su pinyin y significado.</p>
            </div>
          </div>
        )}
      </section>

      {/* 04 · Participar */}
      <section className="bg-[oklch(0.2_0.013_240)] text-[oklch(0.95_0.01_80)]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-3 text-xs font-medium tracking-widest uppercase opacity-70">
              04 / Participar <span className="h-px w-16 bg-current opacity-40" />
            </p>
            <h2 className="font-hanzi text-[clamp(1.875rem,3.4vw,2.75rem)] leading-tight font-semibold">Sabes si entendieron.</h2>
            <p className="max-w-md opacity-80">
              Tus alumnos votan desde el celular, sin cuenta y de forma anónima, mientras explicas. La votación sigue a la
              palabra que muestras.
            </p>
          </div>
          {item && sense && <DevicesPreview item={item} />}
        </div>
      </section>

      {/* 05 · El proyecto */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Eyebrow n="05">El proyecto</Eyebrow>
          <h2 className="font-hanzi text-[clamp(1.875rem,3.4vw,2.75rem)] leading-tight font-semibold">Renshi está creciendo.</h2>
          <p className="text-muted-foreground">
            Vienen más frases, vocabulario creado por cada profesora y práctica de escritura. Queremos que sea cada vez
            más útil para quienes enseñan.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 self-center text-center">
          <div className="flex flex-col rounded-2xl border border-border bg-card px-3 py-6">
            <dt className="text-sm text-muted-foreground">palabras de HSK 3.0</dt>
            <dd className="order-first font-hanzi text-4xl font-semibold text-keyword-text">10 896</dd>
          </div>
          <div className="flex flex-col rounded-2xl border border-border bg-card px-3 py-6">
            <dt className="text-sm text-muted-foreground">frases de ejemplo</dt>
            <dd className="order-first font-hanzi text-4xl font-semibold text-keyword-text">~2700</dd>
          </div>
        </dl>
        <div className="flex flex-col justify-center gap-3">
          <p className="text-muted-foreground">¿Enseñas chino? El acceso es por invitación: escríbenos y te contamos.</p>
          <div className="flex flex-wrap gap-2">
            <a href={ACCESS_MAIL} className={cta}>
              <Mail className="size-4" /> Pedir acceso
            </a>
            <a href={IDEA_MAIL} className={ghostCta}>
              <MessageSquare className="size-4" /> Compartir una idea
            </a>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 border-t border-border px-4 py-14 text-center sm:px-6">
        <p lang="zh-Hans" className="font-hanzi text-[clamp(1.5rem,3vw,2.25rem)]">认识一个词，不如认识一句话。</p>
        <p lang="zh-Latn" className="text-muted-foreground">Rènshi yí ge cí, bùrú rènshi yí jù huà.</p>
        <p className="text-muted-foreground">Conocer una palabra está bien; conocerla dentro de una frase es mejor.</p>
        <Link href="/present" className={cn(cta, "mt-4")}>
          <Play className="size-4 fill-current" /> Ver una clase de ejemplo
        </Link>
        <p className="mt-8 max-w-2xl text-xs text-muted-foreground">
          Glosas y ejemplos de{" "}
          <a className="underline underline-offset-2" href="https://gushichinese.com/es/hsk-3.0/downloads">Gushi</a> (CC BY-SA 4.0) y{" "}
          <a className="underline underline-offset-2" href="https://tatoeba.org">Tatoeba</a> (CC BY 2.0 FR); trazos de{" "}
          <a className="underline underline-offset-2" href="https://github.com/chanind/hanzi-writer-data">hanzi-writer-data</a>.
        </p>
      </section>
    </div>
  );
}

// Vista del catálogo HSK como en la app (con datos fijos de HSK 1): se puede
// marcar y desmarcar para entender la idea, sin llamar a la base.
const PREVIEW_ROWS = [
  { hanzi: "爱", pinyin: "ài", meaning: "amar; gustar mucho", category: "verbo" },
  { hanzi: "八", pinyin: "bā", meaning: "ocho", category: "numeral" },
  { hanzi: "爸爸", pinyin: "bàba", meaning: "papá", category: "sustantivo" },
  { hanzi: "吃", pinyin: "chī", meaning: "comer", category: "verbo" },
  { hanzi: "认识", pinyin: "rènshi", meaning: "conocer (a una persona)", category: "verbo" },
];

function CatalogPreview() {
  const [checked, setChecked] = useState<Set<number>>(new Set([0, 4]));
  const toggle = (i: number, on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(i);
      else next.delete(i);
      return next;
    });
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="mb-3 flex gap-2">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
          <Search className="size-4" /> Buscar por hanzi, pinyin o significado…
        </div>
        <div className="flex h-9 items-center rounded-lg border border-input bg-background px-3 text-sm">HSK 1</div>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="w-8 py-2" />
            <th className="py-2 font-medium">Palabra</th>
            <th className="py-2 font-medium">Pinyin</th>
            <th className="hidden py-2 font-medium sm:table-cell">Significado</th>
            <th className="hidden py-2 font-medium md:table-cell">Categoría</th>
          </tr>
        </thead>
        <tbody>
          {PREVIEW_ROWS.map((r, i) => (
            <tr key={r.hanzi} className={cn("border-b border-border last:border-b-0", checked.has(i) && "bg-muted/60")}>
              <td className="py-2">
                <Checkbox aria-label={`Marcar ${r.hanzi}`} checked={checked.has(i)} onCheckedChange={(on) => toggle(i, on)} />
              </td>
              <td lang="zh-Hans" className="py-2 font-hanzi text-lg">{r.hanzi}</td>
              <td lang="zh-Latn" className="py-2">{r.pinyin}</td>
              <td className="hidden py-2 text-muted-foreground sm:table-cell">{r.meaning}</td>
              <td className="hidden py-2 text-muted-foreground md:table-cell">{r.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <p className="mr-auto text-xs text-muted-foreground" aria-live="polite">
          {checked.size === 1 ? "1 palabra seleccionada" : `${checked.size} palabras seleccionadas`}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm"><Bookmark className="size-4" /> Guardar lección</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.5_0.15_25)] px-3 py-1.5 text-sm text-white"><Play className="size-4" /> Presentar ({checked.size})</span>
      </div>
    </div>
  );
}

// La clase en la pantalla compartida y, al lado, el celular de un alumno con
// la misma palabra para votar (mismos textos y emojis que /v).
const EMOJI = ["😕", "😣", "🙂", "😎"];

function DevicesPreview({ item }: { item: LessonItem }) {
  const labels = studentLabels("es");
  const sense = item.word.senses[item.senseIndex];
  const sentence = sense.sentences[0];
  const [vote, setVote] = useState<number | null>(null);
  return (
    <div className="relative flex items-end justify-center gap-4 sm:justify-end">
      {/* Laptop */}
      <div className="hidden w-full max-w-lg sm:block">
        <div className="rounded-t-xl border-8 border-b-0 border-[oklch(0.3_0.01_240)] bg-card p-5 text-foreground">
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {item.characters.map((c, i) =>
                c.strokes ? <StrokeArt key={`${i}-${c.char}`} strokes={c.strokes} roles={c.info?.strokeRoles ?? []} mode="static" tone="ink" className="size-16 rounded-md border border-grid-line bg-background p-1.5" title={c.char} /> : null,
              )}
            </div>
            <div>
              <p lang="zh-Latn" className="text-2xl">{sense.pinyin}</p>
              <p className="text-lg">{sense.meaning.es}</p>
            </div>
          </div>
          {sentence && (
            <p lang="zh-Hans" className="mt-5 rounded-lg border border-border bg-background/60 px-4 py-3 font-hanzi text-2xl">
              <Highlighted text={sentence.zh} keyword={item.word.hanzi} />
            </p>
          )}
        </div>
        <div className="h-3 rounded-b-xl bg-[oklch(0.35_0.01_240)]" />
      </div>
      {/* Celular del alumno */}
      <div className="w-56 shrink-0 rounded-[2rem] border-8 border-[oklch(0.12_0.01_240)] bg-background p-4 text-foreground shadow-2xl">
        <div className="flex items-center justify-between text-sm">
          <span lang="zh-Hans" className="font-hanzi text-lg">认识</span>
          <span className="font-mono text-xs tracking-widest text-muted-foreground">BA5BX4</span>
        </div>
        <p lang="zh-Hans" className="mt-3 text-center font-hanzi text-5xl">{item.word.hanzi}</p>
        <p lang="zh-Latn" className="text-center text-muted-foreground">{sense.pinyin}</p>
        <p className="mt-3 text-center text-sm font-medium">¿Qué tal entiendes esta palabra?</p>
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ejemplo de votación">
          {labels.ratings.map((label, i) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={vote === i}
              onClick={() => setVote(vote === i ? null : i)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-border bg-card text-xs transition-colors",
                vote === i && "border-rating-3 bg-rating-3/30 font-semibold",
              )}
            >
              <span className="text-xl" aria-hidden>{EMOJI[i]}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
