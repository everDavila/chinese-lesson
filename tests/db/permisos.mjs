// Aplica todas las migraciones de supabase/migrations en un Postgres en
// memoria (PGlite) y comprueba los permisos clave, sin tocar Supabase.
// Simula lo mínimo de Supabase: esquema auth, auth.uid() y el rol
// authenticated. Uso:
//   npm run test:db [-- migracion-extra.sql …]
// Los archivos extra se aplican antes de las migraciones de esta rama cuya
// fecha sea posterior (sirve para probar contra la migración de otra rama).
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
const db = new PGlite();
const run = async (label, sql) => {
  try {
    await db.exec(sql);
    console.log(`✓ ${label}`);
  } catch (e) {
    console.log(`✗ ${label}: ${e.message}`);
    process.exit(1);
  }
};

await run("simulación de Supabase", `
  create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to authenticated;
  grant execute on function auth.uid() to authenticated;
`);
const dir = "supabase/migrations";
const migrations = [
  ...readdirSync(dir).filter((f) => f.endsWith(".sql")).map((f) => ({ name: f, file: path.join(dir, f) })),
  ...process.argv.slice(2).map((f) => ({ name: path.basename(f), file: f })),
].sort((a, b) => a.name.localeCompare(b.name));
for (const m of migrations) await run(m.name, readFileSync(m.file, "utf8"));

// Datos: una admin, dos docentes, una palabra con su sentido.
const A = "00000000-0000-0000-0000-0000000000a1";
const T1 = "00000000-0000-0000-0000-0000000000b1";
const T2 = "00000000-0000-0000-0000-0000000000b2";
await run("datos de prueba", `
  insert into auth.users (id, email) values ('${A}','a@x'),('${T1}','t1@x'),('${T2}','t2@x');
  update profiles set role = 'admin' where id = '${A}';
  insert into words (id, hanzi, hsk_level) values ('00000000-0000-0000-0000-00000000aaaa','测试词',1);
  insert into senses (id, word_id, position, pinyin) values ('00000000-0000-0000-0000-00000000bbbb','00000000-0000-0000-0000-00000000aaaa',1,'cèshìcí');
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant execute on all functions in schema public to authenticated;
`);

// Ejecuta SQL como un usuario concreto, con RLS activa.
async function as(user, sql) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec(`reset role;`);
  }
}
async function expectOk(label, user, sql) {
  try {
    const r = await as(user, sql);
    console.log(`✓ ${label}${r.rows?.length ? " → " + JSON.stringify(r.rows[0]) : ""}`);
    return r;
  } catch (e) {
    console.log(`✗ ${label}: ${e.message}`);
    process.exitCode = 1;
  }
}
async function expectFail(label, user, sql) {
  try {
    const r = await as(user, sql);
    const n = r.affectedRows ?? r.rows?.length ?? 0;
    if (n === 0) console.log(`✓ ${label} (0 filas, bloqueado por RLS)`);
    else { console.log(`✗ ${label}: debía fallar y afectó ${n} filas`); process.exitCode = 1; }
  } catch (e) {
    console.log(`✓ ${label} (rechazado: ${e.message.slice(0, 60)})`);
  }
}

console.log("\n— Permisos —");
await expectFail("docente NO edita la base común", T1, `update words set hsk_level = 2 where hanzi = '测试词'`);
await expectOk("admin SÍ edita la base común", A, `update words set hsk_level = 1 where hanzi = '测试词' returning hanzi`);

await expectOk("admin crea plantilla", A,
  `insert into collections (id, owner_id, title) values ('00000000-0000-0000-0000-0000000000c1', null, 'HSK 1') returning title`);
await expectOk("admin crea lección de plantilla", A,
  `insert into lessons (id, teacher_id, collection_id, title, position) values ('00000000-0000-0000-0000-0000000000d1', null, '00000000-0000-0000-0000-0000000000c1', 'Lección 1', 1) returning title`);
await expectOk("admin añade palabra a la plantilla", A,
  `insert into lesson_items (lesson_id, sense_id, position) values ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-00000000bbbb',1) returning position`);
await expectFail("docente NO crea plantillas", T1,
  `insert into collections (owner_id, title) values (null, 'pirata') returning id`);

await expectOk("docente ve la plantilla", T1, `select title from collections where owner_id is null`);
await expectOk("docente ve las lecciones de la plantilla", T1, `select title from lessons where collection_id = '00000000-0000-0000-0000-0000000000c1'`);
await expectFail("docente NO edita la plantilla", T1, `update collections set title = 'mía' where owner_id is null`);

const copia = await expectOk("docente copia la plantilla", T1, `select copy_collection('00000000-0000-0000-0000-0000000000c1') as id`);
const nueva = copia?.rows?.[0]?.id;
await expectOk("la copia tiene su lección y su palabra", T1,
  `select l.title, count(i.*) as items from lessons l join lesson_items i on i.lesson_id = l.id where l.collection_id = '${nueva}' group by l.title`);
await expectOk("docente renombra su copia", T1, `update collections set title = 'Mi HSK 1' where id = '${nueva}' returning title`);
await expectOk("la plantilla no cambia", T1, `select title from collections where id = '00000000-0000-0000-0000-0000000000c1'`);

await expectFail("otra docente NO ve la colección ajena", T2, `select * from collections where id = '${nueva}'`);
await expectFail("otra docente NO añade palabras a la lección ajena", T2,
  `insert into lesson_items (lesson_id, sense_id, position) select id, '00000000-0000-0000-0000-00000000bbbb', 9 from lessons where collection_id = '${nueva}'`);
await expectFail("docente NO mete su lección en colección ajena", T2,
  `insert into lessons (teacher_id, collection_id, title, position) values ('${T2}', '${nueva}', 'intrusa', 2) returning id`);



console.log("\n— Admin y docente (20261011021000) —");
const W = "00000000-0000-0000-0000-00000000aaaa";
const S = "00000000-0000-0000-0000-00000000bbbb";
await expectOk("plantillas HSK 1–3 creadas desde el temario", A,
  `select c.title, count(distinct l.id) as lecciones, count(i.*) as items from collections c
   left join lessons l on l.collection_id = c.id left join lesson_items i on i.lesson_id = l.id
   where c.owner_id is null and c.title in ('HSK 1','HSK 2','HSK 3') group by c.title order by c.title`);
await expectOk("el catálogo trae glosa inglesa", A,
  `select count(*) filter (where meaning_en is not null) as con_glosa, count(*) as total from senses where catalog_source_id = 'cti-hsk3-2026'`);

const payload = (sentences) => JSON.stringify({
  id: W, hsk_level: 1, status: "unreviewed",
  senses: [{ id: S, pinyin: "cèshìcí", category: "noun", meaning_es: "palabra de prueba", sentences }],
});
await expectOk("admin guarda la palabra con dos frases", A,
  `select save_word('${payload([{ zh: "这是测试词。", pinyin: "Zhè shì cèshìcí." }, { zh: "我有测试词。", pinyin: "Wǒ yǒu cèshìcí." }])}'::jsonb)`);
await expectFail("docente NO puede usar save_word", T1, `select save_word('${payload([])}'::jsonb)`);
const frases = await as(A, `select id, zh, position from sentences where sense_id = '${S}' order by position`);
const f2 = frases.rows[1];
await expectOk("admin reordena y borra frases al guardar", A,
  `select save_word('${payload([{ id: f2.id, zh: f2.zh, pinyin: "Wǒ yǒu cèshìcí." }])}'::jsonb)`);
await expectOk("queda solo la segunda, en posición 1", A,
  `select zh, position from sentences where sense_id = '${S}'`);
await expectOk("publicar marca sentidos y frases como revisados", A,
  `select set_word_status('${W}', 'reviewed')`);
await expectOk("…y la frase queda revisada", A, `select status from sentences where sense_id = '${S}'`);

const ej = await expectOk("docente crea una copia editada de una original", T1,
  `insert into teacher_examples (teacher_id, sense_id, zh, pinyin, based_on_sentence_id)
   values ('${T1}', '${S}', '我也有测试词。', 'Wǒ yě yǒu cèshìcí.', '${f2.id}') returning id`);
const ejId = ej?.rows?.[0]?.id;
await expectFail("otra docente NO ve la frase ajena", T2, `select * from teacher_examples where id = '${ejId}'`);
await expectOk("docente oculta una original en sus clases", T1,
  `insert into teacher_hidden_sentences (sentence_id) values ('${f2.id}') returning teacher_id`);
await expectFail("otra docente NO ve lo que oculta la primera", T2, `select * from teacher_hidden_sentences`);
await expectOk("docente sugiere su frase", T1,
  `update teacher_examples set status = 'submitted' where id = '${ejId}' returning status`);
await expectFail("docente NO acepta su propia sugerencia", T1, `select accept_teacher_example('${ejId}', true)`);
await expectOk("admin ve el nombre de quien sugiere", A,
  `select p.display_name from teacher_examples e join profiles p on p.id = e.teacher_id where e.id = '${ejId}'`);
await expectOk("admin acepta reemplazando la original", A, `select accept_teacher_example('${ejId}', true) as id`);
await expectOk("la original cambió y quedó en el historial", A,
  `select s.zh, s.status, r.old_value from sentences s join revisions r on r.entity_id = s.id where s.id = '${f2.id}'`);
await expectFail("docente NO edita una frase ya aceptada", T1,
  `update teacher_examples set zh = 'otra' where id = '${ejId}' returning id`);

const ej2 = await as(T1, `insert into teacher_examples (teacher_id, sense_id, zh, pinyin, status) values ('${T1}', '${S}', '测试词很好。', 'Cèshìcí hěn hǎo.', 'draft') returning id`);
const ej2Id = ej2.rows[0].id;
await as(T1, `update teacher_examples set status = 'submitted' where id = '${ej2Id}'`);
await expectOk("admin rechaza con nota", A,
  `update teacher_examples set status = 'rejected', review_note = 'Mejor con 是', reviewed_by = '${A}', reviewed_at = now() where id = '${ej2Id}' returning status`);
await expectOk("la rechazada sigue siendo de la docente y puede reenviarla", T1,
  `update teacher_examples set zh = '测试词是好的。', status = 'submitted' where id = '${ej2Id}' returning status`);
await expectFail("docente NO borra frases de la base común", T1, `delete from sentences where sense_id = '${S}' returning id`);
