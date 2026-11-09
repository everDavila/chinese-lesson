// Crea una cuenta con correo y clave y le fija el rol (por defecto teacher; con
// --rol student crea un alumno). Desde la migración 20261109000000 el rol por
// defecto de un usuario nuevo es student, así que el rol se fija aquí.
// La clave se pide dos veces sin mostrarla (no queda en el historial de la
// terminal); en scripts sin terminal se puede pasar por DOCENTE_CLAVE. Uso:
//   npm run db:crear-docente -- <correo> [--rol teacher|student]
//   (base de desarrollo: node --env-file=.env.dev.local scripts/crear-docente.mjs <correo>)
import { createClient } from "@supabase/supabase-js";
import { askNewPassword } from "./lib/prompt.mjs";

const args = process.argv.slice(2);
const rolIdx = args.indexOf("--rol");
const role = rolIdx >= 0 ? args[rolIdx + 1] : "teacher";
if (!["teacher", "student"].includes(role)) {
  console.error("--rol admite teacher o student (admin: npm run db:promover-admin)");
  process.exit(1);
}
const email = args.find((a, i) => !a.startsWith("--") && i !== rolIdx + 1)?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run db:crear-docente -- <correo> [--rol teacher|student]");
  process.exit(1);
}
const password = process.env.DOCENTE_CLAVE ?? (await askNewPassword(email));

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
console.log(`Base: ${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}`);

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // sin SMTP configurado, confirmar aquí evita depender del correo
  user_metadata: { display_name: email.split("@")[0] },
});
if (error) {
  console.error(error.message.includes("already") ? `${email} ya existe` : `No pude crear el usuario: ${error.message}`);
  process.exit(1);
}
console.log(`usuario creado: ${email} (${data.user.id})`);

// El trigger on_auth_user_created crea el perfil como student: se fija el rol aquí.
await admin.from("profiles").update({ role }).eq("id", data.user.id);
const { data: perfil } = await admin.from("profiles").select("display_name, role").eq("id", data.user.id).single();
console.log(perfil ? `perfil: ${perfil.display_name} (${perfil.role})` : "OJO: no se creó el perfil (revisa el trigger)");
