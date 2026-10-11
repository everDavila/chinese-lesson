import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18n = createIntlMiddleware(routing);

// Primero el idioma (redirige o reescribe la URL con su prefijo); después
// Supabase refresca la sesión sobre esa misma respuesta.
export async function proxy(request: NextRequest) {
  return updateSession(request, handleI18n(request));
}

export const config = {
  // Todo menos archivos estáticos, imágenes y los trazos de hanzi-writer.
  // Ojo: "\\." en el string para que la regex reciba "\." (un punto literal).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|hanzi-writer/|.*\\..*).*)"],
};
