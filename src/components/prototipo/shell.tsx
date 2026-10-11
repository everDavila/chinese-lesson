"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { prototype } from "./store";

export type Crumb = { label: string; href?: string };

// Marco común del prototipo: aviso de datos locales y migas de pan.
export function ProtoShell({
  crumbs,
  title,
  actions,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-6 py-2 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">Prototipo:</strong> los cambios se guardan solo en este navegador.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm("¿Volver a los datos de ejemplo? Se pierden los cambios de este navegador.")) {
              prototype.reset();
            }
          }}
        >
          <RotateCcw /> Restablecer ejemplo
        </Button>
      </div>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {c.href ? (
                <Link href={c.href} className="hover:text-foreground hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: "curada" | "borrador" | "sin contenido" }) {
  const style = {
    curada: "bg-rating-3/25 text-foreground",
    borrador: "bg-rating-2/25 text-foreground",
    "sin contenido": "bg-muted text-muted-foreground",
  }[status];
  return <span className={`rounded-md px-2 py-0.5 text-xs whitespace-nowrap ${style}`}>{status}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">{children}</p>
  );
}
