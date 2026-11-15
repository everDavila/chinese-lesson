import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ManageShell, type Crumb } from "@/components/manage/shell";
import { StudentShell } from "@/components/student/student-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";
import type { Profile } from "@/lib/content";

// Marco de «Aprende» según quién lea: el espacio del alumno, el de la docente
// o, sin sesión, una página pública sencilla con invitación a entrar.
export async function AprendeFrame({
  profile,
  title,
  subtitle,
  crumbs,
  children,
}: {
  profile: Profile | null;
  title: string;
  subtitle?: string;
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  const head = (
    <header>
      <h1 className="text-3xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </header>
  );

  if (profile?.role === "student") {
    return (
      <StudentShell name={profile.displayName}>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
          {head}
          <div>{children}</div>
        </main>
      </StudentShell>
    );
  }

  if (profile) {
    return (
      <ManageShell isAdmin={profile.role === "admin"} crumbs={crumbs} title={title} subtitle={subtitle}>
        <div className="max-w-3xl">{children}</div>
      </ManageShell>
    );
  }

  const t = await getTranslations("Learn");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" lang="zh-Hans" aria-label="Renshi" className="mr-auto font-hanzi text-2xl font-semibold">认识</Link>
        <ThemeToggle />
        <LanguageSwitcher />
        <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-muted">{t("signIn")}</Link>
      </div>
      {head}
      <div>{children}</div>
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{t("publicInvite")}</p>
    </main>
  );
}
