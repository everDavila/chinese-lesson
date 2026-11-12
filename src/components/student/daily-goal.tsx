"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setDailyGoal } from "@/actions/student";

// Círculo de la meta diaria en minutos activos, con selector de la meta.
export function DailyGoal({ todayMs, goalMinutes, options }: { todayMs: number; goalMinutes: number; options: number[] }) {
  const t = useTranslations("StudentWorkspace");
  const [goal, setGoal] = useState(goalMinutes);
  const [, startTransition] = useTransition();
  const done = Math.floor(todayMs / 60_000);
  const ratio = Math.min(todayMs / (goal * 60_000), 1);
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <section aria-labelledby="goal-title" className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" className="stroke-border" />
          <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-primary" strokeDasharray={C} strokeDashoffset={C * (1 - ratio)} />
        </svg>
        <div className="min-w-40 flex-1">
          <h2 id="goal-title" className="text-lg font-semibold">{t("goalTitle")}</h2>
          <p className="text-sm text-muted-foreground">{ratio >= 1 ? t("goalReached") : t("goalProgress", { done, goal })}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("goalLabel")}</span>
          <select
            value={goal}
            onChange={(e) => {
              const next = Number(e.target.value);
              setGoal(next);
              startTransition(() => void setDailyGoal(next));
            }}
            className="rounded-lg border border-border bg-background px-2 py-1.5"
          >
            {options.map((n) => (
              <option key={n} value={n}>{t("goalOption", { n })}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
