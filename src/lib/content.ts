import "server-only";

import { createClient } from "./supabase/server";

// Lecturas de las vistas de admin y docente: catálogo, colecciones y frases.
// Las escrituras van en src/actions/manage.ts. RLS decide qué ve cada cuenta.

export type Role = "teacher" | "reviewer" | "admin";
export type Profile = { id: string; displayName: string; role: Role };

/** Perfil con sesión iniciada, o null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  if (!id) return null;
  const { data: p } = await supabase.from("profiles").select("display_name, role").eq("id", id).maybeSingle();
  return { id, displayName: p?.display_name ?? "", role: (p?.role as Role) ?? "teacher" };
}

// ── Catálogo ────────────────────────────────────────────────────────────
// "curada": revisada por el admin. "borrador": tiene algo de contenido
// (significado en español o frases) sin revisar. "sin contenido": solo lo
// que trae el temario.
export type WordStatus = "curada" | "borrador" | "sin contenido";

export type SenseSummary = {
  id: string;
  pinyin: string;
  category: string;
  meaningEs: string;
  meaningEn: string;
  sentences: number;
};
export type WordSummary = { id: string; hanzi: string; hsk: number; status: WordStatus; senses: SenseSummary[] };

type SummaryRow = {
  id: string;
  hanzi: string;
  hsk_level: number | null;
  status: "unreviewed" | "reviewed" | "corrected";
  senses: {
    id: string;
    position: number;
    pinyin: string;
    category: string | null;
    meaning_es: string | null;
    meaning_en: string | null;
    sentences: { count: number }[];
  }[];
};

// La misma regla que search_words en la base.
function wordStatus(row: SummaryRow): WordStatus {
  if (row.status !== "unreviewed") return "curada";
  return row.senses.some((s) => s.meaning_es || s.sentences[0]?.count) ? "borrador" : "sin contenido";
}

export type WordSearch = {
  /** Cuántas palabras cumplen los filtros (rows trae como mucho `limit`). */
  total: number;
  rows: WordSummary[];
  /** Conteos de toda la base, para los filtros. */
  levels: Record<string, number>;
  statuses: Partial<Record<WordStatus, number>>;
};

/**
 * Busca en el catálogo (≈11 000 palabras con HSK 3.0 completo) dentro de la
 * base: hanzi, pinyin sin tonos o significado, con filtros de nivel y estado.
 * Función search_words (migración 20261012030000): ordena por relevancia.
 */
export async function searchWords({
  query = "",
  levels = [],
  statuses = [],
  limit = 40,
}: {
  query?: string;
  levels?: number[];
  statuses?: WordStatus[];
  limit?: number;
}): Promise<WordSearch> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_words", { q: query, levels, statuses, lim: limit });
  if (error) throw error;
  const r = data as Omit<WordSearch, "rows"> & { rows: (Omit<WordSummary, "hsk"> & { hsk: number | null })[] };
  return { ...r, rows: r.rows.map((w) => ({ ...w, hsk: w.hsk ?? 0 })) };
}

/** Los hanzi de una lista pegada que están en el catálogo, con su primer sentido. */
export async function lookupWords(hanzi: string[]): Promise<{ hanzi: string; senseId: string }[]> {
  if (!hanzi.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select("hanzi, senses(id, position)")
    .in("hanzi", hanzi.slice(0, 300));
  if (error) throw error;
  return data.flatMap((w) => {
    const first = [...w.senses].sort((a, b) => a.position - b.position)[0];
    return first ? [{ hanzi: w.hanzi, senseId: first.id }] : [];
  });
}

// ── Palabra completa (editor del admin) ─────────────────────────────────
export type EditableSentence = { id?: string; zh: string; pinyin: string; es: string; en: string };
export type EditableSense = {
  id?: string;
  pinyin: string;
  category: string;
  meaningEs: string;
  meaningEn: string;
  nuanceEs: string;
  nuanceEn: string;
  sentences: EditableSentence[];
};
export type EditableWord = {
  id: string;
  hanzi: string;
  hsk: number;
  published: boolean;
  culturalNoteEs: string;
  culturalNoteEn: string;
  senses: EditableSense[];
};

export async function getEditableWord(hanzi: string): Promise<EditableWord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select(
      `id, hanzi, hsk_level, status, cultural_note_es, cultural_note_en,
       senses(id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en,
         sentences(id, position, zh, pinyin, translation_es, translation_en))`,
    )
    .eq("hanzi", hanzi)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  type S = { id: string; position: number; zh: string; pinyin: string; translation_es: string | null; translation_en: string | null };
  type Se = {
    id: string;
    position: number;
    pinyin: string;
    category: string | null;
    meaning_es: string | null;
    meaning_en: string | null;
    nuance_es: string | null;
    nuance_en: string | null;
    sentences: S[];
  };
  return {
    id: data.id,
    hanzi: data.hanzi,
    hsk: data.hsk_level ?? 0,
    published: data.status !== "unreviewed",
    culturalNoteEs: data.cultural_note_es ?? "",
    culturalNoteEn: data.cultural_note_en ?? "",
    senses: [...(data.senses as Se[])]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        pinyin: s.pinyin,
        category: s.category ?? "",
        meaningEs: s.meaning_es ?? "",
        meaningEn: s.meaning_en ?? "",
        nuanceEs: s.nuance_es ?? "",
        nuanceEn: s.nuance_en ?? "",
        sentences: [...s.sentences]
          .sort((a, b) => a.position - b.position)
          .map((t) => ({ id: t.id, zh: t.zh, pinyin: t.pinyin, es: t.translation_es ?? "", en: t.translation_en ?? "" })),
      })),
  };
}

// ── Colecciones ─────────────────────────────────────────────────────────
export type LessonSummary = { id: string; title: string; position: number; hanzi: string[] };
export type CollectionSummary = {
  id: string;
  title: string;
  template: boolean;
  source: string;
  copiedFrom: string | null;
  /** Frases por palabra en clase; 0 = todas. */
  examplesShown: number;
  lessons: LessonSummary[];
};

type CollectionRow = {
  id: string;
  title: string;
  owner_id: string | null;
  source_note: string | null;
  copied_from: string | null;
  examples_shown: number;
  lessons: { id: string; title: string; position: number | null; lesson_items: { position: number; senses: { words: { hanzi: string } } }[] }[];
};
const COLLECTION_SELECT =
  "id, title, owner_id, source_note, copied_from, examples_shown, lessons(id, title, position, lesson_items(position, senses(words(hanzi))))";

function toCollection(c: CollectionRow): CollectionSummary {
  return {
    id: c.id,
    title: c.title,
    template: c.owner_id === null,
    source: c.source_note ?? "",
    copiedFrom: c.copied_from,
    examplesShown: c.examples_shown,
    lessons: [...c.lessons]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((l) => ({
        id: l.id,
        title: l.title,
        position: l.position ?? 0,
        hanzi: [...l.lesson_items].sort((a, b) => a.position - b.position).map((i) => i.senses.words.hanzi),
      })),
  };
}

/** Una colección en una lista: solo los totales. */
export type CollectionListItem = Omit<CollectionSummary, "lessons" | "examplesShown"> & { lessons: number; words: number };

/**
 * Plantillas (de todos) o las colecciones propias. Solo cuenta lecciones y
 * palabras: traer los hanzi de las 68 lecciones de plantilla tardaba 0,8 s.
 */
export async function listCollections(kind: "mine" | "templates"): Promise<CollectionListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("collections")
    .select("id, title, owner_id, source_note, copied_from, lessons(lesson_items(count))")
    .order("created_at");
  if (kind === "templates") query = query.is("owner_id", null);
  else {
    const { data } = await supabase.auth.getClaims();
    query = query.eq("owner_id", data?.claims.sub ?? "");
  }
  const { data, error } = await query;
  if (error) throw error;
  type Row = Omit<CollectionRow, "lessons"> & { lessons: { lesson_items: { count: number }[] }[] };
  return (data as unknown as Row[]).map((c) => ({
    id: c.id,
    title: c.title,
    template: c.owner_id === null,
    source: c.source_note ?? "",
    copiedFrom: c.copied_from,
    lessons: c.lessons.length,
    words: c.lessons.reduce((n, l) => n + (l.lesson_items[0]?.count ?? 0), 0),
  }));
}

export async function getCollection(id: string): Promise<CollectionSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("collections").select(COLLECTION_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toCollection(data as unknown as CollectionRow) : null;
}

/** Lecciones antiguas sin colección (la lección de demo de la fase 1). */
export async function listLooseLessons(): Promise<{ id: string; title: string; items: number }[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, lesson_items(count)")
    .is("collection_id", null)
    .eq("teacher_id", claims?.claims.sub ?? "")
    .order("created_at");
  if (error) throw error;
  return data.map((l) => ({ id: l.id, title: l.title, items: (l.lesson_items as { count: number }[])[0]?.count ?? 0 }));
}

/** Lecciones de la docente para retomar su preparación desde el inicio. */
export async function listTeacherLessons(): Promise<
  { id: string; title: string; collectionId: string; collectionTitle: string; items: number; updatedAt: string }[]
> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, collection_id, updated_at, collections(title), lesson_items(count)")
    .eq("teacher_id", claims?.claims.sub ?? "")
    .not("collection_id", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    collectionId: lesson.collection_id as string,
    collectionTitle: (lesson.collections as unknown as { title: string }).title,
    items: (lesson.lesson_items as { count: number }[])[0]?.count ?? 0,
    updatedAt: lesson.updated_at,
  }));
}

export type TeacherPin =
  | { kind: "lesson"; id: string; title: string; collectionId: string; collectionTitle: string; items: number }
  | { kind: "collection"; id: string; title: string; lessons: number; words: number };

/** Accesos fijados por la docente, resueltos contra su material real. */
export async function listTeacherPins(): Promise<TeacherPin[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const teacherId = claims?.claims.sub ?? "";
  const [{ data: pins, error }, lessons, collections] = await Promise.all([
    supabase.from("teacher_pins").select("lesson_id, collection_id, created_at").eq("teacher_id", teacherId).order("created_at"),
    listTeacherLessons(),
    listCollections("mine"),
  ]);
  if (error) throw error;
  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const collectionsById = new Map(collections.map((collection) => [collection.id, collection]));
  const result: TeacherPin[] = [];
  for (const pin of pins ?? []) {
    if (pin.lesson_id) {
      const lesson = lessonsById.get(pin.lesson_id);
      if (lesson) result.push({ kind: "lesson", ...lesson });
      continue;
    }
    const collection = pin.collection_id ? collectionsById.get(pin.collection_id) : undefined;
    if (collection) result.push({ kind: "collection", ...collection });
  }
  return result;
}

// ── Lección (editor) ────────────────────────────────────────────────────
export type LessonItemRow = {
  senseId: string;
  position: number;
  hanzi: string;
  hsk: number;
  status: WordStatus;
  senses: SenseSummary[];
  /** Frases que verá la clase: originales no ocultas + las de la docente. */
  classSentences: number;
};
export type EditableLesson = {
  id: string;
  title: string;
  collectionId: string | null;
  template: boolean;
  /** Frases por palabra en esta lección; null = como la colección; 0 = todas. */
  examplesShown: number | null;
  /** Lo que dice la colección (0 = todas). */
  collectionExamplesShown: number;
  items: LessonItemRow[];
};

export async function getEditableLesson(id: string): Promise<EditableLesson | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      `id, title, collection_id, teacher_id, examples_shown, collections(examples_shown),
       lesson_items(position, sense_id,
         senses(words(id, hanzi, hsk_level, status,
           senses(id, position, pinyin, category, meaning_es, meaning_en, sentences(id)))))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  type Row = {
    position: number;
    sense_id: string;
    senses: {
      words: Omit<SummaryRow, "senses"> & { senses: (Omit<SummaryRow["senses"][number], "sentences"> & { sentences: { id: string }[] })[] };
    };
  };
  const rows = [...(data.lesson_items as unknown as Row[])].sort((a, b) => a.position - b.position);
  const own = await ownSentenceCounts(rows.map((r) => r.sense_id));

  return {
    id: data.id,
    title: data.title,
    collectionId: data.collection_id,
    template: data.teacher_id === null,
    examplesShown: data.examples_shown,
    collectionExamplesShown: (data.collections as unknown as { examples_shown: number } | null)?.examples_shown ?? 0,
    items: rows.map((r) => {
      const w = r.senses.words;
      const senses = [...w.senses].sort((a, b) => a.position - b.position);
      const current = senses.find((s) => s.id === r.sense_id);
      const originals = (current?.sentences ?? []).filter((t) => !own.hidden.has(t.id) && !own.replaced.has(t.id)).length;
      return {
        senseId: r.sense_id,
        position: r.position,
        hanzi: w.hanzi,
        hsk: w.hsk_level ?? 0,
        status: wordStatus({ ...w, senses: senses.map((s) => ({ ...s, sentences: [{ count: s.sentences.length }] })) }),
        senses: senses.map((s) => ({
          id: s.id,
          pinyin: s.pinyin,
          category: s.category ?? "",
          meaningEs: s.meaning_es ?? "",
          meaningEn: s.meaning_en ?? "",
          sentences: s.sentences.length,
        })),
        classSentences: originals + (own.bySense.get(r.sense_id) ?? 0),
      };
    }),
  };
}

// Frases propias de la docente con sesión (RLS: solo las suyas). Las
// aceptadas ya son originales: no se cuentan dos veces.
async function ownSentenceCounts(senseIds: string[]) {
  const supabase = await createClient();
  const [{ data: mine }, { data: hidden }] = await Promise.all([
    supabase.from("teacher_examples").select("sense_id, based_on_sentence_id, status").in("sense_id", senseIds).neq("status", "accepted"),
    supabase.from("teacher_hidden_sentences").select("sentence_id"),
  ]);
  const bySense = new Map<string, number>();
  for (const e of mine ?? []) bySense.set(e.sense_id, (bySense.get(e.sense_id) ?? 0) + 1);
  return {
    bySense,
    replaced: new Set((mine ?? []).map((e) => e.based_on_sentence_id).filter(Boolean) as string[]),
    hidden: new Set((hidden ?? []).map((h) => h.sentence_id as string)),
  };
}

// ── Frases de un sentido (pantalla de la docente) ───────────────────────
export type ExampleStatus = "draft" | "submitted" | "accepted" | "rejected";
export type OriginalSentence = { id: string; zh: string; pinyin: string; es: string; en: string; hidden: boolean };
export type OwnSentence = {
  id: string;
  zh: string;
  pinyin: string;
  es: string;
  en: string;
  status: ExampleStatus;
  basedOn: string | null;
  reviewNote: string;
};
export type SenseExamples = {
  senseId: string;
  hanzi: string;
  hsk: number;
  pinyin: string;
  meaningEs: string;
  meaningEn: string;
  originals: OriginalSentence[];
  own: OwnSentence[];
};

export async function getSenseExamples(senseId: string): Promise<SenseExamples | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("senses")
    .select("id, pinyin, meaning_es, meaning_en, words(hanzi, hsk_level), sentences(id, position, zh, pinyin, translation_es, translation_en)")
    .eq("id", senseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [{ data: mine }, { data: hidden }] = await Promise.all([
    supabase
      .from("teacher_examples")
      .select("id, zh, pinyin, translation_es, translation_en, status, based_on_sentence_id, review_note")
      .eq("sense_id", senseId)
      .order("created_at"),
    supabase.from("teacher_hidden_sentences").select("sentence_id"),
  ]);
  const hiddenIds = new Set((hidden ?? []).map((h) => h.sentence_id as string));
  const word = data.words as unknown as { hanzi: string; hsk_level: number | null };
  type T = { id: string; position: number; zh: string; pinyin: string; translation_es: string | null; translation_en: string | null };
  return {
    senseId: data.id,
    hanzi: word.hanzi,
    hsk: word.hsk_level ?? 0,
    pinyin: data.pinyin,
    meaningEs: data.meaning_es ?? "",
    meaningEn: data.meaning_en ?? "",
    originals: [...(data.sentences as T[])]
      .sort((a, b) => a.position - b.position)
      .map((t) => ({
        id: t.id,
        zh: t.zh,
        pinyin: t.pinyin,
        es: t.translation_es ?? "",
        en: t.translation_en ?? "",
        hidden: hiddenIds.has(t.id),
      })),
    own: (mine ?? []).map((e) => ({
      id: e.id,
      zh: e.zh,
      pinyin: e.pinyin ?? "",
      es: e.translation_es ?? "",
      en: e.translation_en ?? "",
      status: e.status as ExampleStatus,
      basedOn: e.based_on_sentence_id,
      reviewNote: e.review_note ?? "",
    })),
  };
}

// ── Sugerencias pendientes (admin) ──────────────────────────────────────
export type Suggestion = {
  id: string;
  teacher: string;
  hanzi: string;
  hsk: number;
  senseMeaning: string;
  zh: string;
  pinyin: string;
  es: string;
  en: string;
  original: { zh: string; pinyin: string } | null;
  createdAt: string;
};

export async function listSuggestions(): Promise<Suggestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_examples")
    .select(
      `id, zh, pinyin, translation_es, translation_en, updated_at,
       profiles!teacher_examples_teacher_id_fkey(display_name),
       senses(meaning_es, meaning_en, words(hanzi, hsk_level)),
       original:sentences!teacher_examples_based_on_sentence_id_fkey(zh, pinyin)`,
    )
    .eq("status", "submitted")
    .order("updated_at");
  if (error) throw error;
  type Row = {
    id: string;
    zh: string;
    pinyin: string | null;
    translation_es: string | null;
    translation_en: string | null;
    updated_at: string;
    profiles: { display_name: string } | null;
    senses: { meaning_es: string | null; meaning_en: string | null; words: { hanzi: string; hsk_level: number | null } };
    original: { zh: string; pinyin: string } | null;
  };
  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    teacher: r.profiles?.display_name ?? "",
    hanzi: r.senses.words.hanzi,
    hsk: r.senses.words.hsk_level ?? 0,
    senseMeaning: r.senses.meaning_es || r.senses.meaning_en || "",
    zh: r.zh,
    pinyin: r.pinyin ?? "",
    es: r.translation_es ?? "",
    en: r.translation_en ?? "",
    original: r.original,
    createdAt: r.updated_at,
  }));
}
