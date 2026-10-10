// Genera supabase/seed.sql con el contenido compartido de una lección:
// caracteres, palabras, sentidos y frases. Las lecciones y sesiones las crea
// la profesora desde la app (necesitan su usuario). Uso:
//   node scripts/build-seed.mjs [contenido/leccion-demo.json]
import { readFileSync, writeFileSync } from "node:fs";

const lessonPath = process.argv[2] ?? "contenido/leccion-demo.json";
const lesson = JSON.parse(readFileSync(lessonPath, "utf8"));
const characters = JSON.parse(readFileSync("data/characters.json", "utf8"));

const q = (v) =>
  v === undefined || v === null ? "null" : `'${String(v).replaceAll("'", "''")}'`;
const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;
const json = (o) => (o ? `${q(JSON.stringify(o))}::jsonb` : "null");

const lines = [
  `-- Generado por scripts/build-seed.mjs desde ${lessonPath}. No editar a mano.`,
  "begin;",
  "",
];

for (const [char, c] of Object.entries(characters)) {
  lines.push(
    `insert into characters (char, pinyin, radical, decomposition, components, etymology, stroke_roles)
values (${q(char)}, ${arr(c.pinyin)}, ${q(c.radical)}, ${q(c.decomposition)}, ${json(c.components)}, ${json(c.etymology)}, ${arr(c.strokeRoles)})
on conflict (char) do nothing;`,
  );
}
lines.push("");

for (const w of lesson.words) {
  // Las palabras ya existentes (y posiblemente curadas) no se tocan.
  lines.push(
    `with w as (
  insert into words (hanzi, hsk_level, hsk_version, cultural_note_es, cultural_note_en, origin)
  values (${q(w.hanzi)}, ${w.hsk}, ${q(lesson.lesson.hskVersion)}, ${q(w.culturalNote?.es)}, ${q(w.culturalNote?.en)}, 'ai')
  on conflict (hanzi) do nothing
  returning id
)`,
  );
  const senseInserts = w.senses.map((s, i) => {
    const sentences = s.sentences
      .map(
        (t, j) =>
          `(${j + 1}, ${q(t.zh)}, ${q(t.pinyin)}, ${q(t.es)}, ${q(t.en)})`,
      )
      .join(",\n      ");
    return `s${i} as (
  insert into senses (word_id, position, pinyin, category, meaning_es, meaning_en, nuance_es, nuance_en, origin)
  select id, ${i + 1}, ${q(s.pinyin)}, ${q(s.category)}, ${q(s.meaning.es)}, ${q(s.meaning.en)}, ${q(s.nuance?.es)}, ${q(s.nuance?.en)}, 'ai' from w
  returning id
), t${i} as (
  insert into sentences (sense_id, position, zh, pinyin, translation_es, translation_en, origin)
  select s${i}.id, v.position, v.zh, v.pinyin, v.es, v.en, 'ai'
  from s${i}, (values
      ${sentences}
  ) as v(position, zh, pinyin, es, en)
  returning 1
)`;
  });
  lines.push(`, ${senseInserts.join(",\n")}`);
  lines.push("select 1;", "");
}

lines.push("commit;", "");
writeFileSync("supabase/seed.sql", lines.join("\n"));
console.log(`supabase/seed.sql: ${Object.keys(characters).length} caracteres, ${lesson.words.length} palabras`);
