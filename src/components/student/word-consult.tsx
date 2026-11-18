"use client";

import { useSyncExternalStore } from "react";
import { CardBack } from "@/components/present/card-back";
import { BookmarkButton } from "@/components/student/bookmark-button";
import { SentencePinyinToggle } from "@/components/student/sentence-pinyin-toggle";
import { prefsStore } from "@/components/student/student-store";
import type { Lesson } from "@/lib/lesson-types";

// Consulta de una palabra desde el rastreador: su ficha completa, sin valorar
// ni preguntar nada. Con los mismos ayudantes de la práctica: pinyin de las
// frases oculto por defecto, palabras tocables y corazones.
export function WordConsult({
  lesson,
  bookmarked,
  favoriteSentences,
}: {
  lesson: Lesson;
  bookmarked: boolean;
  favoriteSentences: string[];
}) {
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.snapshot, prefsStore.serverSnapshot);
  const item = lesson.items[0];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SentencePinyinToggle />
        {item.senseId && <BookmarkButton senseId={item.senseId} initial={bookmarked} />}
      </div>
      <CardBack item={item} showPinyin={prefs.sentencePinyin} showTranslations lang="es" noteTerms={lesson.noteTerms} favoriteSentences={favoriteSentences} />
    </div>
  );
}
