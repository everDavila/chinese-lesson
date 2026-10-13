// Carpetas de trabajo según TRABAJO-EN-CURSO.md.
//   npm run worktrees                 crea las que falten y copia .env/sesiones
//   npm run worktrees -- --instalar   además corre npm ci en las nuevas
//   npm run worktrees -- --estado     solo informa, sin fetch ni escrituras
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const onlyStatus = args.includes("--estado");
const install = args.includes("--instalar");
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const reportError = (head, message) => {
  console.log(`✗ ${head}\n    ${message}`);
  process.exitCode = 1;
};

function run() {
  // El registro de la principal es compartido; los worktrees pueden tener copias viejas.
  const main = path.dirname(path.resolve(git(process.cwd(), "rev-parse", "--path-format=absolute", "--git-common-dir")));
  const parent = path.dirname(main);
  const commonDir = realpathSync(git(main, "rev-parse", "--path-format=absolute", "--git-common-dir"));
  const tablePath = path.join(main, "TRABAJO-EN-CURSO.md");
  if (!existsSync(tablePath)) throw new Error("No encuentro TRABAJO-EN-CURSO.md en la carpeta principal.");
  const table = readFileSync(tablePath, "utf8").split("## Tabla")[1] ?? "";
  const rows = table.split(/\r?\n/)
    .filter((line) => line.startsWith("|") && !/^\|\s*-/.test(line))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .map(([agent, branchCell, folderCell, port]) => {
      // "Claude Code" -> "claude-code"; "Codex" -> "codex".
      const owner = agent?.toLowerCase().replace(/\s+/g, "-") ?? "";
      const branch = branchCell?.match(/`([^`]+)`/)?.[1];
      return { agent, owner, branch, folder: folderCell?.match(/`([^`]+)`/)?.[1], port,
        expected: `${owner}-chinese-lesson-${branch?.replace(/\//g, "-")}` };
    })
    .filter((row) => row.branch);

  if (!rows.length) {
    console.log("TRABAJO-EN-CURSO.md no tiene filas con rama.");
    return;
  }
  // No esconder fallos de fetch detrás de referencias locales posiblemente viejas.
  if (!onlyStatus) git(main, "fetch", "--quiet", "origin");
  const registered = git(main, "worktree", "list", "--porcelain").split("\n\n");
  const refs = new Set(git(main, "for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes/origin").split("\n"));
  const seenFolders = new Set();

  for (const row of rows) {
    const head = `${row.agent} · ${row.branch}${row.port && row.port !== "—" ? ` · puerto ${row.port}` : ""}`;
    try {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.owner)) throw new Error("Agente inválido para el nombre de carpeta.");
      git(main, "check-ref-format", "--branch", row.branch);
      for (const name of [row.expected, row.folder].filter(Boolean)) {
        if (name === "." || name === ".." || /[/\\]/.test(name)) throw new Error("La carpeta debe ser un nombre, sin rutas.");
      }
      if (seenFolders.has(row.expected)) throw new Error("Nombre de carpeta duplicado en la tabla.");
      seenFolders.add(row.expected);
      const canonical = path.join(parent, row.expected);
      const legacy = row.folder && row.folder !== row.expected ? path.join(parent, row.folder) : null;
      if (legacy && existsSync(legacy) && existsSync(canonical)) throw new Error("Existen la carpeta antigua y la canónica; revisa la tabla.");
      // Conservar una carpeta antigua existente, pero crear siempre con el nombre derivado.
      const dir = legacy && existsSync(legacy) ? legacy : canonical;
      const location = `${head} → ${path.basename(dir)}`;
      if (existsSync(dir)) {
        const top = git(dir, "rev-parse", "--show-toplevel");
        const common = git(dir, "rev-parse", "--path-format=absolute", "--git-common-dir");
        if (realpathSync(top) !== realpathSync(dir) || realpathSync(common) !== commonDir) {
          throw new Error("La carpeta no es un worktree de este repositorio.");
        }
        const branch = git(dir, "symbolic-ref", "--quiet", "--short", "HEAD");
        if (branch !== row.branch) throw new Error(`La carpeta tiene la rama ${branch}, pero la tabla indica ${row.branch}.`);
        const dirty = git(dir, "status", "--porcelain").split("\n").filter(Boolean).length;
        const upstream = git(dir, "for-each-ref", "--format=%(upstream)", `refs/heads/${row.branch}`);
        const ahead = upstream ? Number(git(dir, "rev-list", "--count", `${upstream}..HEAD`)) : 0;
        const behind = upstream ? Number(git(dir, "rev-list", "--count", `HEAD..${upstream}`)) : 0;
        const notes = [dirty ? `${dirty} archivo(s) sin commitear` : "sin cambios pendientes",
          upstream ? (ahead ? `${ahead} commit(s) sin subir` : "sin commits pendientes de subir") : "rama SIN UPSTREAM",
          ...(behind ? [`${behind} commit(s) por traer`] : []),
          ...(dir !== canonical ? [`nombre fuera de convenio: debería ser \`${row.expected}\`; no se renombra`] : [])];
        console.log(`${dirty || !upstream || ahead || behind || dir !== canonical ? "⚠" : "✓"} ${location}\n    ${notes.join(" · ")}`);
        continue;
      }
      const occupant = registered.find((block) => block.split("\n").includes(`branch refs/heads/${row.branch}`));
      if (occupant) {
        reportError(location, `La rama ya está en \`${occupant.match(/^worktree (.+)$/m)?.[1]}\`: no se crea otra carpeta.`);
        continue;
      }
      if (onlyStatus) {
        console.log(`· ${location}\n    no existe en esta PC`);
        continue;
      }
      const local = refs.has(`refs/heads/${row.branch}`);
      const remote = refs.has(`refs/remotes/origin/${row.branch}`);
      if (!local && !remote) throw new Error(`La rama no existe localmente ni en GitHub: sube ${row.branch} desde la PC donde se trabajó.`);
      if (local) git(main, "worktree", "add", canonical, row.branch);
      else git(main, "worktree", "add", "--track", "-b", row.branch, canonical, `origin/${row.branch}`);
      registered.push(`worktree ${canonical}\nbranch refs/heads/${row.branch}`);
      const copied = [".env.local", ".env.dev.local", "tests/.auth", "tests/.auth-dev"].filter((file) => {
        const from = path.join(main, file);
        const to = path.join(canonical, file);
        if (!existsSync(from) || existsSync(to)) return false;
        cpSync(from, to, { recursive: true });
        return true;
      });
      console.log(`+ ${location}\n    creada${copied.length ? `; copiados: ${copied.join(", ")}` : ""}`);
      if (install) {
        const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["ci", "--no-audit", "--no-fund"], {
          cwd: canonical, stdio: "inherit", shell: process.platform === "win32",
        });
        if (result.status !== 0) throw new Error("npm ci falló en la carpeta nueva.");
      }
    } catch (error) {
      reportError(head, error.message);
    }
  }
}

try {
  run();
} catch (error) {
  reportError("No se pudo comprobar o preparar los worktrees", error.message);
}
