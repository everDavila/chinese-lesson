// Ejecuta la CLI de Supabase contra la base del proyecto usando
// SUPABASE_DB_URL de .env.local, sin que la URL (con la contraseña)
// aparezca nunca en la consola. Uso:
//   node --env-file=.env.local scripts/db.mjs migration list
//   node --env-file=.env.local scripts/db.mjs db push
import { spawn } from "node:child_process";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Falta SUPABASE_DB_URL en .env.local (ver .env.example).");
  process.exit(1);
}

const password = decodeURIComponent(new URL(dbUrl).password);
const mask = (text) =>
  text.replaceAll(dbUrl, "<SUPABASE_DB_URL>").replaceAll(password, "<password>");

// npx en Windows es un .cmd y necesita shell: se entrecomillan los
// argumentos para que la contraseña no se rompa con caracteres especiales.
const quote = (a) => `"${a.replaceAll('"', '\\"')}"`;
const args = ["--yes", "supabase@2", ...process.argv.slice(2), "--db-url", dbUrl].map(quote);
const child = spawn("npx", args, { shell: true });
child.stdout.on("data", (d) => process.stdout.write(mask(d.toString())));
child.stderr.on("data", (d) => process.stderr.write(mask(d.toString())));
child.on("exit", (code) => process.exit(code ?? 1));
