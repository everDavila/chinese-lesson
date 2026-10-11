import "server-only";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getProfile, type Profile } from "./content";

// Protección de las vistas de docente y admin. RLS ya impide leer o escribir
// lo ajeno; esto evita mostrar pantallas vacías a quien no corresponde.

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) return redirect({ href: "/login", locale: await getLocale() });
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return redirect({ href: "/collections", locale: await getLocale() });
  return profile;
}
