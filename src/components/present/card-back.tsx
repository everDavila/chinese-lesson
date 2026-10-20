"use client";

import { useEffect, useId, useRef, useState } from "react";
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
    <li className="flex gap-4 border-t border-border py-4 first:border-t-0">
      <span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
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

export function CardBack({ item, showPinyin, showTranslations, sentenceMode = "zh", lang, noteTerms, footer }: CardBackProps) {
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
        <span lang="zh-Hans" className="shrink-0 font-hanzi text-2xl whitespace-nowrap">{word.hanzi}</span>
        <span lang="zh-Latn" className="shrink-0 text-lg whitespace-nowrap">{sense.pinyin}</span>
        <span className="min-w-0 truncate text-muted-foreground">{sense.meaning[lang]}</span>
      </div>
      <div ref={scrollRef} className="flex h-full w-full flex-col gap-4 overflow-y-auto">
        <header ref={headerRef} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
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
                  className="size-[clamp(3.75rem,9vw,7.5rem)] rounded-lg border border-grid-line bg-card p-2"
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
              {formulas.map((f, i) => (
                // Key con índice: dos caracteres repetidos darían dos fórmulas con
                // la misma key (爸爸 → 两 fórmulas de 爸).
                <p key={`${i}-${f.char}`} className="flex items-start gap-x-2 font-hanzi text-[clamp(1.25rem,2.2vw,2rem)] leading-none">
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
          {sense.sentences.length === 0 ? (
            <section className="rounded-xl border border-dashed border-border bg-background/60 px-5 py-4">
              <p className="text-[clamp(1.125rem,1.8vw,1.5rem)] font-medium">
                {labels.inventTitle} <span lang="zh-Hans" className="font-hanzi text-keyword-text">{word.hanzi}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{labels.inventHint}</p>
            </section>
          ) : (
          <ol className="rounded-xl border border-border bg-background/60 px-5">
            {sense.sentences.map((s, i) => (
              <SentenceRow
                key={`${word.hanzi}-${senseIndex}-${i}-${sentenceMode}`}
                mode={sentenceMode}
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
          )}
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
                  <p><Highlighted text={sense.nuance[lang]} keyword={word.hanzi} small noteTerms={noteTerms} lang={lang} labels={labels} /></p>
                </div>
              )}
              {word.culturalNote && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">{labels.culturalNote}</h3>
                  <p><Highlighted text={word.culturalNote[lang]} keyword={word.hanzi} small noteTerms={noteTerms} lang={lang} labels={labels} /></p>
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
                          <span lang="zh-Hans" className="font-hanzi text-muted-foreground"> · <Highlighted text={s.sentences[0].zh} keyword={word.hanzi} small /></span>
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
