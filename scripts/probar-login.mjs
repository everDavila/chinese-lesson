// Comprueba que una cuenta puede iniciar sesión y qué ve. Uso:
//   $env:PRUEBA_CLAVE="..."; node --env-file=.env.local scripts/probar-login.mjs <correo>
// Usa la clave pública (anon), igual que el navegador: prueba las RLS reales.
import { createClient } from "@supabase/supabase-js";

const [email] = process.argv.slice(2);
const password = process.env.PRUEBA_CLAVE;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const db = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await db.auth.signInWithPassword({ email, password });
if (error) {
  console.error("No pudo iniciar sesión:", error.message);
  process.exit(1);
}
console.log(`sesión OK: ${email}`);

// Como la propia cuenta: la publishable key respeta las RLS.
const yo = createClient(url, key, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
});
const { data: perfil } = await yo.from("profiles").select("role").eq("id", data.user.id).single();
console.log("rol:", perfil?.role);

const { count: palabras } = await yo.from("words").select("*", { count: "exact", head: true });
console.log("palabras que ve:", palabras);

// La gobernanza deja la base común solo para admin: este insert debe fallar.
const { error: eInsert } = await yo
  .from("words")
  .insert({ hanzi: "试", hsk_level: 9, hsk_version: "3.0", origin: "ai" });
console.log(
  eInsert
    ? `no edita la base común (correcto): ${eInsert.message.slice(0, 60)}`
    : "OJO: pudo insertar en words siendo docente",
);
if (!eInsert) {
  await yo.from("words").delete().eq("hanzi", "试").eq("hsk_level", 9);
  console.log("(fila de prueba borrada)");
}
