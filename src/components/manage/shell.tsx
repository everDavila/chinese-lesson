"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { signOut } from "@/actions/auth";
import type { ActionError, Result } from "@/actions/manage";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

// Marco común de las vistas de docente y admin: barra superior, migas de
// pan, título con acciones y el error de la última acción.
export function ManageShell({
  isAdmin,
  crumbs,
  title,
  actions,
  error,
  children,
  wide,
}: {
  isAdmin: boolean;
  crumbs: Crumb[];
  title: React.ReactNode;
  actions?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const t = useTranslations("Manage");
  const tc = useTranslations("Common");
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 sm:px-6">
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/collections" className="mr-2 font-hanzi text-xl">
            认识
          </Link>
          <Link href="/collections" className="rounded-md px-2 py-1 hover:bg-muted">
            {t("nav.collections")}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="rounded-md px-2 py-1 hover:bg-muted">
              {t("nav.admin")}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              {tc("signOut")}
            </Button>
          </form>
        </div>
      </div>
      <main className={cn("mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:px-6", wide ? "max-w-6xl" : "max-w-5xl")}>
        {crumbs.length > 0 && (
          <nav aria-label={t("breadcrumb")} className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
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
        )}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 text-3xl font-semibold">{title}</h1>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">{children}</p>
  );
}

/**
 * Ejecuta una acción del servidor en una transición y guarda su error ya
 * traducido. Devuelve el resultado para encadenar (p. ej. navegar al id).
 */
export function useRunner() {
  const t = useTranslations("Manage.errors");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = <T extends object>(fn: () => Promise<Result<T>>, onOk?: (r: { ok: true } & T) => void) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        setError(null);
        onOk?.(r);
      } else {
        setError(t(r.error satisfies ActionError));
      }
    });
  return { pending, error, setError, run };
}

export const inputCls = "h-9 min-w-0 rounded-lg border border-input bg-background px-3";

/**
 * Crear algo con nombre: primero un botón ("Nueva colección") y, al pulsarlo,
 * el campo del nombre con Crear y Cancelar. Un campo suelto con un botón al
 * lado se confundía con un buscador.
 */
export function NewTitleForm({
  placeholder,
  label,
  disabled,
  onCreate,
}: {
  placeholder: string;
  label: React.ReactNode;
  disabled?: boolean;
  onCreate: (title: string) => void;
}) {
  const t = useTranslations("Manage");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const close = () => {
    setOpen(false);
    setTitle("");
  };
  if (!open)
    return (
      <Button className="self-start" disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  return (
    <form
      className="flex basis-full flex-wrap gap-2 rounded-xl border border-border bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) {
          onCreate(title.trim());
          close();
        }
      }}
      onKeyDown={(e) => e.key === "Escape" && close()}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputCls, "min-w-48 flex-1")}
      />
      <Button type="submit" disabled={!title.trim() || disabled}>
        {t("create")}
      </Button>
      <Button type="button" variant="ghost" onClick={close}>
        {t("cancel")}
      </Button>
    </form>
  );
}

/** Buscador de una lista, con su lupa para que no se confunda con un campo de alta. */
export function SearchInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        className={cn(inputCls, "w-full pl-9")}
      />
    </div>
  );
}

/** Significado en el idioma de la interfaz: español si es "es", si no inglés. */
export function meaningFor(locale: string, s: { meaningEs: string; meaningEn: string }) {
  return locale === "es" ? s.meaningEs || s.meaningEn : s.meaningEn || s.meaningEs;
}
