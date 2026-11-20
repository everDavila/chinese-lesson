import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CodeForm } from "@/components/vote/student-vote";

export const metadata: Metadata = { title: "Renshi" };

// Clase en vivo, entrada de los alumnos sin el código en la URL: lo escriben a mano.
export default async function Page({ params }: PageProps<"/[locale]/live">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CodeForm />;
}
