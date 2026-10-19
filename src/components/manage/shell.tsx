"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronDown, CircleUserRound, FilePlus2, FolderOpen, FolderPlus, Home, Library, LogOut, Plus, Search, Tags } from "lucide-react";
import { signOut } from "@/actions/auth";
import type { ActionError, Result } from "@/actions/manage";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

// Marco común de las vistas de docente y admin: barra superior, migas de
// pan, título con acciones y el error de la última acción.
export function ManageShell({
  isAdmin,
  crumbs,
  title,
  subtitle,
  actions,
  error,
  children,
  wide,
}: {
  isAdmin: boolean;
  crumbs: Crumb[];
  title: React.ReactNode;
  /** Descripción opcional bajo el título; sin ella no queda hueco. */
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const t = useTranslations("Manage");
  const tc = useTranslations("Common");
  const tw = useTranslations("TeacherWorkspace");
  const th = useTranslations("TeacherHome");
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const adminArea = pathname.startsWith("/admin");

  const content = (
    <main className={cn("mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:px-6", wide ? "max-w-7xl" : "max-w-5xl")}>
      {crumbs.length > 0 && (
        <nav aria-label={t("breadcrumb")} className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {c.href ? <Link href={c.href} className="hover:text-foreground hover:underline">{c.label}</Link> : <span className="text-foreground">{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      {(title || subtitle || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h1 className="text-3xl font-semibold">{title}</h1>}
            {subtitle && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {children}
    </main>
  );

  if (!adminArea) {
    const nav = [
      { href: "/" as const, label: tw("home"), icon: Home },
      { href: "/lessons" as const, label: tw("lessons"), icon: BookOpen },
      { href: "/collections" as const, label: tw("collections"), icon: FolderOpen },
      { href: "/library" as const, label: tw("library"), icon: Library },
    ];
    return (
      <div className="flex min-h-screen flex-1 bg-background">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
          <Link href="/" lang="zh-Hans" aria-label="Renshi" className="px-3 font-hanzi text-2xl font-semibold tracking-wide">认识</Link>
          <nav className="mt-8 flex flex-col gap-1" aria-label={tw("navLabel")}>
            <WorkspaceLink href="/" label={tw("home")} icon={Home} active={pathname === "/"} />
            <p className="mt-5 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{tw("workspaceLabel")}</p>
            <WorkspaceLink href="/lessons" label={tw("lessons")} icon={BookOpen} active={pathname.startsWith("/lessons")} />
            <WorkspaceLink href="/collections" label={tw("collections")} icon={FolderOpen} active={pathname.startsWith("/collections")} />
            <p className="mt-5 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{tw("libraryLabel")}</p>
            <WorkspaceLink href="/library/hsk" label={tw("hsk")} icon={Library} active={pathname.startsWith("/library/hsk")} />
            <WorkspaceLink href="/library#topics" label={tw("topics")} icon={Tags} />
            {isAdmin && <Link href="/admin" className="mt-4 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent">{t("nav.admin")}</Link>}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center gap-3 lg:gap-5">
              <Link href="/" lang="zh-Hans" aria-label="Renshi" className="mr-auto font-hanzi text-xl font-semibold lg:hidden">认识</Link>
              <form
                role="search"
                className="relative hidden max-w-3xl flex-1 sm:block"
                onSubmit={(event) => {
                  event.preventDefault();
                  router.push({ pathname: "/collections", query: search.trim() ? { q: search.trim() } : {} });
                }}
              >
                <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder={tw("search")} aria-label={tw("search")} className="h-12 w-full rounded-2xl border border-input bg-card pl-12 pr-4 text-base outline-none transition-colors focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/30" />
              </form>
              <details className="group relative hidden md:block">
                <summary className="flex h-12 cursor-pointer list-none items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  <Plus className="size-5" aria-hidden /> {t("create")}
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="absolute top-full right-0 z-30 mt-2 min-w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
                  <Link href="/lessons?create=1" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                    <FilePlus2 className="size-4 text-primary" aria-hidden /> {tw("createLesson")}
                  </Link>
                  <Link href="/collections?create=1" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                    <FolderPlus className="size-4 text-primary" aria-hidden /> {tw("createCollection")}
                  </Link>
                </div>
              </details>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <ThemeToggle />
                <LanguageSwitcher />
                <details className="group relative">
                  <summary className="flex h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    <CircleUserRound className="size-8 text-muted-foreground" aria-hidden />
                    <span className="hidden sm:inline">{th("teacher")}</span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="absolute top-full right-0 z-30 mt-2 min-w-44 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
                    <form action={signOut}>
                      <Button type="submit" variant="ghost" className="w-full justify-start">
                        <LogOut aria-hidden /> {tc("signOut")}
                      </Button>
                    </form>
                  </div>
                </details>
              </div>
            </div>
            <nav className="mx-auto mt-3 flex max-w-7xl gap-1 overflow-x-auto lg:hidden" aria-label={tw("navLabel")}>
              {nav.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm", (pathname === href || (href !== "/" && pathname.startsWith(href))) && "bg-accent text-primary")}>
                  <Icon className="size-4" aria-hidden /> {label}
                </Link>
              ))}
            </nav>
          </header>
          {content}
        </div>
      </div>
    );
  }

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
          <ThemeToggle />
          <LanguageSwitcher />
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              {tc("signOut")}
            </Button>
          </form>
        </div>
      </div>
      {content}
    </div>
  );
}

function WorkspaceLink({ href, label, icon: Icon, active = false }: { href: "/" | "/lessons" | "/collections" | "/library/hsk" | "/library#topics"; label: string; icon: typeof Home; active?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent", active && "bg-sidebar-accent text-primary")}>
      <Icon className="size-5" aria-hidden /> {label}
    </Link>
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
  const run = <T extends object>(fn: () => Promise<Result<T>>, onOk?: (r: { ok: true } & T) => void): Promise<Result<T> | undefined> =>
    new Promise((resolve) =>
      startTransition(async () => {
        const r = await fn();
        if (r.ok) {
          setError(null);
          onOk?.(r);
        } else {
          setError(t(r.error satisfies ActionError));
        }
        resolve(r);
      }),
    );
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
  descriptionPlaceholder,
  label,
  disabled,
  onCreate,
  initialOpen = false,
  variant,
  size,
  submitLabel,
}: {
  placeholder: string;
  /** Si se pasa, se ofrece una descripción opcional junto al nombre. */
  descriptionPlaceholder?: string;
  label: React.ReactNode;
  disabled?: boolean;
  onCreate: (title: string, description?: string) => void;
  initialOpen?: boolean;
  /** Botón que abre el formulario (por defecto, el principal). */
  variant?: "outline";
  size?: "sm";
  /** Texto del botón de enviar (por defecto «Crear»). */
  submitLabel?: string;
}) {
  const t = useTranslations("Manage");
  const [open, setOpen] = useState(initialOpen);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const close = () => {
    setOpen(false);
    setTitle("");
    setDescription("");
  };
  if (!open)
    return (
      <Button className="self-start" variant={variant} size={size} disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  return (
    <form
      // w-full y no basis-full: dentro de una columna, basis-full es toda la altura.
      className="flex w-full flex-wrap gap-2 rounded-xl border border-border bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) {
          onCreate(title.trim(), description.trim() || undefined);
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
      {descriptionPlaceholder && (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={descriptionPlaceholder}
          aria-label={descriptionPlaceholder}
          rows={2}
          className={cn(inputCls, "h-auto w-full resize-y py-2")}
        />
      )}
      <Button type="submit" disabled={!title.trim() || disabled}>
        {submitLabel ?? t("create")}
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
