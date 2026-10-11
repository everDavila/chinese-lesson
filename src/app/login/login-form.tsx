"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Correo
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 rounded-lg border border-input bg-background px-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-10 rounded-lg border border-input bg-background px-3 text-base"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
