import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { ACCESS_MAIL } from "@/lib/contact";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./login-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Login" });
  return { title: `${t("title")} · Renshi` };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Login");
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <header>
        <div className="flex items-center justify-between gap-4">
          <p className="font-hanzi text-4xl">认识</p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <LoginForm />
      {/* Acceso por invitación: se pide por correo (sin registro abierto). */}
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <a href={ACCESS_MAIL} className="font-medium text-foreground underline underline-offset-4">
          {t("requestAccess")}
        </a>
      </p>
      <Link href="/present" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        {t("demoLink")}
      </Link>
    </main>
  );
}
