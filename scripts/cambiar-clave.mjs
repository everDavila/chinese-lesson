// Cambia la contraseña de una cuenta (no hay correo configurado para
// recuperarla). La clave se pide dos veces sin mostrarla: no va en la línea
// de comandos, así que no queda en el historial de la terminal. Ejecutarlo
// en una terminal propia, no a través de un agente. Uso:
//   npm run db:cambiar-clave -- <correo>
import { createClient } from "@supabase/supabase-js";
import { stdin, stdout } from "node:process";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run db:cambiar-clave -- <correo>");
  process.exit(1);
}
if (!stdin.isTTY) {
  console.error("Ejecútalo en tu propia terminal: la clave se escribe a mano y no se muestra.");
  process.exit(1);
}

// Lee una línea sin eco en pantalla.
function ask(prompt) {
  return new Promise((resolve) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const onData = (buf) => {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value);
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

let user = null;
for (let page = 1; !user; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("No pude leer los usuarios:", error.message);
    process.exit(1);
  }
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 200) break;
}
if (!user) {
  console.error(`No existe ninguna cuenta con ${email}`);
  process.exit(1);
}

const password = await ask(`Nueva clave para ${email}: `);
if (password.length < 8) {
  console.error("Mínimo 8 caracteres. No se cambió nada.");
  process.exit(1);
}
if ((await ask("Repítela: ")) !== password) {
  console.error("No coinciden. No se cambió nada.");
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, { password });
console.log(error ? `No se pudo cambiar: ${error.message}` : `Clave de ${email} cambiada. Ya puedes iniciar sesión.`);
