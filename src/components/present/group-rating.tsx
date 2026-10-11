"use client";

import type { StudentLabels } from "@/lib/student-labels";
import { cn } from "@/lib/utils";

export type Rating = 1 | 2 | 3 | 4;

const RATING_STYLES: { value: Rating; emoji: string; className: string }[] = [
  { value: 1, emoji: "😕", className: "bg-rating-1/15 border-rating-1/40 data-[active=true]:bg-rating-1/35" },
  { value: 2, emoji: "😣", className: "bg-rating-2/15 border-rating-2/40 data-[active=true]:bg-rating-2/35" },
  { value: 3, emoji: "🙂", className: "bg-rating-3/15 border-rating-3/40 data-[active=true]:bg-rating-3/35" },
  { value: 4, emoji: "😎", className: "bg-rating-4/15 border-rating-4/40 data-[active=true]:bg-rating-4/35" },
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
        <div className="ml-auto flex gap-2" role="radiogroup" aria-label={labels.groupTitle}>
          {RATING_STYLES.map((r) => (
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
              {labels.ratings[r.value - 1]}
              <kbd className="rounded bg-background/70 px-1.5 text-xs text-muted-foreground">{r.value}</kbd>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
