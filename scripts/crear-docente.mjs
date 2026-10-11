// Crea la cuenta de una profesora (rol teacher, el de por defecto).
// La clave se pasa por la variable DOCENTE_CLAVE para no dejarla en el
// historial del shell; si no está, se toma del segundo argumento.
// Uso: $env:DOCENTE_CLAVE="..."; node --env-file=.env.local scripts/crear-docente.mjs <correo>
import { createClient } from "@supabase/supabase-js";

const [email, claveArg] = process.argv.slice(2);
const password = process.env.DOCENTE_CLAVE ?? claveArg;
if (!email || !password) {
  console.error("Uso: node --env-file=.env.local scripts/crear-docente.mjs <correo> [clave]");
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

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
