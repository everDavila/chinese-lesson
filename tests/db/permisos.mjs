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
  create role anon;
  create role service_role;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to authenticated;
  -- Como Supabase: toda función nueva de public es ejecutable por anon y
  -- authenticated salvo que la migración lo revoque explícitamente.
  alter default privileges in schema public grant execute on functions to anon, authenticated;
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

console.log("\n— Rotación de frases (20261012000000) —");
const nuevaCol = (await as(T1, `insert into collections (owner_id, title) values ('${T1}', 'Rotación') returning id, examples_shown`)).rows[0];
console.log(`✓ colección nueva con 2 frases por defecto → ${nuevaCol.examples_shown}`);
const lec = (await as(T1, `insert into lessons (teacher_id, collection_id, title, position) values ('${T1}', '${nuevaCol.id}', 'L1', 1) returning id`)).rows[0].id;
const lec2 = (await as(T1, `insert into lessons (teacher_id, collection_id, title, position) values ('${T1}', '${nuevaCol.id}', 'L2', 2) returning id`)).rows[0].id;
const ses = (await as(T1, `insert into class_sessions (lesson_id, teacher_id, join_code) values ('${lec}', '${T1}', 'RXTA22') returning id`)).rows[0].id;
const K1 = "s:00000000-0000-0000-0000-000000000001", K2 = "s:00000000-0000-0000-0000-000000000002";
await expectOk("docente guarda las frases elegidas de su sesión", T1,
  `insert into session_sentences (session_id, sense_id, sentence_key, position) values ('${ses}', '${S}', '${K1}', 1), ('${ses}', '${S}', '${K2}', 2) returning position`);
await expectFail("clave con formato inválido", T1,
  `insert into session_sentences (session_id, sense_id, sentence_key, position) values ('${ses}', '${S}', 'x', 3) returning position`);
await expectFail("otra docente NO ve las frases de esa sesión", T2, `select * from session_sentences`);
await expectFail("otra docente NO escribe en esa sesión", T2,
  `insert into session_sentences (session_id, sense_id, sentence_key, position) values ('${ses}', '${S}', 's:00000000-0000-0000-0000-000000000003', 3) returning position`);
await expectOk("el historial cuenta para otra lección de la misma colección", T1,
  `select count(*)::int as frases from sentence_history('${lec2}', array['${S}']::uuid[])`);
await expectFail("el historial de una docente no lo ve otra", T2,
  `select * from sentence_history('${lec2}', array['${S}']::uuid[])`);
await expectFail("examples_shown fuera de rango", T1,
  `update lessons set examples_shown = 12 where id = '${lec}' returning id`);
console.log("\n— Votación anónima (20261012010000) —");
// Un alumno sin cuenta: rol anon, sin auth.uid().
async function asAnon(sql) {
  await db.exec(`set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec(`reset role;`);
  }
}
const VOTER = "a".repeat(64);
const vLesson = (await as(T1, `insert into lessons (teacher_id, title) values ('${T1}', 'Votos') returning id`)).rows[0].id;
const vSes = (await as(T1, `insert into class_sessions (lesson_id, teacher_id, join_code) values ('${vLesson}', '${T1}', 'VXTE22') returning id`)).rows[0].id;
const estado = async (code) => (await asAnon(`select student_vote_state('${code}') as s`)).rows[0].s;
console.log(`✓ código inexistente → ${JSON.stringify(await estado("ZZZZZZ"))}`);
console.log(`✓ clase sin votación abierta → ${JSON.stringify(await estado("vxte22"))}`);
const ev = (await as(T1, `insert into evaluations (session_id, sense_id) values ('${vSes}', '${S}') returning id`)).rows[0].id;
const abierto = await estado("VXTE22");
if (abierto.status !== "open" || abierto.hanzi !== "测试词" || "meaning_es" in abierto) { console.log("✗ estado abierto incorrecto", abierto); process.exitCode = 1; }
else console.log(`✓ votación abierta muestra hanzi y pinyin, sin significado → ${JSON.stringify(abierto)}`);

const vota = async (rating, voter = VOTER, code = "VXTE22", evId = ev) =>
  (await asAnon(`select cast_student_vote('${code}', '${evId}', '${voter}', ${rating}::smallint) as ok`)).rows[0].ok;
if (await vota(3)) console.log("✓ alumno anónimo vota"); else { console.log("✗ no pudo votar"); process.exitCode = 1; }
await vota(1);
const cuenta = (await as(T1, `select count(*)::int as n, max(rating) as r from votes where evaluation_id = '${ev}'`)).rows[0];
if (cuenta.n === 1 && cuenta.r === 1) console.log("✓ votar otra vez cambia el voto, no lo suma"); else { console.log("✗ voto duplicado", cuenta); process.exitCode = 1; }
for (const [label, ok] of [
  ["rating fuera de 1–4", await vota(7)],
  ["hash de votante inválido", await vota(2, "x")],
  ["código de otra clase", await vota(2, VOTER, "ZZZZZZ")],
]) {
  if (ok) { console.log(`✗ ${label}: aceptado`); process.exitCode = 1; } else console.log(`✓ ${label}: rechazado`);
}
await expectFail("anon NO lee los votos", "", `select * from votes`);
await (async () => {
  try { await asAnon(`insert into votes (evaluation_id, voter_hash, rating) values ('${ev}', '${"b".repeat(64)}', 4)`); console.log("✗ anon insertó en votes"); process.exitCode = 1; }
  catch { console.log("✓ anon NO escribe en votes directamente"); }
})();
await as(T1, `update evaluations set status = 'closed', closed_at = now() where id = '${ev}'`);
if (await vota(4, "c".repeat(64))) { console.log("✗ votó con la votación cerrada"); process.exitCode = 1; } else console.log("✓ votación cerrada: no acepta votos");
await as(T1, `update class_sessions set status = 'ended' where id = '${vSes}'`);
console.log(`✓ clase terminada → ${JSON.stringify(await estado("VXTE22"))}`);
await expectOk("la docente ve el voto en los resultados", T1, `select votes_total, votes_1 from session_results where session_id = '${vSes}'`);

// ── Búsqueda del catálogo en la base (migración 20261012020000) ──────────
{
  const busca = async (user, args) => (await as(user, `select search_words(${args}) as r`)).rows[0].r;
  const porPinyin = await busca(T1, `'ceshi'`);
  if (porPinyin.rows.some((r) => r.hanzi === "测试词")) console.log(`✓ la docente busca sin tonos ("ceshi" → 测试词, ${porPinyin.total} resultado/s)`);
  else { console.log("✗ 'ceshi' no encuentra 测试词", porPinyin); process.exitCode = 1; }
  const porNivel = await busca(T1, `'', array[2]`);
  if (!porNivel.rows.some((r) => r.hanzi === "测试词") && porNivel.levels["1"] >= 1) console.log("✓ el filtro de nivel excluye otros niveles y cuenta por nivel");
  else { console.log("✗ filtro de nivel", porNivel); process.exitCode = 1; }
  try { await asAnon(`select search_words('ceshi')`); console.log("✗ anon pudo buscar en el catálogo"); process.exitCode = 1; }
  catch { console.log("✓ anon NO busca en el catálogo"); }
}

// ── Catálogo HSK por nivel (migración 20261017010000) ───────────────────
{
  const cat = async (args) => (await as(T1, `select hsk_catalog(${args}) as r`)).rows[0].r;
  // Cada nivel, página a página: la unión es exactamente el temario, en orden.
  let ok = true;
  for (let lvl = 1; lvl <= 7; lvl++) {
    const official = (await as(T1, `select source_order from word_levels where standard = 'hsk-3.0' and level = ${lvl} order by source_order`)).rows.map((r) => r.source_order);
    const seen = [];
    let first = null;
    for (let off = 0; off < 20000; off += 200) {
      const r = await cat(`${lvl}, '', 200, ${off}`);
      first ??= r.total;
      seen.push(...r.rows.map((x) => x.order));
      if (off + 200 >= r.total) break;
    }
    const same = seen.length === official.length && seen.every((o, i) => o === official[i]) && first === official.length;
    if (!same) { ok = false; console.log(`✗ HSK nivel ${lvl}: páginas ${seen.length} (únicas ${new Set(seen).size}) vs temario ${official.length}, total ${first}`); }
  }
  if (ok) console.log("✓ catálogo HSK: la unión de páginas de cada nivel es el temario exacto, en orden, sin repetidos");

  const counts = (await as(T1, `select hsk_catalog_counts() as r`)).rows[0].r;
  const realCounts = Object.fromEntries((await as(T1, `select level, count(*)::int n from word_levels where standard = 'hsk-3.0' group by level`)).rows.map((r) => [r.level, r.n]));
  if (Object.entries(realCounts).every(([l, n]) => counts[l] === n)) console.log(`✓ conteo por nivel → ${JSON.stringify(counts)}`);
  else { console.log("✗ conteo por nivel", counts, realCounts); process.exitCode = 1; }

  const pin = (r) => r.rows.filter((x) => x.hanzi === "得").map((x) => x.pinyin).sort();
  const dei = await cat(`3, 'dei'`);
  const deTone = await cat(`3, 'dé'`);
  const han = await cat(`3, '得'`);
  if (pin(han).length === 2 && pin(dei).join() === "děi" && pin(deTone).join() === "dé") console.log(`✓ búsqueda: 得 en HSK 3 → ${pin(han).join(", ")}; "dei" → děi; "dé" (con tono) → dé`);
  else { console.log("✗ búsqueda con tonos", pin(han), pin(dei), pin(deTone)); process.exitCode = 1; }
  const lv = han.rows.find((x) => x.hanzi === "得")?.levels ?? [];
  if (lv.includes(2) && lv.includes(3)) console.log(`✓ 得 muestra todos sus niveles → ${JSON.stringify(lv)}`);
  else { console.log("✗ niveles de 得", lv); process.exitCode = 1; }

  try { await asAnon(`select hsk_catalog(1)`); console.log("✗ anon pudo leer el catálogo"); process.exitCode = 1; }
  catch { console.log("✓ anon NO lee el catálogo HSK"); }
  if (!ok) process.exitCode = 1;
}

// ── Lecciones sueltas y mover entre colecciones (hoja de ruta, prioridad 1) ─
{
  const suelta = (await as(T1, `insert into lessons (teacher_id, collection_id, title) values ('${T1}', null, 'Suelta') returning id`)).rows[0].id;
  console.log("✓ la docente crea una lección sin colección");
  const mia = (await as(T1, `insert into collections (owner_id, title) values ('${T1}', 'Clase B') returning id`)).rows[0].id;
  const ajena = (await as(T2, `insert into collections (owner_id, title) values ('${T2}', 'De otra') returning id`)).rows[0].id;
  await expectOk("la mueve a su colección", T1, `update lessons set collection_id = '${mia}', position = 1 where id = '${suelta}' returning collection_id`);
  await expectOk("la vuelve a dejar suelta", T1, `update lessons set collection_id = null, position = null where id = '${suelta}' returning id`);
  await expectFail("NO la mueve a la colección de otra docente", T1, `update lessons set collection_id = '${ajena}', position = 1 where id = '${suelta}'`);
  const sigue = (await as(T1, `select collection_id from lessons where id = '${suelta}'`)).rows[0];
  if (sigue.collection_id === null) console.log("✓ tras el intento rechazado, la lección sigue suelta");
  else { console.log("✗ la lección cambió de colección", sigue); process.exitCode = 1; }
}

// ── Presentación rápida (hoja de ruta, prioridad 3) ─────────────────────
{
  const rapida = (await as(T1, `insert into lessons (teacher_id, collection_id, title, quick) values ('${T1}', null, 'HSK 1 · hoy', true) returning id`)).rows[0].id;
  console.log("✓ la docente crea una lección rápida (suelta y oculta)");
  const col = (await as(T1, `insert into collections (owner_id, title) values ('${T1}', 'Con rápida') returning id`)).rows[0].id;
  await expectFail("una lección rápida NO puede estar en una colección", T1, `update lessons set collection_id = '${col}', position = 1 where id = '${rapida}'`);
  await expectOk("guardarla quita la marca (prioridad 4)", T1, `update lessons set quick = false where id = '${rapida}' returning quick`);
}

// ── Archivar (lecciones y colecciones propias) ──────────────────────────
{
  const mia = (await as(T1, `insert into collections (owner_id, title) values ('${T1}', 'Para archivar') returning id`)).rows[0].id;
  const ajena = (await as(T2, `insert into collections (owner_id, title) values ('${T2}', 'Ajena') returning id`)).rows[0].id;
  await expectOk("la docente archiva su colección", T1, `update collections set archived_at = now() where id = '${mia}' returning id`);
  await expectOk("y la restaura", T1, `update collections set archived_at = null where id = '${mia}' returning id`);
  const r = await as(T1, `update collections set archived_at = now() where id = '${ajena}' returning id`);
  if (r.rows.length === 0) console.log("✓ NO archiva la colección de otra docente (0 filas)");
  else { console.log("✗ archivó una colección ajena"); process.exitCode = 1; }
}

// ── Lección de ejemplo (2026-10-18) ─────────────────────────────────────
{
  // La original: suelta del admin, marcada como demo pública, con la palabra de prueba
  // y una nota que cita otra palabra (龘龘) y un carácter suelto.
  await db.exec(`
    insert into words (id, hanzi, hsk_level) values ('00000000-0000-0000-0000-00000000aaa2','龘龘',1);
    insert into senses (id, word_id, position, pinyin, meaning_es) values ('00000000-0000-0000-0000-00000000bbb2','00000000-0000-0000-0000-00000000aaa2',1,'dádá','prueba');
    update senses set nuance_es = 'Más corto: 龘龘一下。' where id = '00000000-0000-0000-0000-00000000bbbb';
    insert into lessons (id, teacher_id, title, public_demo) values ('00000000-0000-0000-0000-0000000000e1','${A}','Lección de ejemplo',true);
    insert into lesson_items (lesson_id, sense_id, position) values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-00000000bbbb',1);
  `);
  await expectFail("NO puede haber dos lecciones de demo", A, `insert into lessons (teacher_id, title, public_demo) values ('${A}','Otra',true)`);
  const dada = (await db.query(`select give_example_lesson('${T1}') as id`)).rows[0].id;
  if (dada) console.log("✓ la docente recibe su copia de la lección de ejemplo");
  else { console.log("✗ no recibió la copia"); process.exitCode = 1; }
  await expectOk("la copia es suya, suelta y con sus palabras", T1,
    `select l.title, l.collection_id, count(i.*)::int as items from lessons l join lesson_items i on i.lesson_id = l.id where l.id = '${dada}' group by l.title, l.collection_id`);
  await expectOk("puede borrarla", T1, `delete from lessons where id = '${dada}' returning id`);
  const otra = (await db.query(`select give_example_lesson('${T1}') as id`)).rows[0].id;
  if (otra === null) console.log("✓ borrada, no se le vuelve a dar");
  else { console.log("✗ se le dio otra copia"); process.exitCode = 1; }
  if ((await db.query(`select give_example_lesson('${A}') as id`)).rows[0].id === null) console.log("✓ el admin no recibe copia");
  else { console.log("✗ el admin recibió copia"); process.exitCode = 1; }
  const T3 = "00000000-0000-0000-0000-0000000000b3";
  await db.exec(`insert into auth.users (id, email) values ('${T3}','t3@x')`);
  const nuevas = (await as(T3, `select count(*)::int n from lessons where teacher_id = '${T3}'`)).rows[0].n;
  if (nuevas === 1) console.log("✓ una docente nueva la recibe al crearse");
  else { console.log("✗ la docente nueva tiene", nuevas, "lecciones"); process.exitCode = 1; }
  await expectFail("otra docente NO ve la original", T2, `select id from lessons where public_demo`);

  const demo = (await asAnon(`select public_demo_lesson() as d`)).rows[0].d;
  const citas = (demo?.note_words ?? []).map((w) => w.hanzi);
  if (demo?.title === "Lección de ejemplo" && demo.items.length === 1 && demo.items[0].word.hanzi === "测试词" && citas.includes("龘龘"))
    console.log(`✓ anon lee la demo pública (1 palabra; la nota cita → ${citas.join(", ")})`);
  else { console.log("✗ demo pública", JSON.stringify(demo)); process.exitCode = 1; }
  try { await asAnon(`select hanzi from words`); console.log("✗ anon leyó el catálogo"); process.exitCode = 1; }
  catch { console.log("✓ anon sigue sin leer el catálogo directamente"); }
}

// ── Compartir una lección con enlace público (2026-10-19) ───────────────
{
  const leccion = (await as(T1, `insert into lessons (teacher_id, title) values ('${T1}', 'Para compartir') returning id`)).rows[0].id;
  await as(T1, `insert into lesson_items (lesson_id, sense_id, position) values ('${leccion}', '00000000-0000-0000-0000-00000000bbbb', 1)`);
  await db.exec(`insert into teacher_examples (teacher_id, sense_id, zh, status) values ('${T1}', '00000000-0000-0000-0000-00000000bbbb', '我的句子。', 'draft')`);
  const code = "abcdefghijklmnop1234";
  await expectFail("otra docente NO comparte una lección ajena", T2, `update lessons set share_token = 'zzzzzzzzzzzzzzzzzzzz' where id = '${leccion}'`);
  await expectFail("un código corto no vale", T1, `update lessons set share_token = 'corto' where id = '${leccion}'`);
  await expectOk("la docente comparte su lección", T1, `update lessons set share_token = '${code}' where id = '${leccion}' returning title`);
  const shared = (await asAnon(`select shared_lesson('${code}') as d`)).rows[0].d;
  if (shared?.title === "Para compartir" && shared.items.length === 1 && shared.own_examples.some((e) => e.zh === "我的句子。"))
    console.log("✓ anon ve la lección compartida, con las frases propias de la docente");
  else { console.log("✗ lección compartida", JSON.stringify(shared)); process.exitCode = 1; }
  const wrong = (await asAnon(`select shared_lesson('nonononononononono') as d`)).rows[0].d;
  if (wrong === null) console.log("✓ un código que no existe no devuelve nada");
  else { console.log("✗ código inventado devolvió algo"); process.exitCode = 1; }
  try { await asAnon(`select lesson_payload('${leccion}')`); console.log("✗ anon llamó a lesson_payload"); process.exitCode = 1; }
  catch { console.log("✓ anon NO puede pedir cualquier lección por id"); }
  await expectOk("deja de compartir", T1, `update lessons set share_token = null where id = '${leccion}' returning id`);
  if ((await asAnon(`select shared_lesson('${code}') as d`)).rows[0].d === null) console.log("✓ al dejar de compartir, el enlace muere");
  else { console.log("✗ el enlace sigue vivo"); process.exitCode = 1; }
  const demo = (await asAnon(`select public_demo_lesson() as d`)).rows[0].d;
  if (demo?.title === "Lección de ejemplo") console.log("✓ la demo pública sigue igual con la función común");
  else { console.log("✗ demo pública", JSON.stringify(demo)?.slice(0, 120)); process.exitCode = 1; }
}

// ── Funciones internas cerradas (2026-10-19) ────────────────────────────
// Solo anon: los datos de prueba conceden a mano todas las funciones a
// authenticated. En Supabase, con sesión responden 403 (verificado en dev).
for (const fn of [`give_example_lesson('${T2}')`, `lesson_payload('00000000-0000-0000-0000-000000000000')`]) {
  try { await asAnon(`select ${fn}`); console.log(`✗ anon pudo llamar a ${fn.split("(")[0]}`); process.exitCode = 1; }
  catch { console.log(`✓ anon NO llama a ${fn.split("(")[0]}`); }
}
