"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DEFAULT_WRITE_CONFIG, configWarnings, parseConfig, type LimitBand, type WriteConfig } from "@/lib/write-stats";

// Límites de la escritura en clase (docs/DISENO-ESCRITURA-EN-CLASE.md): la
// profesora los cambia ANTES de abrir una palabra, nunca a mitad de ella. Los
// valores por defecto se guardan en este navegador y se copian a cada clase.

export const LIMITS_DEFAULT_KEY = "renshi:clase:limites";

export function savedLimits(): WriteConfig | null {
  try {
    const raw = localStorage.getItem(LIMITS_DEFAULT_KEY);
    return raw ? parseConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const band = (upTo: number | null, max: number): LimitBand => ({ upTo, max });
const PRESETS: Record<"strict" | "balanced" | "generous", LimitBand[]> = {
  strict: [band(2, 2), band(4, 4), band(6, 6), band(9, 7), band(12, 8), band(15, 9), band(18, 10), band(21, 11), band(null, 13)],
  balanced: DEFAULT_WRITE_CONFIG.limits,
  generous: [band(2, 4), band(4, 7), band(6, 9), band(8, 12), band(10, 14), band(12, 16), band(16, 19), band(20, 22), band(null, 26)],
};

type Row = { upTo: string; max: string };

const toRows = (limits: LimitBand[]): Row[] => limits.map((b) => ({ upTo: b.upTo === null ? "" : String(b.upTo), max: String(b.max) }));

export function WriteLimitsDialog({
  config,
  onSave,
  disabled,
  disabledReason,
}: {
  config: WriteConfig;
  onSave: (config: WriteConfig) => void;
  disabled: boolean;
  disabledReason: string;
}) {
  const t = useTranslations("WriteClass");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => toRows(config.limits));
  const [perStroke, setPerStroke] = useState(String(config.perStroke));
  const [pass, setPass] = useState(String(config.pass));
  const [guide, setGuide] = useState(config.guide);
  const [invalid, setInvalid] = useState(false);

  const load = (c: WriteConfig) => {
    setRows(toRows(c.limits));
    setPerStroke(String(c.perStroke));
    setPass(String(c.pass));
    setGuide(c.guide);
    setInvalid(false);
  };

  const draft = (): WriteConfig | null =>
    parseConfig({
      limits: rows.map((r, i) => ({ upTo: i === rows.length - 1 ? null : Number(r.upTo), max: Number(r.max) })),
      perStroke: Number(perStroke),
      pass: Number(pass),
      guide,
    });
  const current = draft();
  const warnings = current ? configWarnings(current) : [];

  const save = () => {
    const valid = draft();
    if (!valid) return setInvalid(true);
    try {
      localStorage.setItem(LIMITS_DEFAULT_KEY, JSON.stringify(valid));
    } catch {}
    onSave(valid);
    setOpen(false);
  };

  const field = "w-16 rounded-md border border-border bg-background px-2 py-1 text-right tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => {
          load(config);
          setOpen(true);
        }}
      >
        {t("limits")}
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl">
            <Dialog.Title className="text-lg font-semibold">{t("limitsTitle")}</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">{t("limitsIntro")}</Dialog.Description>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("presets")}:</span>
              {(["strict", "balanced", "generous"] as const).map((k) => (
                <Button key={k} size="sm" variant="outline" onClick={() => setRows(toRows(PRESETS[k]))}>
                  {k === "strict" ? t("presetStrict") : k === "balanced" ? t("presetBalanced") : t("presetGenerous")}
                </Button>
              ))}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-1 font-medium">{t("colStrokes")}</th>
                  <th className="pb-1 text-right font-medium">{t("colMax")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const last = i === rows.length - 1;
                  return (
                    <tr key={i}>
                      <td className="py-1">
                        {last ? (
                          <span>{(rows[i - 1]?.upTo ? Number(rows[i - 1].upTo) + 1 : 1)} {t("bandRest")}</span>
                        ) : (
                          <label className="flex items-center gap-2">
                            {t("bandUpTo")}
                            <input
                              inputMode="numeric"
                              className={field}
                              value={r.upTo}
                              aria-label={`${t("colStrokes")} ${i + 1}`}
                              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, upTo: e.target.value } : x)))}
                            />
                          </label>
                        )}
                      </td>
                      <td className="py-1 text-right">
                        <input
                          inputMode="numeric"
                          className={field}
                          value={r.max}
                          aria-label={`${t("colMax")} ${i + 1}`}
                          onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, max: e.target.value } : x)))}
                        />
                      </td>
                      <td className="py-1 pl-2 text-right">
                        {rows.length > 1 && (
                          <Button size="sm" variant="ghost" aria-label={t("removeBand")} onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                            ×
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div>
              <Button
                size="sm"
                variant="outline"
                disabled={rows.length >= 12}
                onClick={() => {
                  // Un tramo nuevo antes del abierto: 2 trazos más allá del último tramo cerrado.
                  const lastClosed = Number(rows[rows.length - 2]?.upTo) || 0;
                  setRows([...rows.slice(0, -1), { upTo: String(lastClosed + 2), max: rows[rows.length - 1].max }, rows[rows.length - 1]]);
                }}
              >
                {t("addBand")}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>{t("perStroke")}</span>
                <input inputMode="numeric" className={field} value={perStroke} onChange={(e) => setPerStroke(e.target.value)} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>{t("pass")}</span>
                <input inputMode="numeric" className={field} value={pass} onChange={(e) => setPass(e.target.value)} />
              </label>
            </div>
            <fieldset className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="guide" className="accent-primary" checked={guide} onChange={() => setGuide(true)} /> {t("guide")}</label>
              <label className="flex items-center gap-2"><input type="radio" name="guide" className="accent-primary" checked={!guide} onChange={() => setGuide(false)} /> {t("memory")}</label>
            </fieldset>

            {invalid && <p role="alert" className="text-sm text-destructive">{t("invalidConfig")}</p>}
            {warnings.length > 0 && <p className="text-sm text-muted-foreground">{warnings.join(" ")}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button onClick={save}>{t("save")}</Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
