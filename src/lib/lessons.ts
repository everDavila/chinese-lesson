import "server-only";

import lessonJson from "../../contenido/leccion-demo.json";
import { componentMeanings, readStrokes } from "./hanzi-data";
import type { CharacterInfo, Lesson, NoteTerm, Sense, Word } from "./lesson-types";
import { noteTermCandidates } from "./note-terms";
import { pickSentences } from "./rotation";
import { createClient } from "./supabase/server";
import { allPages, inChunks } from "./in-chunks";

// Lecciones de la profesora en Supabase. Devuelve los mismos tipos que la
// lección de demo local, así la presentación no distingue el origen.

type SentenceRow = {
  /** Ausente en las frases propias de la docente. */
  id?: string;
  /** Clave para la rotación: 's:<id>' (base) o 't:<id>' (de la docente). */
  key?: string;
  position: number;
  zh: string;
  pinyin: string;
  translation_es: string | null;
  translation_en: string | null;
  status: "unreviewed" | "reviewed" | "corrected";
};
type SenseRow = {
  id: string;
  position: number;
  pinyin: string;
  category: string | null;
  meaning_es: string | null;
  meaning_en: string | null;
  nuance_es: string | null;
  nuance_en: string | null;
  sentences: SentenceRow[];
};
type WordRow = {
  hanzi: string;
  hsk_level: number | null;
  cultural_note_es: string | null;
  cultural_note_en: string | null;
  senses: SenseRow[];
};
type CharacterRow = {
  char: string;
  pinyin: string[];
  radical: string | null;
  decomposition: string | null;
  components: CharacterInfo["components"];
  etymology: CharacterInfo["etymology"];
  stroke_roles: CharacterInfo["strokeRoles"];
};

export type LessonSummary = { id: string; title: string; created_at: string; items: number };

/** Id de la profesora con sesión iniciada, o null. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

export async function listLessons(): Promise<LessonSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, created_at, lesson_items(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    created_at: l.created_at,
    items: (l.lesson_items as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

/** Crea la lección de demo con el primer sentido de cada palabra del seed. */
export async function createDemoLesson(teacherId: string): Promise<string> {
  const supabase = await createClient();
  const hanzi = lessonJson.words.map((w) => w.hanzi);

  const { data: senses, error: sensesError } = await supabase
    .from("senses")
    .select("id, position, words!inner(hanzi)")
    .eq("position", 1)
    .in("words.hanzi", hanzi);
  if (sensesError) throw sensesError;

  const byHanzi = new Map(
    (senses ?? []).map((s) => [(s.words as unknown as { hanzi: string }).hanzi, s.id as string]),
  );
  const missing = hanzi.filter((h) => !byHanzi.has(h));
  if (missing.length) throw new Error(`Faltan en la base: ${missing.join(" ")}. ¿Se aplicó el seed?`);

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .insert({ teacher_id: teacherId, title: lessonJson.lesson.title })
    .select("id")
    .single();
  if (lessonError) throw lessonError;

  const { error: itemsError } = await supabase.from("lesson_items").insert(
    hanzi.map((h, i) => ({ lesson_id: lesson.id, sense_id: byHanzi.get(h), position: i + 1 })),
  );
  if (itemsError) throw itemsError;
  return lesson.id;
}

function toWord(row: WordRow): Word {
  const bilingual = (es: string | null, en: string | null) =>
    es || en ? { es: es ?? "", en: en ?? "" } : undefined;
  return {
    hanzi: row.hanzi,
    hsk: row.hsk_level ?? 0,
    culturalNote: bilingual(row.cultural_note_es, row.cultural_note_en),
    senses: [...row.senses]
      .sort((a, b) => a.position - b.position)
      .map(
        (s): Sense => ({
          pinyin: s.pinyin,
          category: s.category ?? "",
          meaning: { es: s.meaning_es ?? "", en: s.meaning_en ?? "" },
          nuance: bilingual(s.nuance_es, s.nuance_en),
          sentences: [...s.sentences]
            .sort((a, b) => a.position - b.position)
            .map((t) => ({
              key: t.key ?? (t.id ? `s:${t.id}` : undefined),
              zh: t.zh,
              pinyin: t.pinyin,
              es: t.translation_es ?? "",
              en: t.translation_en ?? "",
              status: t.status,
            })),
        }),
      ),
  };
}

const WORD_SELECT = `hanzi, hsk_level, cultural_note_es, cultural_note_en,
  senses(id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en,
    sentences(id, position, zh, pinyin, translation_es, translation_en, status))`;

type OwnExample = {
  id: string;
  sense_id: string;
  zh: string;
  pinyin: string | null;
  translation_es: string | null;
  translation_en: string | null;
  based_on_sentence_id: string | null;
};

// Las frases de la docente en sus clases: una copia editada ocupa el lugar
// de la original; las nuevas van al final; las originales que ocultó no
// salen. Las aceptadas ya son originales y no se repiten.
async function withTeacherSentences(rows: WordRow[]): Promise<WordRow[]> {
  const supabase = await createClient();
  const senseIds = rows.flatMap((w) => w.senses.map((s) => s.id));
  if (!senseIds.length) return rows;
  const [mine, { data: hidden }] = await Promise.all([
    inChunks(senseIds, (part) =>
      supabase
        .from("teacher_examples")
        .select("id, sense_id, zh, pinyin, translation_es, translation_en, based_on_sentence_id, created_at")
        .in("sense_id", part)
        .neq("status", "accepted"),
    ).then((rows) => rows.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))),
    supabase.from("teacher_hidden_sentences").select("sentence_id"),
  ]);
  if (!mine?.length && !hidden?.length) return rows;
  const hiddenIds = new Set((hidden ?? []).map((h) => h.sentence_id as string));
  const own = (mine ?? []) as OwnExample[];
  const asRow = (e: OwnExample, position: number): SentenceRow => ({
    key: `t:${e.id}`,
    position,
    zh: e.zh,
    pinyin: e.pinyin ?? "",
    translation_es: e.translation_es,
    translation_en: e.translation_en,
    status: "unreviewed",
  });
  return rows.map((w) => ({
    ...w,
    senses: w.senses.map((s) => {
      const ownHere = own.filter((e) => e.sense_id === s.id);
      const originalIds = new Set(s.sentences.map((t) => t.id));
      const sentences = [...s.sentences]
        .sort((a, b) => a.position - b.position)
        .flatMap((t) => {
          const copy = ownHere.find((e) => e.based_on_sentence_id === t.id);
          if (copy) return [asRow(copy, t.position)];
          return t.id && hiddenIds.has(t.id) ? [] : [t];
        });
      const extra = ownHere.filter((e) => !e.based_on_sentence_id || !originalIds.has(e.based_on_sentence_id));
      return { ...s, sentences: [...sentences, ...extra.map((e, i) => asRow(e, 1000 + i))] };
    }),
  }));
}

async function buildLesson(title: string, items: { senseId: string; word: WordRow }[]): Promise<Lesson> {
  const supabase = await createClient();
  const chars = [...new Set(items.flatMap((it) => [...it.word.hanzi]))];
  const noteCandidates = noteTermCandidates(items.flatMap(({ word }) => [
    word.cultural_note_es,
    word.cultural_note_en,
    ...word.senses.flatMap((sense) => [sense.nuance_es, sense.nuance_en]),
  ]));
  // En tandas: una clase de un nivel completo pasa del largo de URL de PostgREST.
  const [charRows, noteRows] = await Promise.all([
    inChunks(chars, (part) =>
      supabase.from("characters").select("char, pinyin, radical, decomposition, components, etymology, stroke_roles").in("char", part),
    ),
    inChunks(noteCandidates, (part) =>
      supabase.from("words").select("hanzi, senses(position, pinyin, meaning_es, meaning_en)").in("hanzi", part),
    ),
  ]);
  const charInfo = new Map(
    (charRows as CharacterRow[]).map((c) => [
      c.char,
      {
        pinyin: c.pinyin,
        radical: c.radical,
        decomposition: c.decomposition ?? "",
        components: c.components,
        etymology: c.etymology,
        strokeRoles: c.stroke_roles,
      } satisfies CharacterInfo,
    ]),
  );
  const noteTerms = Object.fromEntries((noteRows ?? []).flatMap((row) => {
    const firstSense = [...row.senses].sort((a, b) => a.position - b.position)[0];
    if (!firstSense) return [];
    const term: NoteTerm = {
      hanzi: row.hanzi,
      pinyin: firstSense.pinyin,
      meaning: { es: firstSense.meaning_es ?? "", en: firstSense.meaning_en ?? "" },
    };
    return [[row.hanzi, term]];
  }));

  return {
    title,
    items: items.map(({ senseId, word }) => {
      const sortedSenseIds = [...word.senses].sort((a, b) => a.position - b.position).map((s) => s.id);
      return {
        senseId,
        word: toWord(word),
        senseIndex: Math.max(0, sortedSenseIds.indexOf(senseId)),
        characters: [...word.hanzi].map((char) => ({
          char,
          info: charInfo.get(char) ?? null,
          strokes: readStrokes(char),
        })),
      };
    }),
    componentMeanings: componentMeanings(),
    noteTerms,
  };
}

/**
 * Carga una lección para presentarla (RLS: las de la docente y las de
 * plantillas), con sus frases propias. Las palabras sin ninguna frase se
 * quedan fuera: una tarjeta vacía no sirve en clase. null si no existe.
 */
type ItemRow = { position: number; sense_id: string; senses: { words: WordRow } };

/** Ítems de una lección en orden, con su palabra; paginados (más de 1000 en un nivel completo). */
async function lessonItems(lessonId: string): Promise<ItemRow[]> {
  const supabase = await createClient();
  const rows = await allPages((from, to) =>
    supabase
      .from("lesson_items")
      .select(`position, sense_id, senses(words(${WORD_SELECT}))`)
      .eq("lesson_id", lessonId)
      .order("position")
      .range(from, to),
  );
  return rows as unknown as ItemRow[];
}

export async function getLesson(lessonId: string, opts: { sessionId?: string } = {}): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase.from("lessons").select("title").eq("id", lessonId).maybeSingle();
  if (error) throw error;
  if (!lesson) return null;
  const rows = await lessonItems(lessonId);
  let words = await withTeacherSentences(rows.map((r) => r.senses.words));
  if (opts.sessionId) words = await onlyChosen(opts.sessionId, rows.map((r) => r.sense_id), words);
  const items = rows
    .map((r, i) => ({ senseId: r.sense_id, word: words[i] }))
    // Las palabras sin frases también se presentan (solo significado, pinyin y trazos).
    .filter(({ senseId, word }) => word.senses.some((s) => s.id === senseId));
  return buildLesson(lesson.title, items);
}

const keyOf = (t: SentenceRow) => t.key ?? (t.id ? `s:${t.id}` : "");

// En una clase en vivo, cada sentido muestra solo las frases elegidas al
// abrirla, en ese orden. Sin elección guardada (sesiones anteriores a la
// rotación, o frases que ya no existen), se muestran todas.
async function onlyChosen(sessionId: string, senseIds: string[], words: WordRow[]): Promise<WordRow[]> {
  const supabase = await createClient();
  const data = await allPages((from, to) =>
    supabase
      .from("session_sentences")
      .select("sense_id, sentence_key, position")
      .eq("session_id", sessionId)
      .order("sense_id")
      .order("position")
      .range(from, to),
  );
  const chosen = new Map<string, string[]>();
  for (const r of data ?? []) chosen.set(r.sense_id, [...(chosen.get(r.sense_id) ?? []), r.sentence_key]);
  return words.map((w, i) => ({
    ...w,
    senses: w.senses.map((s) => {
      const keys = s.id === senseIds[i] ? chosen.get(s.id) : undefined;
      if (!keys) return s;
      const picked = keys.flatMap((k) => s.sentences.filter((t) => keyOf(t) === k));
      return picked.length ? { ...s, sentences: picked } : s;
    }),
  }));
}

/**
 * Al abrir una clase, elige las frases de cada palabra (src/lib/rotation.ts)
 * y las guarda con la sesión: cuántas dice la lección o, si no, su
 * colección; primero las que esta clase no ha visto.
 */
export async function chooseSessionSentences(sessionId: string, lessonId: string): Promise<void> {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("examples_shown, collections(examples_shown)")
    .eq("id", lessonId)
    .single();
  if (error) throw error;
  const setting = lesson.examples_shown ?? (lesson.collections as unknown as { examples_shown: number } | null)?.examples_shown ?? 0;
  const count = setting === 0 ? null : setting;

  const rows = await lessonItems(lessonId);
  const senseIds = rows.map((r) => r.sense_id);
  const words = await withTeacherSentences(rows.map((r) => r.senses.words));

  const { data: history, error: historyError } = await allPages<{ sense_id: string; sentence_key: string; last_shown: string }>((from, to) =>
    supabase.rpc("sentence_history", { lesson: lessonId, senses: senseIds }).order("sense_id").order("sentence_key").range(from, to),
  ).then((data) => ({ data, error: null }), (e: unknown) => ({ data: null, error: e }));
  if (historyError) throw historyError;
  const lastSeen = new Map<string, Map<string, number>>();
  for (const h of (history ?? []) as { sense_id: string; sentence_key: string; last_shown: string }[]) {
    const m = lastSeen.get(h.sense_id) ?? new Map<string, number>();
    m.set(h.sentence_key, Date.parse(h.last_shown));
    lastSeen.set(h.sense_id, m);
  }

  const toInsert = rows.flatMap((r, i) => {
    const sense = words[i].senses.find((s) => s.id === r.sense_id);
    const candidates = [...(sense?.sentences ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((t) => ({ key: keyOf(t) }))
      .filter((c) => c.key);
    return pickSentences(candidates, lastSeen.get(r.sense_id) ?? new Map(), count).map((c, position) => ({
      session_id: sessionId,
      sense_id: r.sense_id,
      sentence_key: c.key,
      position: position + 1,
    }));
  });
  if (!toInsert.length) return;
  const { error: insertError } = await supabase.from("session_sentences").insert(toInsert);
  if (insertError) throw insertError;
}

/** Vista previa del admin: una tarjeta por cada sentido de la palabra. */
export async function getWordPreview(hanzi: string): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("words").select(WORD_SELECT).eq("hanzi", hanzi).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const word = data as unknown as WordRow;
  const senses = [...word.senses].sort((a, b) => a.position - b.position);
  return buildLesson(hanzi, senses.map((s) => ({ senseId: s.id, word })));
}
