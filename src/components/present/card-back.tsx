"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Volume2 } from "lucide-react";
import { StrokeArt } from "@/components/hanzi/stroke-art";
import { Button } from "@/components/ui/button";
import type { Bilingual, LessonItem, Sentence } from "@/lib/lesson-types";
import { studentLabels, type ContentLanguage, type StudentLabels } from "@/lib/student-labels";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";


// Resalta la palabra clave (rojo suave, único uso del rojo) en frases, matices
// y notas culturales.
function Highlighted({ text, keyword }: { text: string; keyword: string }) {
  const parts = text.split(keyword);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className="whitespace-nowrap text-keyword">{keyword}</span>}
        </span>
      ))}
    </>
  );
}

function SentenceRow({
  sentence,
  keyword,
  index,
  showPinyin,
  showTranslations,
  lang,
  labels,
}: {
  sentence: Sentence;
  keyword: string;
  index: number;
  showPinyin: boolean;
  showTranslations: boolean;
  lang: ContentLanguage;
  labels: StudentLabels;
}) {
  // Con las traducciones apagadas, un clic en la frase revela solo esa.
  const [revealed, setRevealed] = useState(false);
  const visible = showTranslations || revealed;
  // El estado de revisión de la frase (sentences.status) no se muestra aquí:
  // es información editorial interna, no material de clase. No existe aún
  // vista de admin que lo exponga, así que hoy vive solo en la base.
  return (
    <li className="flex gap-4 border-t border-border py-4 first:border-t-0">
      <span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-left font-hanzi text-[clamp(1.5rem,3.2vw,2.75rem)] leading-tight"
            aria-expanded={visible}
            title={showTranslations ? undefined : labels.revealTranslation}
          >
            <Highlighted text={sentence.zh} keyword={keyword} />
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={labels.listenSentence}
            onClick={() => speakChinese(sentence.zh)}
          >
            <Volume2 />
          </Button>
        </div>
        {showPinyin && (
          <p className="mt-1 text-[clamp(1rem,1.6vw,1.375rem)] text-muted-foreground">{sentence.pinyin}</p>
        )}
        {visible && (
          <p className="mt-1 text-[clamp(1rem,1.6vw,1.375rem)]">
            {sentence[lang]}
            {/* El inglés de apoyo se pliega en celular: alarga cada frase al doble
                (auditoría UX, P1). En pantalla grande, donde presenta la docente, sigue. */}
            {lang !== "en" && <span className="hidden text-muted-foreground sm:inline"> · {sentence.en}</span>}
          </p>
        )}
      </div>
    </li>
  );
}

type CardBackProps = {
  item: LessonItem;
  showPinyin: boolean;
  showTranslations: boolean;
  componentMeanings: Record<string, Bilingual>;
  /** Idioma del contenido para los alumnos (no el de la interfaz). */
  lang: ContentLanguage;
  footer?: React.ReactNode;
};

export function CardBack({ item, showPinyin, showTranslations, componentMeanings, lang, footer }: CardBackProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const labels = studentLabels(lang);
  const { word, senseIndex } = item;
  const sense = word.senses[senseIndex];
  const otherSenses = word.senses.filter((_, i) => i !== senseIndex);
  const withInfo = item.characters.filter((c) => c.info);

  // Al bajar por las frases, la cabecera grande se va: una barra compacta con
  // la palabra queda fija arriba (auditoría UX, P1). Va en un contenedor de
  // alto 0 para no mover el contenido al aparecer.
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const root = scrollRef.current;
    const header = headerRef.current;
    if (!root || !header) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), { root });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative mx-auto h-full w-full max-w-6xl">
      {/* La barra va fuera de la zona que se desplaza: dentro de la cara girada
          en 3D, un sticky queda detrás de la lista de frases. */}
      <div
        aria-hidden={!compact}
        data-testid="card-compact-header"
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-baseline gap-3 rounded-lg border border-border bg-card px-4 py-2 shadow-sm transition-opacity",
          compact ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <span className="shrink-0 font-hanzi text-2xl whitespace-nowrap">{word.hanzi}</span>
        <span className="shrink-0 text-lg whitespace-nowrap">{sense.pinyin}</span>
        <span className="min-w-0 truncate text-muted-foreground">{sense.meaning[lang]}</span>
      </div>
      <div ref={scrollRef} className="flex h-full w-full flex-col gap-4 overflow-y-auto">
        <header ref={headerRef} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex shrink-0 gap-1">
            {item.characters.map((c) =>
              c.strokes ? (
                <StrokeArt
                  key={c.char}
                  strokes={c.strokes}
                  roles={c.info?.strokeRoles ?? []}
                  mode="static"
                  className="size-[clamp(3.75rem,9vw,7.5rem)] rounded-lg border border-grid-line bg-card p-2"
                  title={c.char}
                />
              ) : (
                <span key={c.char} className="font-hanzi text-6xl sm:text-7xl">{c.char}</span>
              ),
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <p className="text-[clamp(2rem,4vw,3.5rem)] leading-none">{sense.pinyin}</p>
              <Button variant="ghost" size="icon-lg" aria-label={labels.listenWord} onClick={() => speakChinese(word.hanzi)}>
                <Volume2 />
              </Button>
              <span className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
                HSK {word.hsk} · {labels.categories[sense.category] ?? sense.category}
              </span>
            </div>
            <p className="mt-2 text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight">{sense.meaning[lang]}</p>
            {lang !== "en" && (
              <p className="hidden text-[clamp(1rem,1.6vw,1.375rem)] text-muted-foreground sm:block">{sense.meaning.en}</p>
            )}
          </div>
        </header>

        {/* Desde xl hay ancho de sobra: composición y frases lado a lado (auditoría UX,
            P2). La composición, angosta; las frases, que son lo principal, anchas. */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] xl:items-start">
          {/* Cómo se forma: aquí sí, la descomposición en color (radical verde,
              fonético azul). En el anverso solo hay un matiz de tono. */}
          {/* Solo la fórmula en color (知 = 矢 + 口): el significado del radical
              sale al pasar el cursor, enfocar o tocar. Una línea por carácter. */}
          {/* Sin datos de descomposición (hoy, casi todo fuera de la lección de
              demo) no se muestra nada: decir "carácter simple" sería falso. */}
          {withInfo.length > 0 && (
            <section aria-label={labels.howItsBuilt} className="flex flex-wrap gap-x-8 gap-y-2 rounded-xl border border-border bg-background/60 px-5 py-3">
              <h3 className="flex w-full flex-wrap items-baseline justify-between gap-x-3 text-sm font-medium text-muted-foreground">
                {labels.howItsBuilt}
                <span className="text-xs font-normal">{labels.howItsBuiltHint}</span>
              </h3>
              {withInfo.map((c) => {
                // Solo el radical lleva detalle (su significado). El sonido del
                // fonético confundía: varios componentes suenan parecido.
                const detail = (comp: NonNullable<typeof c.info>["components"][number]) =>
                  comp.role === "semantic" ? (componentMeanings[comp.char]?.[lang] ?? labels.radical) : null;
                return (
                  <p key={c.char} className="flex flex-wrap items-baseline gap-x-2 font-hanzi text-[clamp(1.25rem,2.2vw,2rem)]">
                    <span>{c.char}</span>
                    <span className="text-[0.6em] text-muted-foreground">=</span>
                    {c.info?.components.length ? (
                      c.info.components.map((comp, i) => {
                        const text = detail(comp);
                        const color = cn(comp.role === "semantic" && "text-radical", comp.role === "phonetic" && "text-phonetic");
                        return (
                          <span key={i} className="flex items-baseline gap-2">
                            {i > 0 && <span className="text-[0.6em] text-muted-foreground">+</span>}
                            {text ? (
                              <button
                                type="button"
                                className={cn("group relative rounded-sm underline decoration-dotted decoration-1 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring", color)}
                                aria-label={`${comp.char}: ${text}`}
                              >
                                {comp.char}
                                <span
                                  role="tooltip"
                                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 font-sans text-sm whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                                >
                                  {text}
                                </span>
                              </button>
                            ) : (
                              <span className={color}>{comp.char}</span>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="font-sans text-[clamp(1rem,1.4vw,1.25rem)] text-muted-foreground">{labels.simpleCharacter}</span>
                    )}
                  </p>
                );
              })}
            </section>
          )}

          <ol className="rounded-xl border border-border bg-background/60 px-5">
            {sense.sentences.map((s, i) => (
              <SentenceRow
                key={`${word.hanzi}-${senseIndex}-${i}`}
                sentence={s}
                keyword={word.hanzi}
                index={i}
                showPinyin={showPinyin}
                showTranslations={showTranslations}
                lang={lang}
                labels={labels}
              />
            ))}
          </ol>
        </div>

        <section className="rounded-xl border border-border bg-background/60">
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-3 text-left"
            onClick={() => setDetailsOpen((o) => !o)}
            aria-expanded={detailsOpen}
          >
            <span className="font-medium">{labels.moreDetails}</span>
            <ChevronDown className={cn("size-5 transition-transform", detailsOpen && "rotate-180")} />
          </button>
          {detailsOpen && (
            <div className="grid gap-5 border-t border-border px-5 py-4 md:grid-cols-2">
              {sense.nuance && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">{labels.nuance}</h3>
                  <p><Highlighted text={sense.nuance[lang]} keyword={word.hanzi} /></p>
                </div>
              )}
              {word.culturalNote && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">{labels.culturalNote}</h3>
                  <p><Highlighted text={word.culturalNote[lang]} keyword={word.hanzi} /></p>
                </div>
              )}
              {otherSenses.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">{labels.otherUses}</h3>
                  <ul className="space-y-1">
                    {otherSenses.map((s, i) => (
                      <li key={i}>
                        {s.meaning[lang]}
                        {s.sentences[0] && (
                          <span className="font-hanzi text-muted-foreground"> · <Highlighted text={s.sentences[0].zh} keyword={word.hanzi} /></span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {footer}
      </div>
    </div>
  );
}
