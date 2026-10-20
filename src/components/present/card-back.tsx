"use client";

import { useId, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Languages, Type, Volume2, X } from "lucide-react";
import { StrokeArt } from "@/components/hanzi/stroke-art";
import { Button } from "@/components/ui/button";
import type { LessonItem, NoteTerm, Sentence } from "@/lib/lesson-types";
import { categoryLabel, studentLabels, type ContentLanguage, type StudentLabels } from "@/lib/student-labels";
import { segmentHan } from "@/lib/note-terms";
import { speakChinese } from "@/lib/speech";
import type { SentenceMode } from "./sentence-mode-store";
import { cn } from "@/lib/utils";


// Resalta la palabra clave (rojo suave, único uso del rojo) en frases, matices
// y notas culturales. En texto chico (`small`) usa un rojo algo más oscuro:
// el suave no llega al contraste 4.5:1 que pide el texto normal.
function NoteTermHelp({ term, lang, labels }: { term: NoteTerm; lang: ContentLanguage; labels: StudentLabels }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={350}
        closeDelay={150}
        className="rounded-sm font-hanzi text-foreground underline decoration-primary decoration-dotted underline-offset-4 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
      >
        {term.hanzi}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className="z-50">
          <Popover.Popup className="w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none">
            <div className="flex items-start justify-between gap-3">
              <Popover.Title className="text-lg font-medium">{term.pinyin}</Popover.Title>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label={labels.listenWord} onClick={() => speakChinese(term.hanzi)}>
                  <Volume2 />
                </Button>
                <Popover.Close className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" aria-label={labels.close}>
                  <X className="size-4" />
                </Popover.Close>
              </div>
            </div>
            {/* Un carácter citado que no es palabra del catálogo solo trae su pinyin. */}
            {term.meaning[lang] && <Popover.Description className="mt-2 text-sm">{term.meaning[lang]}</Popover.Description>}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Highlighted({
  text,
  keyword,
  small,
  noteTerms,
  lang,
  labels,
}: {
  text: string;
  keyword: string;
  small?: boolean;
  noteTerms?: Record<string, NoteTerm>;
  lang?: ContentLanguage;
  labels?: StudentLabels;
}) {
  if (noteTerms && lang && labels) {
    return (
      <>
        {text.split(/(\p{Script=Han}+)/gu).map((part, i) =>
          // Una cita larga (一边吃饭一边聊天) se parte en sus palabras; cada una abre su ayuda.
          segmentHan(part, (piece) => piece === keyword || piece in noteTerms).map((piece, j) => {
            const key = `${i}-${j}`;
            if (piece.text === keyword)
              return <span key={key} className={cn("whitespace-nowrap", small ? "text-keyword-text" : "text-keyword")}>{piece.text}</span>;
            const term = piece.term ? noteTerms[piece.text] : undefined;
            return term ? <NoteTermHelp key={key} term={term} lang={lang} labels={labels} /> : <span key={key}>{piece.text}</span>;
          }),
        )}
      </>
    );
  }
  const parts = text.split(keyword);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span lang="zh-Hans" className={cn("whitespace-nowrap", small ? "text-keyword-text" : "text-keyword")}>{keyword}</span>
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
  mode,
  master,
}: {
  sentence: Sentence;
  keyword: string;
  index: number;
  showPinyin: boolean;
  /** En modo 中文 revela las traducciones; en ES/EN, el chino. */
  showTranslations: boolean;
  lang: ContentLanguage;
  labels: StudentLabels;
  mode: SentenceMode;
  master: boolean;
}) {
  const [pinyinOverride, setPinyinOverride] = useState<boolean | null>(null);
  const [revealOverride, setRevealOverride] = useState<boolean | null>(null);
  const pinyinVisible = pinyinOverride ?? showPinyin;
  const revealed = revealOverride ?? showTranslations;
  const pinyinId = useId();
  const revealId = useId();
  // Frases en español o inglés primero: la clase intenta decirla en chino y
  // se revela. Si la frase no tiene ese idioma (p. ej. una propia sin
  // traducir), se usa el otro; si no tiene ninguno, se muestra en chino.
  const prompt = mode === "zh" ? "" : sentence[mode] || sentence[mode === "es" ? "en" : "es"];
  const chineseFirst = mode === "zh" || !prompt;
  const other: ContentLanguage = lang === "es" ? "en" : "es";
  const btn = "h-12 w-full px-0 sm:size-9";
  const pinyinButton = (
    <Button
      variant={pinyinVisible ? "secondary" : "outline"}
      className={btn}
      aria-label={pinyinVisible ? labels.hidePinyin : labels.showPinyin}
      aria-pressed={pinyinVisible}
      aria-controls={pinyinId}
      onClick={() => setPinyinOverride(!pinyinVisible)}
    >
      <Type className="size-5 sm:size-4" />
    </Button>
  );
  const pinyinLine = pinyinVisible && (
    <p id={pinyinId} lang="zh-Latn" className="mt-1 text-[clamp(1rem,1.6vw,1.375rem)] text-muted-foreground">{sentence.pinyin}</p>
  );
  const chinese = (
    <p lang="zh-Hans" className="text-left font-hanzi text-[clamp(1.5rem,3.2vw,2.75rem)] leading-tight">
      <Highlighted text={sentence.zh} keyword={keyword} />
    </p>
  );
  // El estado de revisión de la frase (sentences.status) no se muestra aquí:
  // es información editorial interna, no material de clase.
  return (
    // La frase maestra resalta con el fondo claro de la tarjeta y una franja
    // de acento; el rojo queda solo para la palabra clave.
    <li
      className={cn(
        "relative flex gap-4 border-t border-border px-5 py-4 first:border-t-0",
        master && "bg-card before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary/70",
      )}
    >
      <span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        {master && <p className="mb-1 text-xs font-medium tracking-wide text-primary uppercase">{labels.masterSentence}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {chineseFirst ? chinese : <p className="text-left text-[clamp(1.25rem,2.4vw,2rem)] leading-snug">{prompt}</p>}
          {/* Audio siempre primero. En 中文: pinyin y traducción; en ES/EN: chino y pinyin. */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
            <Button variant="outline" className={btn} aria-label={labels.listenSentence} onClick={() => speakChinese(sentence.zh)}>
              <Volume2 className="size-5 sm:size-4" />
            </Button>
            {chineseFirst ? (
              <>
                {pinyinButton}
                <Button
                  variant={revealed ? "secondary" : "outline"}
                  className={btn}
                  aria-label={revealed ? labels.hideTranslation : labels.showTranslation}
                  aria-pressed={revealed}
                  aria-controls={revealId}
                  onClick={() => setRevealOverride(!revealed)}
                >
                  <Languages className="size-5 sm:size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={revealed ? "secondary" : "outline"}
                  className={btn}
                  aria-label={revealed ? labels.hideChinese : labels.showChinese}
                  aria-pressed={revealed}
                  aria-controls={revealId}
                  onClick={() => setRevealOverride(!revealed)}
                >
                  <span lang="zh-Hans" className="font-hanzi text-lg sm:text-base">中</span>
                </Button>
                {pinyinButton}
              </>
            )}
          </div>
        </div>
        {chineseFirst ? (
          <>
            {pinyinLine}
            {/* Traducción en los dos idiomas: a veces se entiende mejor en inglés (Ever). */}
            {revealed && (
              <div id={revealId} className="mt-1 text-[clamp(1rem,1.6vw,1.375rem)]">
                {sentence[lang] && <p>{sentence[lang]}</p>}
                {sentence[other] && <p className="text-muted-foreground">{sentence[other]}</p>}
              </div>
            )}
          </>
        ) : (
          <>
            {revealed && <div id={revealId} className="mt-2">{chinese}</div>}
            {pinyinLine}
          </>
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
export function buildFormula(char: string, info: LessonItem["characters"][number]["info"]): Formula[] {
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
export function Piece({ char, pinyin, className }: { char: string; pinyin: string | null; className?: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span lang="zh-Hans" className={className}>{char}</span>
      <span lang="zh-Latn" className="mt-1 font-sans text-[0.45em] text-muted-foreground">{pinyin ?? " "}</span>
    </span>
  );
}

type CardBackProps = {
  item: LessonItem;
  showPinyin: boolean;
  showTranslations: boolean;
  /** En qué idioma empiezan las frases (barra de la presentación). */
  sentenceMode?: SentenceMode;
  /** Idioma del contenido para los alumnos (no el de la interfaz). */
  lang: ContentLanguage;
  noteTerms?: Record<string, NoteTerm>;
  footer?: React.ReactNode;
};

type Detail = "nuance" | "uses" | "culture";

/** Título de cada zona del reverso: el mismo en las dos columnas para que alineen. */
export const SECTION_TITLE = "text-sm font-medium text-muted-foreground";

function DetailDisclosure({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left font-medium"
        onClick={onToggle}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-5 pb-4 text-sm leading-relaxed">{children}</div>}
    </section>
  );
}

export function CardBack({ item, showPinyin, showTranslations, sentenceMode = "zh", lang, noteTerms, footer }: CardBackProps) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const labels = studentLabels(lang);
  const { word, senseIndex } = item;
  const sense = word.senses[senseIndex];
  const otherSenses = word.senses.filter((_, i) => i !== senseIndex);
  const formulas = item.characters.flatMap((c) => buildFormula(c.char, c.info));

  // En escritorio solo se desplazan las dos zonas inferiores: la palabra y su
  // composición permanecen visibles mientras la docente recorre la ficha.
  const hasDetails = Boolean(sense.nuance || word.culturalNote || otherSenses.length);

  return (
    <div className="mx-auto h-full w-full max-w-6xl">
      {/* Bajo lg, filas de alto natural: con filas auto y h-full, el grid
          aplasta a 0 las secciones con overflow-hidden cuando no cabe todo. */}
      <div className="grid h-full min-h-0 auto-rows-max gap-4 overflow-y-auto lg:auto-rows-auto lg:grid-cols-[minmax(0,1.85fr)_minmax(17rem,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
        <header data-testid="card-word-header" className={cn("flex flex-col items-start gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:gap-6 lg:col-start-1 lg:row-start-1", formulas.length === 0 && "lg:col-span-2")}>
          <div className="flex shrink-0 gap-1">
            {item.characters.map((c, i) =>
              c.strokes ? (
                // Key con índice: un carácter repetido (爸爸) duplicaría la key y
                // React no desmontaría la casilla vieja (fantasma en la tarjeta).
                <StrokeArt
                  key={`${i}-${c.char}`}
                  strokes={c.strokes}
                  roles={c.info?.strokeRoles ?? []}
                  mode="static"
                  className="size-[clamp(4rem,8vw,7rem)] rounded-lg border border-grid-line bg-card p-2"
                  title={c.char}
                />
              ) : (
                <span key={`${i}-${c.char}`} lang="zh-Hans" className="font-hanzi text-6xl sm:text-7xl">{c.char}</span>
              ),
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p lang="zh-Latn" className="text-[clamp(1.625rem,4vw,3.5rem)] leading-none [overflow-wrap:anywhere]">{sense.pinyin}</p>
              <Button variant="ghost" size="icon-lg" aria-label={labels.listenWord} onClick={() => speakChinese(word.hanzi)}>
                <Volume2 />
              </Button>
              <span title={labels.hskNote} className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
                {/* HSK 3.0 agrupa 7, 8 y 9 en una banda: en la base es 7. */}
                {/* Sin nivel: palabras fuera del temario (sin HSK, no «HSK 0»). */}
                {word.hsk ? `HSK ${word.hsk === 7 ? "7–9" : word.hsk}` : labels.noHsk}
                {sense.category && ` · ${categoryLabel(sense.category, labels)}`}
              </span>
            </div>
            <p className="mt-2 text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight">{sense.meaning[lang]}</p>
            {lang !== "en" && (
              <p className="hidden text-[clamp(1rem,1.6vw,1.375rem)] text-muted-foreground sm:block">{sense.meaning.en}</p>
            )}
          </div>
        </header>

        <div className="grid gap-4 lg:contents">
          {/* Cómo se forma: la fórmula en color (radical verde, fonético azul)
              con el pinyin de cada pieza debajo, para poder nombrarla en clase
              ("el de kǒu"). Sin glosas. Si los datos de un carácter están
              incompletos, su fórmula no se muestra: a medias enseñaría mal. */}
          {formulas.length > 0 && (
            <section aria-label={labels.howItsBuilt} className="flex flex-wrap gap-x-10 gap-y-3 border-b border-border pb-4 lg:col-start-2 lg:row-start-1 lg:border-l lg:pl-6 lg:pr-24">
              <h2 className={cn("w-full", SECTION_TITLE)}>{labels.howItsBuilt}</h2>
              {formulas.map((f, i) => (
                // Key con índice: dos caracteres repetidos darían dos fórmulas con
                // la misma key (爸爸 → 两 fórmulas de 爸).
                <p key={`${i}-${f.char}`} className="flex items-start gap-x-2 font-hanzi text-[clamp(1.4rem,2.4vw,2.25rem)] leading-none">
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

          {/* Palabra del catálogo sin frases (casi todo HSK 4–9): en vez de un
              hueco, una consigna para la clase. Usar la palabra enseña más que
              reconocerla. (Las palabras propias de la docente, cuando existan,
              saldrán sin consigna: decisión de Ever.) */}
          <section data-testid="card-examples" aria-label={labels.examples} className="min-w-0 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:pr-1">
            <h2 className={cn("mb-2", SECTION_TITLE)}>{labels.examples}</h2>
            {sense.sentences.length === 0 ? (
              <section className="rounded-xl border border-dashed border-border bg-background/60 px-5 py-4">
                <p className="text-[clamp(1.125rem,1.8vw,1.5rem)] font-medium">
                  {labels.inventTitle} <span lang="zh-Hans" className="font-hanzi text-keyword-text">{word.hanzi}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{labels.inventHint}</p>
              </section>
            ) : (
              <ol className="overflow-hidden rounded-xl border border-border bg-background/60">
                {sense.sentences.map((s, i) => (
                  <SentenceRow
                    key={`${word.hanzi}-${senseIndex}-${i}-${sentenceMode}`}
                    mode={sentenceMode}
                    sentence={s}
                    keyword={word.hanzi}
                    index={i}
                    // Sin marca explícita no hay frase maestra: con la rotación, la
                    // primera de cada clase puede ser cualquiera (2026-10-20).
                    master={false}
                    showPinyin={showPinyin}
                    showTranslations={showTranslations}
                    lang={lang}
                    labels={labels}
                  />
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Columna derecha: detalles y comprensión del grupo, cada uno con su
            título como «Frases en contexto», así las dos columnas empiezan a la
            misma altura. En escritorio se desplaza sola si no cabe. */}
        <aside className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-2 lg:ml-4 lg:min-h-0 lg:overflow-y-auto">
          {hasDetails && (
            <section aria-label={labels.moreDetails}>
              <h2 className={cn("mb-2", SECTION_TITLE)}>{labels.moreDetails}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-background/60">
                {sense.nuance && (
                  <DetailDisclosure label={labels.nuance} open={detail === "nuance"} onToggle={() => setDetail(detail === "nuance" ? null : "nuance")}>
                    <Highlighted text={sense.nuance[lang]} keyword={word.hanzi} small noteTerms={noteTerms} lang={lang} labels={labels} />
                  </DetailDisclosure>
                )}
                {otherSenses.length > 0 && (
                  <DetailDisclosure label={labels.otherUses} open={detail === "uses"} onToggle={() => setDetail(detail === "uses" ? null : "uses")}>
                    <ul className="space-y-2">
                      {otherSenses.map((s, i) => (
                        <li key={i}>
                          {s.meaning[lang]}
                          {s.sentences[0] && (
                            <span lang="zh-Hans" className="font-hanzi text-muted-foreground"> · <Highlighted text={s.sentences[0].zh} keyword={word.hanzi} small /></span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </DetailDisclosure>
                )}
                {word.culturalNote && (
                  <DetailDisclosure label={labels.culturalNote} open={detail === "culture"} onToggle={() => setDetail(detail === "culture" ? null : "culture")}>
                    <Highlighted text={word.culturalNote[lang]} keyword={word.hanzi} small noteTerms={noteTerms} lang={lang} labels={labels} />
                  </DetailDisclosure>
                )}
              </div>
            </section>
          )}
          {footer}
        </aside>
      </div>
    </div>
  );
}
