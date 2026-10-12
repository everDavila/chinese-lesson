"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { castVoteAction, studentStateAction, type StudentState } from "@/actions/vote";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Página del alumno (mobile-first: vota desde el celular que usa para Zoom).
// Pregunta cada 2,5 s si la profesora abrió una palabra; si hay una, cuatro
// botones grandes. Votar otra vez cambia el voto.

const POLL_MS = 2500;
const EMOJI = ["😕", "😣", "🙂", "😎"];
const ACTIVE = [
  "border-rating-1 bg-rating-1/30",
  "border-rating-2 bg-rating-2/30",
  "border-rating-3 bg-rating-3/30",
  "border-rating-4 bg-rating-4/30",
];

export function StudentVote({ code }: { code: string }) {
  const t = useTranslations("Vote");
  const [state, setState] = useState<StudentState | null>(null);
  // Voto elegido por ronda: al abrirse otra palabra, se empieza de cero.
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const poll = useCallback(async () => {
    try {
      setState(await studentStateAction(code));
    } catch {
      // Sin red: se reintenta en el siguiente sondeo.
    }
  }, [code]);
  useEffect(() => {
    const first = window.setTimeout(() => void poll(), 0);
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [poll]);

  const vote = (evaluation: string, rating: number) =>
    startTransition(async () => {
      try {
        const ok = await castVoteAction(code, evaluation, rating);
        setError(!ok);
        if (ok) setChosen((c) => ({ ...c, [evaluation]: rating }));
        else void poll(); // probablemente se cerró la votación
      } catch {
        setError(true);
      }
    });

  const ratings = t.raw("ratings") as string[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <span className="font-hanzi text-2xl">汉字</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tracking-widest text-muted-foreground">{code}</span>
          <LanguageSwitcher />
        </div>
      </header>

      {state === null ? (
        <p className="text-muted-foreground" aria-busy>
          …
        </p>
      ) : state.status === "invalid" ? (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-lg">
            {t("invalid")}
          </p>
          <Link href="/v" className="self-start underline underline-offset-4">
            {t("tryAnother")}
          </Link>
        </div>
      ) : state.status === "waiting" ? (
        <p className="py-16 text-center text-lg text-muted-foreground" aria-live="polite">
          {t("waiting")}
        </p>
      ) : (
        <section className="flex flex-col gap-5" aria-live="polite">
          <div className="text-center">
            <p className="font-hanzi text-7xl leading-tight">{state.hanzi}</p>
            <p className="text-2xl text-muted-foreground">{state.pinyin}</p>
          </div>
          <h1 className="text-center text-lg font-medium">{t("question")}</h1>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("question")}>
            {ratings.map((label, i) => {
              const active = chosen[state.evaluation] === i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={pending}
                  onClick={() => vote(state.evaluation, i + 1)}
                  className={cn(
                    "flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-border bg-card text-lg transition-colors",
                    active && ACTIVE[i],
                    active && "font-semibold",
                  )}
                >
                  <span className="text-3xl" aria-hidden>
                    {EMOJI[i]}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
          {error ? (
            <p role="alert" className="text-center text-sm text-destructive">
              {t("error")}
            </p>
          ) : chosen[state.evaluation] ? (
            <p className="text-center text-sm text-muted-foreground">{t("saved")}</p>
          ) : null}
        </section>
      )}

      <p className="mt-auto text-center text-xs text-muted-foreground">{t("anonymous")}</p>
    </main>
  );
}

/** Formulario para escribir el código a mano (/v). */
export function CodeForm() {
  const t = useTranslations("Vote");
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <span className="font-hanzi text-2xl">汉字</span>
        <LanguageSwitcher />
      </header>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("enterCode")}</p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = code.trim().toUpperCase();
          if (clean) router.push(`/v/${encodeURIComponent(clean)}`);
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{t("codeLabel")}</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={6}
            className="h-14 rounded-xl border border-input bg-background px-4 text-center font-mono text-3xl tracking-[0.4em] uppercase"
          />
        </label>
        <button type="submit" className="h-12 rounded-xl bg-primary text-lg text-primary-foreground disabled:opacity-50" disabled={code.trim().length < 6}>
          {t("go")}
        </button>
      </form>
    </main>
  );
}
