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


