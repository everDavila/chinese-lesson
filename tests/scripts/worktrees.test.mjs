import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../scripts/worktrees.mjs", import.meta.url));
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "renshi-worktrees-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const main = path.join(root, "main");
  mkdirSync(main);
  const git = (...args) => execFileSync("git", args, { cwd: main, encoding: "utf8", stdio: "pipe" }).trim();
  git("init", "-b", "master");
  git("config", "user.name", "Worktree test");
  git("config", "user.email", "test@example.invalid");
  const table = (folder = "—", branch = "task") => writeFileSync(path.join(main, "TRABAJO-EN-CURSO.md"),
    `## Tabla\n| Agente | Rama | Carpeta | Puerto | Tarea | Estado |\n|---|---|---|---|---|---|\n| Codex | \`${branch}\` | ${folder === "—" ? folder : `\`${folder}\``} | — | Test | Test |\n`);
  table();
  git("add", "TRABAJO-EN-CURSO.md");
  git("commit", "-m", "Fixture");
  git("branch", "task");
  git("remote", "add", "origin", main);
  const run = (args = ["--estado"], cwd = main) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
  return { root, main, git, table, run };
}

test("crea con el nombre derivado aunque la tabla indique uno antiguo", (t) => {
  const f = fixture(t);
  f.table("old-task");
  const result = f.run([]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(existsSync(path.join(f.root, "codex-chinese-lesson-task")));
  assert.equal(existsSync(path.join(f.root, "old-task")), false);
});

test("conserva y avisa sobre una carpeta antigua existente", (t) => {
  const f = fixture(t);
  const legacy = path.join(f.root, "old-task");
  f.git("worktree", "add", legacy, "task");
  f.table("old-task");
  const result = f.run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /nombre fuera de convenio/);
  assert.equal(existsSync(path.join(f.root, "codex-chinese-lesson-task")), false);
});

test("rechaza una carpeta que contiene otra rama", (t) => {
  const f = fixture(t);
  f.git("branch", "other");
  f.git("worktree", "add", path.join(f.root, "codex-chinese-lesson-task"), "other");
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stdout, /rama other/);
  assert.doesNotMatch(result.stdout, /sin cambios pendientes/);
});

test("un directorio sin repositorio no aparece como limpio", (t) => {
  const f = fixture(t);
  mkdirSync(path.join(f.root, "codex-chinese-lesson-task"));
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stdout, /✗/);
  assert.doesNotMatch(result.stdout, /sin cambios pendientes/);
});

test("no duplica una rama ocupada en otra carpeta", (t) => {
  const f = fixture(t);
  f.git("worktree", "add", path.join(f.root, "occupied"), "task");
  const result = f.run([]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /La rama ya está/);
  assert.equal(existsSync(path.join(f.root, "codex-chinese-lesson-task")), false);
});

test("estado no hace fetch ni crea carpetas; preparar informa el fallo de fetch", (t) => {
  const f = fixture(t);
  f.git("remote", "set-url", "origin", path.join(f.root, "missing-remote"));
  assert.equal(f.run().status, 0);
  assert.equal(existsSync(path.join(f.root, "codex-chinese-lesson-task")), false);
  const result = f.run([]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /No se pudo comprobar/);
});

test("desde un worktree usa el registro actualizado de la principal", (t) => {
  const f = fixture(t);
  const existing = path.join(f.root, "codex-chinese-lesson-task");
  f.git("worktree", "add", existing, "task");
  f.git("branch", "next");
  f.table("—", "next");
  const result = f.run(["--estado"], existing);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Codex · next/);
  assert.doesNotMatch(result.stdout, /Codex · task/);
});
