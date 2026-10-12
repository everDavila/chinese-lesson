// Cambia la contraseña de una cuenta (no hay correo configurado para
// recuperarla). La clave se pide dos veces sin mostrarla: no va en la línea
// de comandos, así que no queda en el historial de la terminal. Ejecutarlo
// en una terminal propia, no a través de un agente. Uso:
//   npm run db:cambiar-clave -- <correo>
//   (base de desarrollo: node --env-file=.env.dev.local scripts/cambiar-clave.mjs <correo>)
import { createClient } from "@supabase/supabase-js";
import { askNewPassword } from "./lib/prompt.mjs";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run db:cambiar-clave -- <correo>");
  process.exit(1);
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

const password = await askNewPassword(email);
const { error } = await admin.auth.admin.updateUserById(user.id, { password });
console.log(error ? `No se pudo cambiar: ${error.message}` : `Clave de ${email} cambiada. Ya puedes iniciar sesión.`);
