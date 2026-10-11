import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Todo menos archivos estáticos, imágenes y los trazos de hanzi-writer.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|hanzi-writer/).*)"],
};
