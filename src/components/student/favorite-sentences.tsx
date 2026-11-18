"use client";

import { Volume2 } from "lucide-react";
import { SentenceText } from "@/components/present/card-back";
import { SentenceBookmarkButton } from "@/components/student/sentence-bookmark-button";
import { Button } from "@/components/ui/button";
import type { NoteTerm } from "@/lib/lesson-types";
import { speakChinese } from "@/lib/speech";
import { studentLabels } from "@/lib/student-labels";
import type { FavoriteSentence } from "@/lib/student-progress";

// Lista de «Mis frases»: el chino con cada palabra tocable, su pinyin y su
// traducción siempre a la vista (aquí se repasa, no se adivina). El corazón
// las quita; la fila no desaparece hasta recargar, para poder deshacer.
export function FavoriteSentences({ sentences, terms }: { sentences: FavoriteSentence[]; terms: Record<string, NoteTerm> }) {
  const labels = studentLabels("es");
  return (
    <ul className="flex flex-col gap-3">
      {sentences.map((s) => (
        <li key={s.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <div className="min-w-0 flex-1">
            <p lang="zh-Hans" className="font-hanzi text-2xl leading-snug">
              <SentenceText text={s.zh} keyword={s.hanzi} noteTerms={terms} lang="es" labels={labels} />
            </p>
            <p lang="zh-Latn" className="mt-1 text-muted-foreground">{s.pinyin}</p>
            {s.es && <p className="mt-1">{s.es}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button variant="outline" size="icon-lg" aria-label={labels.listenSentence} onClick={() => speakChinese(s.zh)}>
              <Volume2 />
            </Button>
            <SentenceBookmarkButton sentenceId={s.id} initial />
          </div>
        </li>
      ))}
    </ul>
  );
}
