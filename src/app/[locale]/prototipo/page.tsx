import type { Metadata } from "next";
import { BookOpen, ShieldCheck } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: "Prototipo · Hanzi" };

// Entrada al prototipo navegable de las vistas de docente y admin.
export default async function PrototipoPage({ params }: PageProps<"/[locale]/prototipo">) {
  setRequestLocale((await params).locale);
  const cards = [
    {
      href: "/prototipo/docente",
      icon: BookOpen,
      title: "Vista docente",
      text: "Sus colecciones (p. ej. Básico 1), lecciones ordenadas, añadir palabras buscando o pegando la lista del libro, y presentar.",
    },
    {
      href: "/prototipo/admin",
      icon: ShieldCheck,
      title: "Vista admin",
      text: "La base común: catálogo HSK 1–3, editar sentidos, frases (con control de nivel) y notas, y las plantillas para las docentes.",
    },
  ];
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <header>
        <p className="text-sm text-muted-foreground">Hanzi · prototipo</p>
        <h1 className="text-3xl font-semibold">¿Con qué rol entras?</h1>
        <p className="mt-2 text-muted-foreground">
          Prototipo para recorrer el flujo: usa datos de ejemplo y guarda los cambios solo en este navegador.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-5 hover:bg-muted/50">
              <Icon className="size-6 text-primary" />
              <span className="text-lg font-semibold">{title}</span>
              <span className="text-sm text-muted-foreground">{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
