// Crea la cuenta de una profesora (rol teacher, el de por defecto).
// La clave se pide dos veces sin mostrarla (no queda en el historial de la
// terminal); en scripts sin terminal se puede pasar por DOCENTE_CLAVE. Uso:
//   npm run db:crear-docente -- <correo>
//   (base de desarrollo: node --env-file=.env.dev.local scripts/crear-docente.mjs <correo>)
import { createClient } from "@supabase/supabase-js";
import { askNewPassword } from "./lib/prompt.mjs";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run db:crear-docente -- <correo>");
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

// El trigger on_auth_user_created debe haber creado el perfil con role teacher.
const { data: perfil } = await admin.from("profiles").select("display_name, role").eq("id", data.user.id).single();
console.log(perfil ? `perfil: ${perfil.display_name} (${perfil.role})` : "OJO: no se creó el perfil (revisa el trigger)");
