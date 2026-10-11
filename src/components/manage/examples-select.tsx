"use client";

import { useTranslations } from "next-intl";

// Cuántas frases por palabra ve la clase. Si hay más, cada clase muestra
// primero las que aún no vio (src/lib/rotation.ts). 0 = todas; en una
// lección, "" = como la colección.
export function ExamplesSelect({
  value,
  inherited,
  disabled,
  onChange,
}: {
  value: number | null;
  /** Solo en una lección: lo que dice su colección. */
  inherited?: number;
  disabled?: boolean;
  onChange: (value: number | null) => void;
}) {
  const t = useTranslations("Manage");
  const label = (n: number) => (n === 0 ? t("examplesAll") : String(n));
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t("examplesPerWord")}</span>
      <select
        value={value === null ? "" : String(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="h-8 rounded-md border border-input bg-background px-2"
      >
        {inherited !== undefined && <option value="">{t("examplesInherit", { n: label(inherited) })}</option>}
        {[1, 2, 3, 0].map((n) => (
          <option key={n} value={n}>
            {label(n)}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">{t("examplesHint")}</span>
    </label>
  );
}
