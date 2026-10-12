// Servidor de desarrollo contra la base de DESARROLLO (hanzi-dev), en el
// puerto 3001. Next relanza su propio proceso y no admite `node --env-file`,
// así que se cargan aquí las variables de .env.dev.local y se le pasan: las
// que ya están en el entorno mandan sobre las de .env.local.
// Uso: npm run dev:base-dev
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

if (!existsSync(".env.dev.local")) {
  console.error("Falta .env.dev.local: primero npm run db:dev:crear.");
  process.exit(1);
}
const vars = Object.fromEntries(
  readFileSync(".env.dev.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
console.log(`Base de desarrollo: ${new URL(vars.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]} · http://localhost:3001`);

const child = spawn("npx", ["next", "dev", "-p", "3001"], { stdio: "inherit", shell: true, env: { ...process.env, ...vars } });
child.on("exit", (code) => process.exit(code ?? 1));
