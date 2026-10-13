import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
function batchFile(t, batch) {
  const dir = mkdtempSync(path.join(tmpdir(), "renshi-content-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "batch.json");
  writeFileSync(file, JSON.stringify(batch));
  return file;
}

const sentence = { zh: "例句", pinyin: "Lìjù", es: "Ejemplo", en: "Example", origin: "ai" };
function importBatch(t, scenario) {
  const batch = { metadata: { sourceId: "fixture", level: 5 }, examples: [
    { sourceOrder: 1, hanzi: "甲", targetPinyin: "jiǎ", senseId: "a", sentences: [sentence] },
    { sourceOrder: 2000, hanzi: "乙", targetPinyin: "yǐ", senseId: "b", sentences: [{ ...sentence, zh: "第二句" }] },
  ] };
  if (scenario === "wrong-sense") batch.examples[1].targetPinyin = "wrong";
  const file = batchFile(t, batch);
  const code = `
    process.argv = [process.execPath, 'script', ${JSON.stringify(file)}, '--apply'];
    const scenario = ${JSON.stringify(scenario)};
    let inserted = 0;
    globalThis.fetch = async (url, options) => {
      const query = new URL(url);
      let rows = [];
      if (options.method === 'POST') {
        rows = JSON.parse(options.body);
        inserted += rows.length;
        console.log('POST_COUNT=' + inserted);
      } else if (query.pathname.endsWith('/senses')) {
        if (query.searchParams.get('catalog_source_order') !== 'in.(1,2000)') throw Error('Consulta no acotada al lote');
        rows = [{ id: 'dev-a', status: 'unreviewed', catalog_source_order: 1, pinyin: 'jiǎ', words: { hanzi: '甲' } },
          { id: 'dev-b', status: scenario === 'reviewed' ? 'reviewed' : 'unreviewed', catalog_source_order: 2000, pinyin: 'yǐ', words: { hanzi: '乙' } }];
      } else if (scenario === 'existing') {
        rows = [{ id: 's1', sense_id: 'dev-a', position: 1, zh: '例句' }, { id: 's2', sense_id: 'dev-b', position: 1, zh: '第二句' }];
      }
      return { ok: true, text: async () => JSON.stringify(rows) };
    };
    await import(${JSON.stringify(new URL("../../scripts/sync-hsk-examples.mjs", import.meta.url).href)});
  `;
  return spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: root, encoding: "utf8", env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "https://fixture.invalid", SUPABASE_SECRET_KEY: "fixture" },
  });
}

test("importa órdenes dispersos sin leer un intervalo truncable", (t) => {
  const result = importBatch(t, "new");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /POST_COUNT=2/);
});
test("repetir el lote no vuelve a insertar frases existentes", (t) => {
  const result = importBatch(t, "existing");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /0 frases nuevas/);
  assert.doesNotMatch(result.stdout, /POST_COUNT/);
});
test("respeta sentidos revisados", (t) => {
  const result = importBatch(t, "reviewed");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /POST_COUNT=1/);
  assert.match(result.stdout, /1 sentidos curados respetados/);
});
test("una lectura incorrecta aborta antes de escribir cualquier frase", (t) => {
  const result = importBatch(t, "wrong-sense");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /identidad/);
  assert.doesNotMatch(result.stdout, /POST_COUNT/);
});
test("el validador usa el temario vigente en niveles 4 a 6", (t) => {
  for (const [hanzi, level, zh, expected] of [
    ["垃圾", 4, "请不要把垃圾扔在地上。", 0],
    ["法律", 4, "我们都应该遵守法律。", 1],
    ["生态", 6, "保护森林有助于维持生态平衡。", 0],
  ]) {
    const file = batchFile(t, { metadata: { standard: "hsk-3.0", level }, examples: [{ hanzi, sentences: [{ zh }] }] });
    const result = spawnSync(process.execPath, ["scripts/validate-content.mjs", file], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, expected, result.stdout + result.stderr);
  }
});
test("los tres lotes conservan la identidad y contienen una frase completa por palabra", () => {
  let count = 0;
  for (const level of [4, 5, 6]) {
    const batch = JSON.parse(readFileSync(path.join(root, `contenido/temas-frases-hsk${level}.json`), "utf8"));
    assert.equal(batch.examples.length, batch.metadata.count);
    assert.equal(batch.metadata.requestedPerSense, 1);
    const seen = new Set();
    for (const row of batch.examples) {
      assert.ok(row.senseId);
      assert.ok(Number.isInteger(row.sourceOrder));
      assert.ok(!seen.has(row.senseId));
      seen.add(row.senseId);
      assert.equal(row.sentences.length, 1);
      const s = row.sentences[0];
      for (const field of ["zh", "pinyin", "es", "en"]) assert.ok(s[field]?.trim());
      assert.ok(s.zh.includes(row.hanzi));
      assert.equal(s.origin, "ai");
      assert.equal(s.source, "codex-editorial");
      assert.equal(s.license, null);
      count++;
    }
  }
  assert.equal(count, 85);
});
