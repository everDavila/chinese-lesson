"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { PRACTICE_MINUTES, wordsForMinutes } from "@/lib/practice-pick";

type Option = { value: string; title: string; hint: string };
type Group = { key: string; title: string; options: Option[] };

type Tab = "hsk" | "frecuencia" | "radicales" | "temas";

const segment =
  "flex cursor-pointer items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-checked:hover:bg-primary has-focus-visible:ring-2 has-focus-visible:ring-ring";
const card =
  "flex cursor-pointer flex-col gap-0.5 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-2 has-focus-visible:ring-ring";

// Elegir qué practicar: el ejercicio y la cantidad arriba, luego la fuente (un
// nivel HSK o un tema del sistema) y, siempre a la vista, el botón de empezar.
export function PracticePicker({
  levels,
  frequency,
  radicals,
  themeGroups,
  amounts,
  defaultAmount,
}: {
  levels: Option[];
  frequency: Option[];
  radicals: Option[];
  themeGroups: Group[];
  amounts: number[];
  defaultAmount: number;
}) {
  const t = useTranslations("StudentWorkspace");
  const router = useRouter();
  const [exercise, setExercise] = useState<"estudiar" | "tarjeta" | "escribir">("estudiar");
  const [amount, setAmount] = useState(defaultAmount);
  // «Por tiempo»: el alumno elige minutos y la cantidad de palabras se calcula con una estimación por ejercicio.
  const [unit, setUnit] = useState<"words" | "minutes">("words");
  const [minutes, setMinutes] = useState<number>(PRACTICE_MINUTES[1]);
  const [reviewOnly, setReviewOnly] = useState(false);
  const effective = unit === "minutes" ? wordsForMinutes(minutes, exercise) : amount;
  const [tab, setTab] = useState<Tab>("hsk");
  const [source, setSource] = useState(levels[0]?.value ?? "");
  const [query, setQuery] = useState("");

  const all = useMemo(() => [...levels, ...frequency, ...radicals, ...themeGroups.flatMap((g) => g.options)], [levels, frequency, radicals, themeGroups]);
  const selected = all.find((o) => o.value === source);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themeGroups
      .map((g) => ({ ...g, options: g.options.filter((o) => !q || o.title.toLowerCase().includes(q)) }))
      .filter((g) => g.options.length > 0);
  }, [themeGroups, query]);

  const choice = (name: string, value: string, current: string, set: (v: never) => void, label: React.ReactNode, className: string) => (
    <label key={value} className={className}>
      <input type="radio" name={name} value={value} className="sr-only" checked={current === value} onChange={() => set(value as never)} />
      {label}
    </label>
  );

  return (
    <form
      className="flex flex-1 flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (source) router.push(`/estudiante?fuente=${encodeURIComponent(source)}&n=${effective}&ejercicio=${exercise}${reviewOnly && exercise !== "estudiar" ? "&nuevas=no" : ""}`);
      }}
    >
      <div className="grid gap-5 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="mb-2 block text-sm font-medium text-muted-foreground">{t("exerciseLabel")}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {choice("ejercicio", "estudiar", exercise, setExercise, (
              <><span className="font-medium">{t("exerciseStudy")}</span><span className="text-sm text-muted-foreground">{t("exerciseStudyHint")}</span></>
            ), card)}
            {choice("ejercicio", "tarjeta", exercise, setExercise, (
              <><span className="font-medium">{t("exerciseCard")}</span><span className="text-sm text-muted-foreground">{t("exerciseCardHint")}</span></>
            ), card)}
            {choice("ejercicio", "escribir", exercise, setExercise, (
              <><span className="font-medium">{t("exerciseWrite")}</span><span className="text-sm text-muted-foreground">{t("exerciseWriteHint")}</span></>
            ), card)}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="mb-2 block text-sm font-medium text-muted-foreground">{unit === "words" ? t("pickAmount") : t("pickMinutes")}</legend>
          <div className="flex flex-wrap items-center gap-2">
            {unit === "words"
              ? amounts.map((n) => choice("n", String(n), String(amount), (v: string) => setAmount(Number(v)), <span className="min-w-8 text-center tabular-nums">{n}</span>, segment))
              : PRACTICE_MINUTES.map((m) => choice("min", String(m), String(minutes), (v: string) => setMinutes(Number(v)), <span className="min-w-8 text-center tabular-nums">{t("minutesShort", { n: m })}</span>, segment))}
            <button type="button" onClick={() => setUnit(unit === "words" ? "minutes" : "words")} className="ml-1 text-sm text-primary underline-offset-4 hover:underline">
              {unit === "words" ? t("pickByTime") : t("pickByCount")}
            </button>
          </div>
          {unit === "minutes" && <p className="text-sm text-muted-foreground">{t("pickMinutesHint", { n: effective })}</p>}
          <label className="flex cursor-pointer items-start gap-2 pt-1 text-sm">
            <input type="checkbox" className="mt-0.5 accent-primary" checked={reviewOnly && exercise !== "estudiar"} disabled={exercise === "estudiar"} onChange={(e) => setReviewOnly(e.target.checked)} />
            <span>
              <span className="font-medium">{t("pickReviewOnly")}</span>
              <span className="block text-muted-foreground">{t("pickReviewOnlyHint")}</span>
            </span>
          </label>
        </fieldset>
      </div>

      <div className="space-y-4">
        <fieldset className="flex gap-2">
          <legend className="sr-only">{t("pickSource")}</legend>
          {choice("vista", "hsk", tab, (v: Tab) => { setTab(v); if (v === "hsk") setSource(levels[0]?.value ?? ""); }, t("pickTabLevels"), segment)}
          {frequency.length > 0 && choice("vista", "frecuencia", tab, (v: Tab) => { setTab(v); setSource(frequency[0]?.value ?? ""); }, t("pickTabFrequency"), segment)}
          {radicals.length > 0 && choice("vista", "radicales", tab, (v: Tab) => { setTab(v); setSource(radicals[0]?.value ?? ""); }, t("pickTabRadicals"), segment)}
          {choice("vista", "temas", tab, (v: Tab) => { setTab(v); setSource(""); }, t("pickTabThemes"), segment)}
        </fieldset>

        {tab === "hsk" ? (
          <fieldset>
            <legend className="sr-only">{t("pickLevels")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {levels.map((o) => choice("fuente", o.value, source, setSource, <><span className="font-medium">{o.title}</span><span className="text-sm text-muted-foreground">{o.hint}</span></>, card))}
            </div>
          </fieldset>
        ) : tab === "frecuencia" ? (
          <fieldset className="space-y-2">
            <legend className="sr-only">{t("pickTabFrequency")}</legend>
            <p className="text-sm text-muted-foreground">{t("pickFrequencyHint")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {frequency.map((o) => choice("fuente", o.value, source, setSource, <><span className="font-medium">{o.title}</span><span className="text-sm text-muted-foreground">{o.hint}</span></>, card))}
            </div>
          </fieldset>
        ) : tab === "radicales" ? (
          <fieldset className="space-y-2">
            <legend className="sr-only">{t("pickTabRadicals")}</legend>
            <p className="text-sm text-muted-foreground">{t("pickRadicalsHint")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {radicals.map((o) => choice("fuente", o.value, source, setSource, <><span className="font-medium">{o.title}</span><span className="text-sm text-muted-foreground">{o.hint}</span></>, card))}
            </div>
          </fieldset>
        ) : (
          <div className="space-y-6">
            <label className="relative block max-w-sm">
              <span className="sr-only">{t("pickSearch")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("pickSearch")}
                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">{t("pickNoThemes")}</p>}
            {filtered.map((g) => (
              <fieldset key={g.key} className="space-y-2">
                <legend className="sr-only">{g.title}</legend>
                <h2 className="text-sm font-semibold text-muted-foreground" aria-hidden>{g.title}</h2>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {g.options.map((o) => choice("fuente", o.value, source, setSource, <><span className="font-medium">{o.title}</span><span className="text-sm text-muted-foreground">{o.hint}</span></>, card))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-auto border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <p className={cn("min-w-48 flex-1 text-sm", !selected && "text-muted-foreground")} aria-live="polite">
            {selected
              ? t("pickSummary", { exercise: exercise === "estudiar" ? t("exerciseStudy") : exercise === "tarjeta" ? t("exerciseCard") : t("exerciseWrite"), source: selected.title, n: effective })
              : t("pickChooseSource")}
          </p>
          <Button type="submit" size="lg" disabled={!selected}>{t("pickStart")}</Button>
        </div>
      </div>
    </form>
  );
}
