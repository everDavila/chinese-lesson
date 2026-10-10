"use client";

import { cn } from "@/lib/utils";

export type Rating = 1 | 2 | 3 | 4;

export const RATINGS: { value: Rating; label: string; emoji: string; className: string }[] = [
  { value: 1, label: "No la sé", emoji: "😕", className: "bg-rating-1/15 border-rating-1/40 data-[active=true]:bg-rating-1/35" },
  { value: 2, label: "Me costó", emoji: "😣", className: "bg-rating-2/15 border-rating-2/40 data-[active=true]:bg-rating-2/35" },
  { value: 3, label: "Bien", emoji: "🙂", className: "bg-rating-3/15 border-rating-3/40 data-[active=true]:bg-rating-3/35" },
  { value: 4, label: "Fácil", emoji: "😎", className: "bg-rating-4/15 border-rating-4/40 data-[active=true]:bg-rating-4/35" },
];

// Semáforo a partir de la valoración de la profesora (DIAGNOSTICO-MODO-CLASE.md).
const VERDICT: Record<Rating, { text: string; dot: string }> = {
  1: { text: "Requiere refuerzo", dot: "bg-rating-1" },
  2: { text: "Necesita repaso", dot: "bg-rating-2" },
  3: { text: "Dominio aparente", dot: "bg-rating-3" },
  4: { text: "Dominio aparente", dot: "bg-rating-3" },
};

export function GroupRating({
  value,
  onChange,
}: {
  value: Rating | undefined;
  onChange: (rating: Rating | undefined) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-background/60 px-5 py-3" aria-label="Comprensión del grupo">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <h2 className="font-medium">Comprensión del grupo</h2>
          <p className="text-sm text-muted-foreground">
            {value ? (
              <span className="inline-flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", VERDICT[value].dot)} />
                {VERDICT[value].text} · según la profesora
              </span>
            ) : (
              "Pregunta al grupo y marca una valoración (teclas 1–4)."
            )}
          </p>
        </div>
        <div className="ml-auto flex gap-2" role="radiogroup" aria-label="Valoración del grupo">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={value === r.value}
              data-active={value === r.value}
              onClick={() => onChange(value === r.value ? undefined : r.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                r.className,
              )}
            >
              <span aria-hidden>{r.emoji}</span>
              {r.label}
              <kbd className="rounded bg-background/70 px-1.5 text-xs text-muted-foreground">{r.value}</kbd>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
