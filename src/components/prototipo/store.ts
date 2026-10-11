"use client";

import { useSyncExternalStore } from "react";
import catalogo from "../../../data/hsk-catalogo-1-3.json";
import leccionDemo from "../../../contenido/leccion-demo.json";
import type { Sense, Word } from "@/lib/lesson-types";

// Prototipo navegable de las vistas de admin y docente (ARQUITECTURA.md
// §4.1). Los datos viven solo en este navegador (localStorage) para poder
// recorrer el flujo antes de tener las tablas en Supabase. Cuando existan,
// estas funciones se sustituyen por acciones de servidor con la misma forma.

export type WordStatus = "curada" | "borrador" | "sin contenido";

export type ProtoWord = Word & {
  pinyin: string;
  meaningEn: string;
  status: WordStatus;
};

export type ProtoItem = { hanzi: string; senseIndex: number };
export type ProtoLesson = { id: string; title: string; items: ProtoItem[] };
export type ProtoCollection = {
  id: string;
  title: string;
  template: boolean;
  source?: string;
  copiedFrom?: string;
  lessons: ProtoLesson[];
};

type State = {
  // Solo las palabras que el admin ha tocado; el resto sale del catálogo.
  words: Record<string, ProtoWord>;
  collections: ProtoCollection[];
};

const KEY = "hanzi:prototipo:v1";
type CatalogEntry = { h: string; p: string; l: number; en: string };
const CATALOG = catalogo as CatalogEntry[];
const CURATED = leccionDemo.words as Word[];

const uid = () => Math.random().toString(36).slice(2, 10);

function catalogWord(e: CatalogEntry): ProtoWord {
  return {
    hanzi: e.h,
    hsk: e.l,
    pinyin: e.p,
    meaningEn: e.en,
    status: "sin contenido",
    senses: [
      { pinyin: e.p, category: "", meaning: { es: "", en: e.en }, sentences: [] },
    ],
  };
}

function curatedWord(w: Word): ProtoWord {
  const e = CATALOG.find((c) => c.h === w.hanzi);
  return {
    ...w,
    pinyin: w.senses[0]?.pinyin ?? e?.p ?? "",
    meaningEn: w.senses[0]?.meaning.en ?? e?.en ?? "",
    status: "curada",
  };
}

function initialState(): State {
  const hsk1 = CATALOG.filter((c) => c.l === 1);
  const chunks = Array.from({ length: Math.ceil(hsk1.length / 15) }, (_, i) => hsk1.slice(i * 15, i * 15 + 15));
  return {
    words: Object.fromEntries(CURATED.map((w) => [w.hanzi, curatedWord(w)])),
    collections: [
      {
        id: "plantilla-hsk1",
        title: "HSK 1",
        template: true,
        source: "Catálogo HSK 1 (150 palabras), en lecciones de 15",
        lessons: chunks.map((c, i) => ({
          id: `hsk1-l${i + 1}`,
          title: `Lección ${i + 1}`,
          items: c.map((e) => ({ hanzi: e.h, senseIndex: 0 })),
        })),
      },
      {
        id: "demo",
        title: "Mi clase (ejemplo)",
        template: false,
        lessons: [
          {
            id: "demo-l1",
            title: "Lección de demo",
            items: CURATED.map((w) => ({ hanzi: w.hanzi, senseIndex: 0 })),
          },
        ],
      },
    ],
  };
}

// ── Store externo ───────────────────────────────────────────────────────
const listeners = new Set<() => void>();
let cache: State | null = null;
const SERVER: State = { words: {}, collections: [] };

function read(): State {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as State) : initialState();
  } catch {
    cache = initialState();
  }
  return cache!;
}

function write(next: State) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function update(fn: (s: State) => State) {
  write(fn(read()));
}

export function usePrototype(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => SERVER,
  );
}

export const prototype = {
  reset: () => write(initialState()),

  // ── Palabras ──
  word(state: State, hanzi: string): ProtoWord | null {
    if (state.words[hanzi]) return state.words[hanzi];
    const e = CATALOG.find((c) => c.h === hanzi);
    return e ? catalogWord(e) : null;
  },
  allWords(state: State): ProtoWord[] {
    const extra = Object.values(state.words).filter((w) => !CATALOG.some((c) => c.h === w.hanzi));
    return [...CATALOG.map((e) => state.words[e.h] ?? catalogWord(e)), ...extra];
  },
  saveWord(word: ProtoWord) {
    update((s) => ({ ...s, words: { ...s.words, [word.hanzi]: word } }));
  },
  setStatus(state: State, hanzi: string, status: WordStatus) {
    const w = prototype.word(state, hanzi);
    if (w) prototype.saveWord({ ...w, status });
  },
  /** Descarta los cambios del admin: vuelve a la versión de la demo o del catálogo. */
  resetWord(hanzi: string) {
    update((s) => {
      const words = { ...s.words };
      const curated = CURATED.find((w) => w.hanzi === hanzi);
      if (curated) words[hanzi] = curatedWord(curated);
      else delete words[hanzi];
      return { ...s, words };
    });
  },

  // ── Colecciones ──
  createCollection(title: string, template: boolean): string {
    const id = uid();
    update((s) => ({
      ...s,
      collections: [...s.collections, { id, title, template, lessons: [] }],
    }));
    return id;
  },
  copyCollection(templateId: string): string {
    const id = uid();
    update((s) => {
      const t = s.collections.find((c) => c.id === templateId);
      if (!t) return s;
      const copy: ProtoCollection = {
        id,
        title: t.title,
        template: false,
        source: t.source,
        copiedFrom: t.id,
        lessons: t.lessons.map((l) => ({ ...l, id: uid(), items: l.items.map((i) => ({ ...i })) })),
      };
      return { ...s, collections: [...s.collections, copy] };
    });
    return id;
  },
  updateCollection(id: string, patch: Partial<Pick<ProtoCollection, "title" | "source">>) {
    update((s) => ({
      ...s,
      collections: s.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },
  deleteCollection(id: string) {
    update((s) => ({ ...s, collections: s.collections.filter((c) => c.id !== id) }));
  },

  // ── Lecciones ──
  addLesson(collectionId: string, title: string): string {
    const id = uid();
    update((s) => ({
      ...s,
      collections: s.collections.map((c) =>
        c.id === collectionId ? { ...c, lessons: [...c.lessons, { id, title, items: [] }] } : c,
      ),
    }));
    return id;
  },
  updateLesson(collectionId: string, lessonId: string, fn: (l: ProtoLesson) => ProtoLesson) {
    update((s) => ({
      ...s,
      collections: s.collections.map((c) =>
        c.id === collectionId ? { ...c, lessons: c.lessons.map((l) => (l.id === lessonId ? fn(l) : l)) } : c,
      ),
    }));
  },
  moveLesson(collectionId: string, lessonId: string, delta: number) {
    update((s) => ({
      ...s,
      collections: s.collections.map((c) => {
        if (c.id !== collectionId) return c;
        const i = c.lessons.findIndex((l) => l.id === lessonId);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= c.lessons.length) return c;
        const lessons = [...c.lessons];
        [lessons[i], lessons[j]] = [lessons[j], lessons[i]];
        return { ...c, lessons };
      }),
    }));
  },
  deleteLesson(collectionId: string, lessonId: string) {
    update((s) => ({
      ...s,
      collections: s.collections.map((c) =>
        c.id === collectionId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) } : c,
      ),
    }));
  },
};

// ── Búsqueda ────────────────────────────────────────────────────────────
const toneless = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "").toLowerCase();

export function searchWords(words: ProtoWord[], query: string, hsk: number | null): ProtoWord[] {
  const q = query.trim();
  const plain = toneless(q);
  return words.filter((w) => {
    if (hsk && w.hsk !== hsk) return false;
    if (!q) return true;
    return (
      w.hanzi.includes(q) ||
      toneless(w.pinyin).includes(plain) ||
      w.meaningEn.toLowerCase().includes(q.toLowerCase()) ||
      w.senses.some((s) => s.meaning.es.toLowerCase().includes(q.toLowerCase()))
    );
  });
}

/** Separa una lista pegada ("你 好\n吗，我") en hanzi; ignora números y signos. */
export function parsePastedList(text: string): string[] {
  return [...new Set(text.match(/\p{Script=Han}+/gu) ?? [])];
}

export type { Sense };
