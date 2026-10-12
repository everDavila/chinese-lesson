"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Volume2 } from "lucide-react";
import { StrokeArt } from "@/components/hanzi/stroke-art";
import { Button } from "@/components/ui/button";
import type { LessonItem, Sentence } from "@/lib/lesson-types";
import { studentLabels, type ContentLanguage, type StudentLabels } from "@/lib/student-labels";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";


// Resalta la palabra clave (rojo suave, único uso del rojo) en frases, matices
// y notas culturales. En texto chico (`small`) usa un rojo algo más oscuro:
// el suave no llega al contraste 4.5:1 que pide el texto normal.
function Highlighted({ text, keyword, small }: { text: string; keyword: string; small?: boolean }) {
  const parts = text.split(keyword);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className={cn("whitespace-nowrap", small ? "text-keyword-text" : "text-keyword")}>{keyword}</span>
          )}
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

// ── Cómo se forma ────────────────────────────────────────────────────────
type Part = { char: string; role: "semantic" | "phonetic" | "other"; pinyin: string | null };
type Formula = { char: string; pinyin: string | null; parts: Part[] };

// Descripciones de estructura (⿰⿱…) de Make Me a Hanzi.
const IDC = /[⿰-⿻]/g;

/**
 * Fórmula de un carácter a partir de sus datos. Una pieza anidada (⿱旦寸)
 * se aplana en sus caracteres (旦 + 寸). Si falta una pieza (？) o no hay
 * datos, no hay fórmula: una a medias enseñaría algo falso.
 */
function buildFormula(char: string, info: LessonItem["characters"][number]["info"]): Formula[] {
  const comps = info?.components ?? [];
  if (!comps.length || comps.some((p) => p.char.includes("？"))) return [];
  const parts = comps.flatMap((p): Part[] =>
    p.char.length > 1
      ? [...p.char.replace(IDC, "")].map((ch) => ({ char: ch, role: "other", pinyin: null }))
      : [{ char: p.char, role: p.role, pinyin: p.pinyin }],
  );
  return [{ char, pinyin: info?.pinyin[0] ?? null, parts }];
}

/** Una pieza: el hanzi y, debajo, su pinyin chiquito (el nombre con que se dice en clase). */
function Piece({ char, pinyin, className }: { char: string; pinyin: string | null; className?: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span className={className}>{char}</span>
      <span className="mt-1 font-sans text-[0.45em] text-muted-foreground">{pinyin ?? " "}</span>
    </span>
  );
}

type CardBackProps = {
  item: LessonItem;
  showPinyin: boolean;
  showTranslations: boolean;
  /** Idioma del contenido para los alumnos (no el de la interfaz). */
  lang: ContentLanguage;
  footer?: React.ReactNode;
};

export function CardBack({ item, showPinyin, showTranslations, lang, footer }: CardBackProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const labels = studentLabels(lang);
  const { word, senseIndex } = item;
  const sense = word.senses[senseIndex];
  const otherSenses = word.senses.filter((_, i) => i !== senseIndex);
  const formulas = item.characters.flatMap((c) => buildFormula(c.char, c.info));

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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[clamp(1.625rem,4vw,3.5rem)] leading-none [overflow-wrap:anywhere]">{sense.pinyin}</p>
              <Button variant="ghost" size="icon-lg" aria-label={labels.listenWord} onClick={() => speakChinese(word.hanzi)}>
                <Volume2 />
              </Button>
              <span title={labels.hskNote} className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
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
        {/* Sin fórmula que mostrar, las frases usan todo el ancho. */}
        <div className={cn("grid gap-4", formulas.length > 0 && "xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] xl:items-start")}>
          {/* Cómo se forma: la fórmula en color (radical verde, fonético azul)
              con el pinyin de cada pieza debajo, para poder nombrarla en clase
              ("el de kǒu"). Sin glosas. Si los datos de un carácter están
              incompletos, su fórmula no se muestra: a medias enseñaría mal. */}
          {formulas.length > 0 && (
            <section aria-label={labels.howItsBuilt} className="flex flex-wrap gap-x-10 gap-y-3 rounded-xl border border-border bg-background/60 px-5 py-3">
              <h3 className="w-full text-sm font-medium text-muted-foreground">{labels.howItsBuilt}</h3>
              {formulas.map((f) => (
                <p key={f.char} className="flex items-start gap-x-2 font-hanzi text-[clamp(1.25rem,2.2vw,2rem)] leading-none">
                  <Piece char={f.char} pinyin={f.pinyin} />
                  <span className="pt-[0.15em] text-[0.6em] text-muted-foreground">=</span>
                  {f.parts.map((p, i) => (
                    <span key={i} className="flex items-start gap-x-2">
                      {i > 0 && <span className="pt-[0.15em] text-[0.6em] text-muted-foreground">+</span>}
                      <Piece
                        char={p.char}
                        pinyin={p.pinyin}
                        className={cn(p.role === "semantic" && "text-radical", p.role === "phonetic" && "text-phonetic")}
                      />
                    </span>
                  ))}
                </p>
              ))}
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
                  <p><Highlighted text={sense.nuance[lang]} keyword={word.hanzi} small /></p>
                </div>
              )}
              {word.culturalNote && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">{labels.culturalNote}</h3>
                  <p><Highlighted text={word.culturalNote[lang]} keyword={word.hanzi} small /></p>
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
                          <span className="font-hanzi text-muted-foreground"> · <Highlighted text={s.sentences[0].zh} keyword={word.hanzi} small /></span>
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
