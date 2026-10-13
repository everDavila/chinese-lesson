// Carpetas de trabajo de cada agente según TRABAJO-EN-CURSO.md.
//   npm run worktrees                 crea las que falten en esta PC
//   npm run worktrees -- --instalar   … y corre npm ci en las nuevas
//   npm run worktrees -- --estado     solo informa: existe, sin commitear, sin subir
// (En PowerShell el "--" se pierde: node scripts/worktrees.mjs --estado.)
// Las carpetas van junto a la principal y las nombra el script, no se escriben
// a mano: `<agente>-chinese-lesson-<tarea>` (el agente al frente, para que `ls`
// agrupe por dueño). La tabla solo dice agente y tarea; si la carpeta anotada
// no empieza por ese prefijo, se avisa en vez de crear otra.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const onlyStatus = args.includes("--estado");
const install = args.includes("--instalar");

const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const tryGit = (cwd, ...a) => {
  try {
    return git(cwd, ...a);
  } catch {
    return null;
  }
};

// La carpeta principal, aunque esto se corra desde un worktree.
const main = path.dirname(path.resolve(git(process.cwd(), "rev-parse", "--path-format=absolute", "--git-common-dir")));
const parent = path.dirname(main);

// La tabla de esta carpeta (si se corre desde un worktree) o la de la principal.
const here = git(process.cwd(), "rev-parse", "--show-toplevel");
const tablePath = [here, main].map((d) => path.join(d, "TRABAJO-EN-CURSO.md")).find((f) => existsSync(f));
if (!tablePath) {
  console.log("No encuentro TRABAJO-EN-CURSO.md: ¿hiciste git pull?");
  process.exit(1);
}
const table = readFileSync(tablePath, "utf8").split("## Tabla")[1] ?? "";
const rows = table
  .split(/\r?\n/)
  .filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l))
  .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
  .map(([agent, branch, folder, port]) => {
    // "Claude Code" -> "claude", "Codex" -> "codex": minusculas y sin espacios.
    const owner = agent?.toLowerCase().replace(/\s+/g, "-") ?? "";
    return {
      agent,
      owner,
      // Nombre canonico: el dueno al frente, para que `ls` agrupe por agente.
      // Usa la rama limpia (sin las comillas invertidas de la celda).
      expected: `${owner}-chinese-lesson-${branch?.match(/`([^`]+)`/)?.[1]}`,
      branch: branch?.match(/`([^`]+)`/)?.[1],
      folder: folder?.match(/`([^`]+)`/)?.[1],
      port,
    };
  })
  .filter((r) => r.branch && r.folder);

if (!rows.length) {
  console.log("TRABAJO-EN-CURSO.md no tiene filas con rama y carpeta.");
  process.exit(0);
}

if (!onlyStatus) tryGit(main, "fetch", "--quiet", "origin");

for (const r of rows) {
  const dir = path.join(parent, r.folder);
  const head = `${r.agent} · ${r.branch} → ${r.folder}${r.port && r.port !== "—" ? ` · puerto ${r.port}` : ""}`;

  if (existsSync(dir)) {
    const dirty = (tryGit(dir, "status", "--porcelain") ?? "").split("\n").filter(Boolean).length;
    const upstream = tryGit(dir, "rev-parse", "--abbrev-ref", "@{u}");
    const ahead = upstream ? Number(tryGit(dir, "rev-list", "--count", "@{u}..HEAD") ?? 0) : null;
    const notes = [
      dirty ? `${dirty} archivo(s) sin commitear` : "sin cambios pendientes",
      upstream ? (ahead ? `${ahead} commit(s) sin subir` : "rama subida") : "rama SIN SUBIR a GitHub",
    ];
    // El nombre lo deriva el script: si la tabla anoto otro, avisa. Es lo que
    // hizo que `npm run worktrees` no encontrara la carpeta de Codex.
    if (r.folder !== r.expected) {
      notes.push(`nombre fuera de convenio: deberia ser \`${r.expected}\``);
    }
    const warn = dirty || !upstream || ahead || r.folder !== r.expected;
    console.log(`${warn ? "⚠" : "✓"} ${head}\n    ${notes.join(" · ")}`);
    continue;
  }

  if (onlyStatus) {
    console.log(`· ${head}\n    no existe en esta PC`);
    continue;
  }

  const local = tryGit(main, "rev-parse", "--verify", "--quiet", `refs/heads/${r.branch}`);
  const remote = tryGit(main, "rev-parse", "--verify", "--quiet", `refs/remotes/origin/${r.branch}`);
  if (!local && !remote) {
    console.log(`✗ ${head}\n    la rama no está en GitHub: súbela desde la PC donde se trabajó (git push -u origin ${r.branch})`);
    continue;
  }

  // Una rama solo puede estar en un worktree. Si otro ya la tiene, crear otra
  // carpeta falla o deja dos copias de la misma rama: avisa en su lugar.
  const ocupante = (tryGit(main, "worktree", "list", "--porcelain") ?? "")
    .split("\n\n")
    .find((b) => b.includes(`refs/heads/${r.branch}\n`) || b.endsWith(`refs/heads/${r.branch}`));
  if (ocupante) {
    const otra = ocupante.match(/^worktree (.+)$/m)?.[1];
    console.log(`⚠ ${head}\n    la rama ${r.branch} ya está en \`${otra}\`: no se crea otra carpeta (revisa el nombre en la tabla)`);
    continue;
  }

  if (local) git(main, "worktree", "add", dir, r.branch);
  else git(main, "worktree", "add", "--track", "-b", r.branch, dir, `origin/${r.branch}`);

  // Lo que no viaja con git: claves y sesiones guardadas de las pruebas.
  const copied = [".env.local", ".env.dev.local", "tests/.auth", "tests/.auth-dev"].filter((f) => {
    const from = path.join(main, f);
    const to = path.join(dir, f);
    if (!existsSync(from) || existsSync(to)) return false;
    cpSync(from, to, { recursive: true });
    return true;
  });
  console.log(`+ ${head}\n    creada${copied.length ? `; copiados: ${copied.join(", ")}` : ""}`);

  if (install) {
    const r2 = spawnSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: dir, stdio: "inherit", shell: true });
    if (r2.status !== 0) console.log(`    npm ci falló en ${r.folder}`);
  }
}
