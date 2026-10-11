import "server-only";

import lessonJson from "../../contenido/leccion-demo.json";
import { componentMeanings, readStrokes } from "./hanzi-data";
import type { CharacterInfo, Lesson, Sense, Word } from "./lesson-types";
import { createClient } from "./supabase/server";

// Lecciones de la profesora en Supabase. Devuelve los mismos tipos que la
// lección de demo local, así la presentación no distingue el origen.

type SentenceRow = {
  /** Ausente en las frases propias de la docente. */
  id?: string;
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
  const [{ data: mine }, { data: hidden }] = await Promise.all([
    supabase
      .from("teacher_examples")
      .select("sense_id, zh, pinyin, translation_es, translation_en, based_on_sentence_id")
      .in("sense_id", senseIds)
      .neq("status", "accepted")
      .order("created_at"),
    supabase.from("teacher_hidden_sentences").select("sentence_id"),
  ]);
  if (!mine?.length && !hidden?.length) return rows;
  const hiddenIds = new Set((hidden ?? []).map((h) => h.sentence_id as string));
  const own = (mine ?? []) as OwnExample[];
  const asRow = (e: OwnExample, position: number): SentenceRow => ({
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
  const { data: charRows, error: charError } = await supabase
    .from("characters")
    .select("char, pinyin, radical, decomposition, components, etymology, stroke_roles")
    .in("char", chars);
  if (charError) throw charError;
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
  };
}

/**
 * Carga una lección para presentarla (RLS: las de la docente y las de
 * plantillas), con sus frases propias. Las palabras sin ninguna frase se
 * quedan fuera: una tarjeta vacía no sirve en clase. null si no existe.
 */
export async function getLesson(lessonId: string): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(`title, lesson_items(position, sense_id, senses(words(${WORD_SELECT})))`)
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  if (!lesson) return null;

  type ItemRow = { position: number; sense_id: string; senses: { words: WordRow } };
  const rows = [...(lesson.lesson_items as unknown as ItemRow[])].sort((a, b) => a.position - b.position);
  const words = await withTeacherSentences(rows.map((r) => r.senses.words));
  const items = rows
    .map((r, i) => ({ senseId: r.sense_id, word: words[i] }))
    .filter(({ senseId, word }) => word.senses.find((s) => s.id === senseId)?.sentences.length);
  return buildLesson(lesson.title, items);
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
