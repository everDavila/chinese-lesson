"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Highlighted, Piece, buildFormula } from "@/components/present/card-back";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/lib/lesson-types";
import { categoryLabel, studentLabels } from "@/lib/student-labels";
import { speakChinese } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { ToneText } from "./tone-text";

// Ficha de estudio del alumno: conocer una palabra nueva, con todo a la vista y
// sin giro ni valoración. La usan el ejercicio «Estudiar» y el prototipo
// /lab/tarjetas. El silencio del audio automático vive aquí también.

// Una columna, orden fijo: lo esencial a la vista, el resto plegado.
export function FichaEstudio({ item }: { item: Lesson["items"][number] }) {
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


const MUTE_KEY = "renshi:alumno:estudio-silencio";
const muteListeners = new Set<() => void>();
// En el servidor cuenta como silenciado: no suena nada antes de leer la preferencia.
export const muteStore = {
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

