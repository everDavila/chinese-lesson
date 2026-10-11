// Promueve a admin una cuenta concreta. La gobernanza deja la base común
// solo para admin. Antes promovía a todos los perfiles: corrido otra vez,
// habría hecho admin a la profesora. Ahora exige el correo.
// Uso: npm run db:promover-admin -- <correo>
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run db:promover-admin -- <correo>");
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

// Auth no busca por correo: se recorren las páginas de usuarios.
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

const { data: perfil } = await admin.from("profiles").select("role").eq("id", user.id).single();
if (perfil?.role === "admin") {
  console.log(`${email} ya era admin`);
  process.exit(0);
}
const { error } = await admin.from("profiles").update({ role: "admin" }).eq("id", user.id);
console.log(error ? `Fallo al promover ${email}: ${error.message}` : `${email} promovido a admin`);
