// Promueve a admin los perfiles que aún no lo son. La gobernanza deja la base
// común solo para admin; sin esto Ever se quedaría fuera de su contenido.
// Uso: node --env-file=.env.local scripts/promover-admin.mjs
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { data: perfiles, error } = await admin.from("profiles").select("id, role");
if (error) {
  console.error("No pude leer perfiles:", error.message);
  process.exit(1);
}
for (const p of perfiles) {
  if (p.role === "admin") {
    console.log(`${p.id}: ya era admin`);
    continue;
  }
  const { error: e } = await admin.from("profiles").update({ role: "admin" }).eq("id", p.id);
  console.log(e ? `Fallo al promover ${p.id}: ${e.message}` : `${p.id}: promovido a admin`);
}
