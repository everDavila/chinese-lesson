"use client";

import type { StudentLabels } from "@/lib/student-labels";
import { cn } from "@/lib/utils";

export type Rating = 1 | 2 | 3 | 4;

// Sin seleccionar, los cuatro son iguales y neutros (solo cambia el emoji);
// el color aparece únicamente en el elegido, para que se note cuál es.
const RATING_STYLES: { value: Rating; emoji: string; className: string }[] = [
  { value: 1, emoji: "😕", className: "data-[active=true]:border-rating-1 data-[active=true]:bg-rating-1/30" },
  { value: 2, emoji: "😣", className: "data-[active=true]:border-rating-2 data-[active=true]:bg-rating-2/30" },
  { value: 3, emoji: "🙂", className: "data-[active=true]:border-rating-3 data-[active=true]:bg-rating-3/30" },
  { value: 4, emoji: "😎", className: "data-[active=true]:border-rating-4 data-[active=true]:bg-rating-4/30" },
];

// Semáforo a partir de la valoración docente (DIAGNOSTICO-MODO-CLASE.md).
const VERDICT: Record<Rating, { key: keyof StudentLabels["verdicts"]; dot: string }> = {
  1: { key: "reinforce", dot: "bg-rating-1" },
  2: { key: "review", dot: "bg-rating-2" },
  3: { key: "mastered", dot: "bg-rating-3" },
  4: { key: "mastered", dot: "bg-rating-3" },
};

// Va en la tarjeta, que ve toda la clase: textos en el idioma de los alumnos.
export function GroupRating({
  value,
  onChange,
  labels,
}: {
  value: Rating | undefined;
  onChange: (rating: Rating | undefined) => void;
  labels: StudentLabels;
}) {
  return (
    <section className="rounded-xl border border-border bg-background/60 px-5 py-3" aria-label={labels.groupTitle}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <h2 className="font-medium">{labels.groupTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {value ? (
              <span className="inline-flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", VERDICT[value].dot)} />
                {labels.verdicts[VERDICT[value].key]} · {labels.groupSource}
              </span>
            ) : (
              labels.groupPrompt
            )}
          </p>
        </div>
        {/* En celular, 2×2 a todo el ancho con botones de 44 px (auditoría
            UX, P0); desde sm, una fila a la derecha. */}
        <div
          className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto"
          role="radiogroup"
          aria-label={labels.groupTitle}
        >
          {RATING_STYLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={value === r.value}
              data-active={value === r.value}
              onClick={() => onChange(value === r.value ? undefined : r.value)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted data-[active=true]:font-medium sm:justify-start",
                r.className,
              )}
            >
              <span aria-hidden>{r.emoji}</span>
              {labels.ratings[r.value - 1]}
              {/* El atajo de teclado no sirve en un celular. */}
              <kbd className="hidden rounded bg-background/70 px-1.5 text-xs text-muted-foreground sm:inline">{r.value}</kbd>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
