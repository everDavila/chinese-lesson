import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Hanzi" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <header>
        <p className="font-hanzi text-4xl">汉字</p>
        <h1 className="mt-2 text-2xl font-semibold">Entrar como profesora</h1>
        <p className="text-sm text-muted-foreground">Los alumnos no necesitan cuenta.</p>
      </header>
      <LoginForm />
      <Link href="/present" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Ver la lección de demo sin entrar
      </Link>
    </main>
  );
}
