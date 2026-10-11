"use client";

import { useState } from "react";
import { ChevronDown, Volume2 } from "lucide-react";
import { StrokeArt } from "@/components/hanzi/stroke-art";
import { Button } from "@/components/ui/button";
import type { Bilingual, LessonItem, Sentence } from "@/lib/lesson-types";
import { toneless } from "@/lib/pinyin";
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
            className="text-left font-hanzi text-[clamp(1.75rem,3.2vw,2.75rem)] leading-tight"
            aria-expanded={visible}
            title={showTranslations ? undefined : labels.revealTranslation}
          >
            <Highlighted text={sentence.zh} keyword={keyword} />
          </button>
          {sentence.status === "unreviewed" && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
              {labels.unreviewedExample}
            </span>
          )}
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
            {lang !== "en" && <span className="text-muted-foreground"> · {sentence.en}</span>}
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

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 overflow-y-auto">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 gap-1">
          {item.characters.map((c) =>
            c.strokes ? (
              <StrokeArt
                key={c.char}
                strokes={c.strokes}
                roles={c.info?.strokeRoles ?? []}
                mode="static"
                className="size-[clamp(4.5rem,9vw,7.5rem)] rounded-lg border border-grid-line bg-card p-2"
                title={c.char}
              />
            ) : (
              <span key={c.char} className="font-hanzi text-7xl">{c.char}</span>
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
            <p className="text-[clamp(1rem,1.6vw,1.375rem)] text-muted-foreground">{sense.meaning.en}</p>
          )}
        </div>
      </header>

      {/* Cómo se forma: aquí sí, la descomposición en color (radical verde,
          fonético azul). En el anverso solo hay un matiz de tono. */}
      <section aria-label={labels.howItsBuilt} className="flex flex-wrap gap-x-8 gap-y-2 rounded-xl border border-border bg-background/60 px-5 py-3">
        <h3 className="w-full text-sm font-medium text-muted-foreground">{labels.howItsBuilt}</h3>
        {item.characters.map((c) => {
          const charSyllable = c.info?.pinyin[0];
          return (
            <p key={c.char} className="flex flex-wrap items-baseline gap-x-2 text-[clamp(1rem,1.4vw,1.25rem)]">
              <span className="font-hanzi text-[clamp(1.5rem,2.2vw,2rem)]">{c.char}</span>
              <span className="text-muted-foreground">=</span>
              {c.info?.components.length ? (
                c.info.components.map((comp, i) => (
                  <span key={i} className="flex items-baseline gap-1">
                    {i > 0 && <span className="text-muted-foreground">+</span>}
                    <span
                      className={cn(
                        "font-hanzi text-[clamp(1.5rem,2.2vw,2rem)]",
                        comp.role === "semantic" && "text-radical",
                        comp.role === "phonetic" && "text-phonetic",
                      )}
                    >
                      {comp.char}
                    </span>
                    {comp.role === "semantic" && (
                      <span className="text-muted-foreground">
                        {componentMeanings[comp.char]?.[lang] ?? labels.radical}
                      </span>
                    )}
                    {comp.role === "phonetic" && comp.pinyin && (
                      <span className="text-muted-foreground">
                        {comp.pinyin} ·{" "}
                        {charSyllable && toneless(comp.pinyin) === toneless(charSyllable)
                          ? labels.givesSound
                          : labels.approximateSound}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">{labels.simpleCharacter}</span>
              )}
            </p>
          );
        })}
      </section>

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
  );
}
