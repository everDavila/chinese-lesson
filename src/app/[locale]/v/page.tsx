import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CodeForm } from "@/components/vote/student-vote";

export const metadata: Metadata = { title: "Renshi" };

// Entrada de los alumnos sin el código en la URL: lo escriben a mano.
export default async function Page({ params }: PageProps<"/[locale]/v">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CodeForm />;
}
