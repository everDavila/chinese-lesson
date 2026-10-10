"use client";

import { useState } from "react";
import { ChevronDown, Volume2 } from "lucide-react";
import { StrokeArt } from "@/components/hanzi/stroke-art";
import { Button } from "@/components/ui/button";
import type { Bilingual, LessonItem, Sentence } from "@/lib/lesson-types";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";

const CATEGORY_ES: Record<string, string> = {
  noun: "sustantivo",
  verb: "verbo",
  "measure word": "clasificador",
  "set phrase": "expresión",
};

// Resalta la palabra clave (rojo suave, único uso del rojo) en frases, matices
// y notas culturales.
function Highlighted({ text, keyword }: { text: string; keyword: string }) {
  const parts = text.split(keyword);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className="text-keyword">{keyword}</span>}
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
}: {
  sentence: Sentence;
  keyword: string;
  index: number;
  showPinyin: boolean;
  showTranslations: boolean;
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-left font-hanzi text-[clamp(1.75rem,3.2vw,2.75rem)] leading-tight"
            aria-expanded={visible}
            title={showTranslations ? undefined : "Clic para ver la traducción"}
          >
            <Highlighted text={sentence.zh} keyword={keyword} />
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Escuchar la frase"
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
            {sentence.es} <span className="text-muted-foreground">· {sentence.en}</span>
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
  footer?: React.ReactNode;
};

export function CardBack({ item, showPinyin, showTranslations, componentMeanings, footer }: CardBackProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { word, senseIndex } = item;
  const sense = word.senses[senseIndex];
  const otherSenses = word.senses.filter((_, i) => i !== senseIndex);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 overflow-y-auto">
      <header className="flex items-center gap-6">
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
            <Button variant="ghost" size="icon-lg" aria-label="Escuchar la palabra" onClick={() => speakChinese(word.hanzi)}>
              <Volume2 />
            </Button>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
              HSK {word.hsk} · {CATEGORY_ES[sense.category] ?? sense.category}
            </span>
          </div>
          <p className="mt-2 text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight">{sense.meaning.es}</p>
          <p className="text-[clamp(1rem,1.6vw,1.375rem)] text-muted-foreground">{sense.meaning.en}</p>
        </div>
      </header>

      <ol className="rounded-xl border border-border bg-background/60 px-5">
        {sense.sentences.map((s, i) => (
          <SentenceRow
            key={`${word.hanzi}-${senseIndex}-${i}`}
            sentence={s}
            keyword={word.hanzi}
            index={i}
            showPinyin={showPinyin}
            showTranslations={showTranslations}
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
          <span className="font-medium">Más detalles de la palabra</span>
          <ChevronDown className={cn("size-5 transition-transform", detailsOpen && "rotate-180")} />
        </button>
        {detailsOpen && (
          <div className="grid gap-5 border-t border-border px-5 py-4 md:grid-cols-2">
            {sense.nuance && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Matiz</h3>
                <p><Highlighted text={sense.nuance.es} keyword={word.hanzi} /></p>
              </div>
            )}
            {word.culturalNote && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Nota cultural</h3>
                <p><Highlighted text={word.culturalNote.es} keyword={word.hanzi} /></p>
              </div>
            )}
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Caracteres</h3>
              <ul className="space-y-1">
                {item.characters.map((c) => (
                  <li key={c.char}>
                    <span className="font-hanzi text-xl">{c.char}</span>{" "}
                    {c.info?.components.map((comp, i) => (
                      <span key={i}>
                        {i > 0 && " + "}
                        <span
                          className={cn(
                            "font-hanzi text-xl",
                            comp.role === "semantic" && "text-radical",
                            comp.role === "phonetic" && "text-phonetic",
                          )}
                        >
                          {comp.char}
                        </span>
                        {comp.role === "semantic" && componentMeanings[comp.char] && (
                          <span className="text-muted-foreground"> ({componentMeanings[comp.char].es})</span>
                        )}
                        {comp.role === "phonetic" && comp.pinyin && (
                          <span className="text-muted-foreground"> ({comp.pinyin}, sonido)</span>
                        )}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
            {otherSenses.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Otros usos (otras lecciones)</h3>
                <ul className="space-y-1">
                  {otherSenses.map((s, i) => (
                    <li key={i}>
                      {s.meaning.es}
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
