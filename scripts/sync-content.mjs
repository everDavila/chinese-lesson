// Lleva a Supabase los cambios de una lección del repo (palabras, sentidos y
// frases) sin pisar lo curado: solo actualiza filas con status 'unreviewed'.
// Inserta lo que falte. Usa la clave secreta de .env.local (solo servidor).
// Uso:
//   node --env-file=.env.local scripts/sync-content.mjs [contenido/leccion-demo.json] [--dry]
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const lessonPath = args.find((a) => !a.startsWith("--")) ?? "contenido/leccion-demo.json";
const lesson = JSON.parse(readFileSync(lessonPath, "utf8"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  process.exit(1);
}

async function api(path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const enc = encodeURIComponent;
const stats = { updated: 0, inserted: 0, skipped: [] };

// Actualiza una fila solo si nadie la ha revisado; si no existe, la crea.
async function upsertRow(table, match, existing, values, label) {
  if (existing && existing.status !== "unreviewed") {
    stats.skipped.push(`${label} (${existing.status})`);
    return existing;
  }
  if (dry) {
    stats[existing ? "updated" : "inserted"]++;
    return existing ?? { id: `nuevo:${label}` };
  }
  if (existing) {
    const [row] = await api(`${table}?id=eq.${existing.id}`, {
      method: "PATCH",
      body: values,
      prefer: "return=representation",
    });
    stats.updated++;
    return row;
  }
  const [row] = await api(table, { method: "POST", body: { ...match, ...values }, prefer: "return=representation" });
  stats.inserted++;
  return row;
}

for (const w of lesson.words) {
  const [word] = await api(`words?select=id,status&hanzi=eq.${enc(w.hanzi)}`);
  const wordRow = await upsertRow(
    "words",
    { hanzi: w.hanzi },
    word,
    {
      hsk_level: w.hsk,
      hsk_version: lesson.lesson.hskVersion,
      cultural_note_es: w.culturalNote?.es ?? null,
      cultural_note_en: w.culturalNote?.en ?? null,
    },
    w.hanzi,
  );
  if (String(wordRow.id).startsWith("nuevo:")) continue;

  for (const [i, s] of w.senses.entries()) {
    const position = i + 1;
    const [sense] = await api(`senses?select=id,status&word_id=eq.${wordRow.id}&position=eq.${position}`);
    const senseRow = await upsertRow(
      "senses",
      { word_id: wordRow.id, position },
      sense,
      {
        pinyin: s.pinyin,
        category: s.category,
        meaning_es: s.meaning.es,
        meaning_en: s.meaning.en,
        nuance_es: s.nuance?.es ?? null,
        nuance_en: s.nuance?.en ?? null,
      },
      `${w.hanzi} sentido ${position}`,
    );
    if (String(senseRow.id).startsWith("nuevo:")) continue;

    for (const [j, t] of s.sentences.entries()) {
      const pos = j + 1;
      const [sentence] = await api(`sentences?select=id,status&sense_id=eq.${senseRow.id}&position=eq.${pos}`);
      await upsertRow(
        "sentences",
        { sense_id: senseRow.id, position: pos },
        sentence,
        { zh: t.zh, pinyin: t.pinyin, translation_es: t.es, translation_en: t.en },
        `${w.hanzi} ${position}.${pos}`,
      );
    }
  }
}

console.log(
  `${dry ? "[simulación] " : ""}${stats.updated} actualizadas, ${stats.inserted} nuevas` +
    (stats.skipped.length ? `, ${stats.skipped.length} respetadas por estar revisadas: ${stats.skipped.join(", ")}` : ""),
);
