// Crea (o reutiliza) el proyecto de Supabase de desarrollo "hanzi-dev", le
// aplica todas las migraciones y deja sus claves en .env.dev.local (fuera de
// git). Producción no se toca: sus comandos siguen leyendo .env.local.
//
// Requisito, una sola vez y por la persona: `npx supabase login`.
// Uso: npm run db:dev:crear
// Después: npm run db:dev:copiar (contenido de producción → desarrollo).
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const NAME = "hanzi-dev";
const REGION = "sa-east-1"; // la de producción: mismo comportamiento y latencia
const ENV_FILE = ".env.dev.local";

const prodRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const secrets = [];
const mask = (text) => secrets.reduce((t, s) => t.replaceAll(s, "<oculto>"), text);

// Ejecuta la CLI de Supabase; nada de lo que imprime sale sin enmascarar.
function cli(args, { json = false } = {}) {
  const quote = (a) => `"${String(a).replaceAll('"', '\\"')}"`;
  const all = ["--yes", "supabase@2", ...args, ...(json ? ["-o", "json"] : [])].map(quote);
  return new Promise((resolve, reject) => {
    const child = spawn("npx", all, { shell: true });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("exit", (code) => {
      if (code !== 0) return reject(new Error(mask(err || out).trim()));
      if (!json) return resolve(out);
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error(`Respuesta inesperada de la CLI: ${mask(out).slice(0, 300)}`));
      }
    });
  });
}

const step = (msg) => console.log(`\n→ ${msg}`);

step("Compruebo la sesión de la CLI");
let projects;
try {
  projects = await cli(["projects", "list"], { json: true });
} catch (e) {
  console.error(/access token|login/i.test(e.message) ? "La CLI no tiene sesión: ejecuta `npx supabase login` y vuelve a intentarlo." : e.message);
  process.exit(1);
}
const prod = projects.find((p) => (p.id ?? p.ref) === prodRef);
if (!prod) {
  console.error(`Esta cuenta no ve el proyecto de producción (${prodRef}). ¿Iniciaste sesión con la cuenta correcta?`);
  process.exit(1);
}

let dev = projects.find((p) => p.name === NAME);
let password;
const saved = existsSync(ENV_FILE)
  ? Object.fromEntries(
      readFileSync(ENV_FILE, "utf8")
        .split(/\r?\n/)
        .filter((l) => l.includes("=") && !l.startsWith("#"))
        .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
    )
  : {};

if (dev) {
  step(`El proyecto ${NAME} ya existe: lo reutilizo`);
  password = saved.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error(`Falta SUPABASE_DB_PASSWORD en ${ENV_FILE}. Si se perdió, cámbiala en el panel de Supabase y escríbela ahí.`);
    process.exit(1);
  }
} else {
  step(`Creo ${NAME} en ${REGION} (plan gratuito, misma organización que producción)`);
  password = randomBytes(24).toString("base64url");
  secrets.push(password);
  dev = await cli(
    ["projects", "create", NAME, "--org-id", prod.organization_id, "--region", REGION, "--db-password", password],
    { json: true },
  );
}
secrets.push(password);
const devRef = dev.id ?? dev.ref;
if (!devRef || devRef === prodRef) {
  console.error("No pude identificar el proyecto de desarrollo (o coincide con producción). No sigo.");
  process.exit(1);
}

step("Espero a que el proyecto esté listo (puede tardar un par de minutos)");
for (let i = 0; ; i++) {
  const p = (await cli(["projects", "list"], { json: true })).find((x) => (x.id ?? x.ref) === devRef);
  if (p?.status === "ACTIVE_HEALTHY") break;
  if (i > 60) {
    console.error(`Sigue sin estar listo (estado: ${p?.status}). Vuelve a ejecutar el script en unos minutos.`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 10_000));
}

step("Leo las claves de la API");
const keys = await cli(["projects", "api-keys", "--project-ref", devRef, "--reveal"], { json: true });
const pick = (types, names) =>
  keys.find((k) => types.includes(k.type))?.api_key ?? keys.find((k) => names.includes(k.name))?.api_key;
const publishable = pick(["publishable"], ["anon"]);
const secret = pick(["secret"], ["service_role"]);
if (!publishable || !secret) {
  console.error("No encontré las claves publishable/secret en la respuesta de la CLI.");
  process.exit(1);
}
secrets.push(publishable, secret);

writeFileSync(
  ENV_FILE,
  [
    "# Base de DESARROLLO (hanzi-dev). Generado por scripts/crear-base-dev.mjs.",
    "# Nunca a git. Producción sigue en .env.local.",
    `NEXT_PUBLIC_SUPABASE_URL=https://${devRef}.supabase.co`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishable}`,
    `SUPABASE_SECRET_KEY=${secret}`,
    `SUPABASE_PROJECT_REF=${devRef}`,
    `SUPABASE_DB_PASSWORD=${password}`,
    "",
  ].join("\n"),
);
console.log(`Claves guardadas en ${ENV_FILE}`);

step("Aplico todas las migraciones al proyecto de desarrollo");
// --yes: la CLI pide confirmación antes de aplicar.
console.log(mask(await cli(["db", "push", "--project-ref", devRef, "--password", password, "--include-all", "--yes"])));

console.log(`\nListo. Base de desarrollo: https://${devRef}.supabase.co
Siguiente: npm run db:dev:copiar  (copia el contenido de producción)
Para usarla: npm run dev:base-dev  (servidor en el puerto 3001)`);
