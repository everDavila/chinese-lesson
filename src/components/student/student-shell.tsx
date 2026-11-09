"use client";

import { ChevronDown, CircleUserRound, Home, LogOut, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Marco del espacio del alumno: el de la docente sin crear lecciones ni
// colecciones. Solo enlaza lo que existe; las colecciones de estudio y el
// progreso se suman cuando haya con qué llenarlos. Muestra quién tiene la
// sesión abierta.
export function StudentShell({ name, children }: { name: string; children: React.ReactNode }) {
  const t = useTranslations("StudentWorkspace");
  const tc = useTranslations("Common");
  const pathname = usePathname();
  const nav = [
    { href: "/" as const, label: t("home"), icon: Home, active: pathname === "/" },
    { href: "/estudiante" as const, label: t("practice"), icon: PenLine, active: pathname.startsWith("/estudiante") },
  ];

  return (
    <div className="flex min-h-screen flex-1 bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Link href="/" lang="zh-Hans" aria-label="Renshi" className="px-3 font-hanzi text-2xl font-semibold tracking-wide">认识</Link>
        <nav className="mt-8 flex flex-col gap-1" aria-label={t("navLabel")}>
          {nav.map(({ href, label, icon: Icon, active }) => (
            <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent", active && "bg-sidebar-accent text-primary")}>
              <Icon className="size-5" aria-hidden /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <Link href="/" lang="zh-Hans" aria-label="Renshi" className="mr-auto font-hanzi text-xl font-semibold lg:hidden">认识</Link>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <LanguageSwitcher />
              <details className="group relative">
                <summary className="flex h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  <CircleUserRound className="size-8 text-muted-foreground" aria-hidden />
                  <span className="hidden flex-col items-start leading-tight sm:flex">
                    <span>{name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{t("role")}</span>
                  </span>
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
          <nav className="mx-auto mt-3 flex max-w-7xl gap-1 overflow-x-auto lg:hidden" aria-label={t("navLabel")}>
            {nav.map(({ href, label, icon: Icon, active }) => (
              <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm", active && "bg-accent text-primary")}>
                <Icon className="size-4" aria-hidden /> {label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
