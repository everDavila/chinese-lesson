"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Check, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { castVoteAction, studentStateAction, type StudentState } from "@/actions/vote";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PandaCodeMascot } from "@/components/vote/panda-code-mascot";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Página del alumno (mobile-first: vota desde el celular que usa para Zoom).
// Pregunta cada 2,5 s si la profesora abrió una palabra; si hay una, cuatro
// botones grandes. Votar otra vez cambia el voto.

const POLL_MS = 2500;
const CODE_LENGTH = 6;
const SUCCESS_REACTION_MS = 950;
const EMOJI = ["😕", "😣", "🙂", "😎"];

const hanziSize = (hanzi: string) => {
  const length = Array.from(hanzi).length;
  if (length === 1) return "text-[clamp(7.5rem,min(38vw,30vh),18rem)]";
  if (length === 2) return "text-[clamp(6rem,min(30vw,26vh),15rem)]";
  if (length === 3) return "text-[clamp(4.75rem,min(22vw,22vh),11rem)]";
  return "text-[clamp(3.5rem,min(16vw,18vh),8rem)]";
};

export function StudentVotePanel({
  hanzi,
  selectedRating,
  pending,
  saved,
  error,
  onVote,
}: {
  hanzi: string;
  selectedRating?: number;
  pending: boolean;
  saved: boolean;
  error: boolean;
  onVote: (rating: number) => void;
}) {
  const t = useTranslations("Vote");
  const ratings = t.raw("ratings") as string[];

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-border bg-card/70 px-3 py-4 shadow-sm sm:px-8 sm:py-7 lg:px-12 lg:py-9" aria-live="polite">
      <div className="flex min-h-[clamp(8rem,28dvh,20rem)] flex-1 items-center justify-center overflow-hidden py-2 sm:py-4">
        <p className={cn("font-hanzi leading-none tracking-tight [color:var(--hanzi-ink)]", hanziSize(hanzi))}>{hanzi}</p>
      </div>

      <div className="mx-auto w-full max-w-4xl shrink-0">
        <div className="space-y-2 text-center">
          <h1 className="text-balance text-base font-semibold sm:text-lg lg:text-xl">{t("question")}</h1>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <LockKeyhole className="size-3.5" aria-hidden />
            {t("anonymous")}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3" role="radiogroup" aria-label={t("question")}>
          {ratings.map((label, index) => {
            const rating = index + 1;
            const active = selectedRating === rating;
            return (
              <button
                key={rating}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={pending}
                onClick={() => onVote(rating)}
                className={cn(
                  "relative flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-2xl border bg-background/55 px-2 py-3 text-center transition-[border-color,background-color,transform] active:scale-[0.985] disabled:cursor-wait disabled:opacity-80 sm:min-h-28 sm:gap-2 sm:text-base lg:min-h-32",
                  active
                    ? "border-emerald-300 bg-emerald-400/15 font-semibold shadow-[inset_0_0_0_1px_var(--color-emerald-300)]"
                    : "border-border hover:border-primary/45 hover:bg-accent/60",
                )}
              >
                {active ? (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-emerald-300 text-emerald-950 sm:top-3 sm:right-3 sm:size-6">
                    <Check className="size-3.5 sm:size-4" strokeWidth={3} aria-hidden />
                  </span>
                ) : null}
                <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
                  {EMOJI[index]}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex min-h-5 items-center justify-center text-center text-xs sm:mt-4 sm:text-sm" aria-live="polite">
          {error ? (
            <p role="alert" className="text-destructive">
              {t("error")}
            </p>
          ) : pending ? (
            <p className="text-muted-foreground">{t("saving")}</p>
          ) : saved ? (
            <p className="flex items-center gap-1.5 text-emerald-300">
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
              {t("saved")}
            </p>
          ) : (
            <p className="text-muted-foreground">{t("selectOne")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function StudentVote({ code }: { code: string }) {
  const t = useTranslations("Vote");
  const [state, setState] = useState<StudentState | null>(null);
  // Voto elegido por ronda: al abrirse otra palabra, se empieza de cero.
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [voteError, setVoteError] = useState<string | null>(null);
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

  const vote = (evaluation: string, rating: number) => {
    const previousRating = chosen[evaluation];
    setChosen((current) => ({ ...current, [evaluation]: rating }));
    setSaved((current) => ({ ...current, [evaluation]: false }));
    setVoteError(null);

    startTransition(async () => {
      try {
        const ok = await castVoteAction(code, evaluation, rating);
        if (ok) {
          setSaved((current) => ({ ...current, [evaluation]: true }));
          return;
        }
        setVoteError(evaluation);
        setChosen((current) => {
          const next = { ...current };
          if (previousRating) next[evaluation] = previousRating;
          else delete next[evaluation];
          return next;
        });
        void poll(); // probablemente se cerró la votación
      } catch {
        setVoteError(evaluation);
        setChosen((current) => {
          const next = { ...current };
          if (previousRating) next[evaluation] = previousRating;
          else delete next[evaluation];
          return next;
        });
      }
    });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
      <header className="flex shrink-0 items-center justify-between gap-3 px-1">
        <span className="font-hanzi text-xl text-primary sm:text-2xl">认识</span>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs tracking-[0.18em] text-muted-foreground sm:text-sm">{code}</span>
          <LanguageSwitcher />
        </div>
      </header>

      {state === null ? (
        <section className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-border bg-card/70" aria-busy>
          <p className="animate-pulse text-muted-foreground">…</p>
        </section>
      ) : state.status === "invalid" ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-border bg-card/70 p-6 text-center">
          <p role="alert" className="text-lg">
            {t("invalid")}
          </p>
          <Link href="/v" className="rounded-full border border-border px-4 py-2 underline-offset-4 hover:bg-accent">
            {t("tryAnother")}
          </Link>
        </section>
      ) : state.status === "waiting" ? (
        <section className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-border bg-card/70 p-6 text-center" aria-live="polite">
          <p className="max-w-sm text-lg text-muted-foreground">{t("waiting")}</p>
        </section>
      ) : (
        <StudentVotePanel
          hanzi={state.hanzi}
          selectedRating={chosen[state.evaluation]}
          pending={pending}
          saved={saved[state.evaluation] ?? false}
          error={voteError === state.evaluation}
          onVote={(rating) => vote(state.evaluation, rating)}
        />
      )}
    </main>
  );
}

/** Formulario para escribir el código a mano (/v). */
export function CodeForm() {
  const t = useTranslations("Vote");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [caretIndex, setCaretIndex] = useState(0);
  const [codeError, setCodeError] = useState<"invalid" | "network" | null>(null);
  const [mascotReaction, setMascotReaction] = useState<"idle" | "confused" | "success">("idle");
  const [reactionKey, setReactionKey] = useState(0);
  const [checking, startChecking] = useTransition();
  const activeCodeIndex = focused ? Math.min(caretIndex, CODE_LENGTH - 1) : null;

  useLayoutEffect(() => {
    const pendingSelection = pendingSelectionRef.current;
    const input = inputRef.current;
    if (!pendingSelection || !input || document.activeElement !== input) return;

    pendingSelectionRef.current = null;
    input.setSelectionRange(pendingSelection.start, pendingSelection.end);
  }, [code]);

  const handleCodePointerDown = (event: ReactPointerEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const bounds = input.getBoundingClientRect();
    const tappedIndex = Math.max(
      0,
      Math.min(CODE_LENGTH - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * CODE_LENGTH)),
    );
    const selectionStart = Math.min(tappedIndex, code.length);
    const selectionEnd = selectionStart < code.length ? selectionStart + 1 : selectionStart;

    // Cada casilla se comporta como un carácter seleccionable aunque debajo
    // haya un único input (necesario para pegar y para el autocompletado móvil).
    event.preventDefault();
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
    setCaretIndex(selectionStart);
  };

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextCode = event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    const selectionStart = Math.min(event.currentTarget.selectionStart ?? nextCode.length, nextCode.length);

    // React vuelve a escribir el valor del input controlado y algunos
    // navegadores mandan su selección al final. Si todavía hay otro carácter,
    // lo dejamos seleccionado para poder corregir varias casillas seguidas.
    pendingSelectionRef.current = {
      start: selectionStart,
      end: selectionStart < nextCode.length ? selectionStart + 1 : selectionStart,
    };
    setCode(nextCode);
    setCaretIndex(selectionStart);
    setCodeError(null);
    setMascotReaction("idle");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length !== CODE_LENGTH || checking) return;

    startChecking(async () => {
      try {
        const state = await studentStateAction(clean);
        if (state.status !== "invalid") {
          setMascotReaction("success");
          setReactionKey((current) => current + 1);
          await new Promise((resolve) => window.setTimeout(resolve, SUCCESS_REACTION_MS));
          router.push(`/v/${encodeURIComponent(clean)}`);
          return;
        }
        setCodeError("invalid");
        setMascotReaction("confused");
      } catch {
        setCodeError("network");
        setMascotReaction("confused");
      }
      setReactionKey((current) => current + 1);
      inputRef.current?.focus();
    });
  };

  return (
    <main className="mx-auto flex w-full flex-1 max-w-md flex-col gap-4 px-4 py-6 sm:py-10">
      <header className="flex items-center justify-between">
        <span className="font-hanzi text-2xl">认识</span>
        <LanguageSwitcher />
      </header>
      <section className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("enterCode")}</p>
      </section>
      <form
        className="flex flex-col gap-2"
        onSubmit={handleSubmit}
        aria-busy={checking}
      >
        <PandaCodeMascot key={reactionKey} activeIndex={activeCodeIndex} reaction={mascotReaction} />
        {/* Seis casillas para que se vea si falta una letra. Por debajo es un
            solo campo (pegar, teclado del celular y lector de pantalla
            funcionan igual); las casillas solo lo dibujan. */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{t("codeLabel")}</span>
          <span className="relative grid grid-cols-6 gap-2">
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "flex h-14 items-center justify-center rounded-xl border-2 border-input bg-background font-mono text-3xl",
                  codeError && "border-destructive",
                  focused &&
                    i === activeCodeIndex &&
                    (codeError ? "border-destructive ring-1 ring-destructive" : "border-foreground"),
                )}
              >
                {code[i] ?? ""}
              </span>
            ))}
            <input
              ref={inputRef}
              value={code}
              onChange={handleCodeChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onPointerDown={handleCodePointerDown}
              onSelect={(event) => setCaretIndex(event.currentTarget.selectionStart ?? code.length)}
              aria-invalid={codeError !== null}
              aria-describedby={codeError ? "code-error" : undefined}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              spellCheck={false}
              maxLength={CODE_LENGTH}
              className="absolute inset-0 w-full cursor-text rounded-xl bg-transparent text-transparent caret-transparent selection:bg-transparent"
            />
          </span>
        </label>
        {codeError ? (
          <p id="code-error" role="alert" className="text-sm text-destructive">
            {t(codeError === "invalid" ? "invalid" : "checkError")}
          </p>
        ) : null}
        <button
          type="submit"
          className="h-12 rounded-xl bg-primary text-lg text-primary-foreground disabled:opacity-50"
          disabled={code.length < CODE_LENGTH || checking}
        >
          {checking ? t("checking") : t("go")}
        </button>
      </form>
    </main>
  );
}
