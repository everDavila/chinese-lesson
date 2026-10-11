import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// Cliente de Supabase para componentes de servidor, server actions y rutas.
// Uno nuevo por petición; la sesión de la profesora viaja en cookies.
export async function createClient() {
  // Supabase compara la caducidad del token con Date.now(); con Cache
  // Components eso es un error si llega a prerenderizarse. connection()
  // asegura que todo lo que sigue corre solo con la petición real.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(toSet) {
          // En un componente de servidor no se pueden escribir cookies; el
          // proxy ya refresca la sesión, así que se puede ignorar.
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    },
  );
}
