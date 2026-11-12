"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Option = { value: string; title: string; hint: string };

// Elegir qué practicar: un nivel HSK o un tema del sistema, y cuántas palabras.
export function PracticePicker({
  levels,
  themes,
  amounts,
  defaultAmount,
}: {
  levels: Option[];
  themes: Option[];
  amounts: number[];
  defaultAmount: number;
}) {
  const t = useTranslations("StudentWorkspace");
  const router = useRouter();
  const [source, setSource] = useState(levels[0]?.value ?? "");
  const [amount, setAmount] = useState(defaultAmount);

  const group = (legend: string, options: Option[]) => (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-muted-foreground">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer flex-col gap-0.5 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input type="radio" name="fuente" value={o.value} className="sr-only" checked={source === o.value} onChange={() => setSource(o.value)} />
            <span className="font-medium">{o.title}</span>
            <span className="text-sm text-muted-foreground">{o.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/estudiante?fuente=${encodeURIComponent(source)}&n=${amount}`);
      }}
    >
      {group(t("pickLevels"), levels)}
      {themes.length > 0 && group(t("pickThemes"), themes)}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-muted-foreground">{t("pickAmount")}</legend>
        <div className="flex gap-2">
          {amounts.map((n) => (
            <label
              key={n}
              className={cn(
                "flex min-w-16 cursor-pointer items-center justify-center rounded-full border border-border px-4 py-2 font-medium tabular-nums transition-colors hover:bg-muted",
                "has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-checked:hover:bg-primary has-focus-visible:ring-2 has-focus-visible:ring-ring",
              )}
            >
              <input type="radio" name="n" value={n} className="sr-only" checked={amount === n} onChange={() => setAmount(n)} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" size="lg">{t("pickStart", { n: amount })}</Button>
    </form>
  );
}
