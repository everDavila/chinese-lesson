"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiOption<T> = { value: T; label: string; count?: number };

/**
 * Filtro desplegable de selección múltiple ("Nivel: HSK 1, HSK 2 ▾").
 * Sin nada marcado equivale a "Todos". El menú no se cierra al marcar, para
 * poder elegir varias opciones seguidas.
 */
export function MultiSelect<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  className,
  allLabel = "Todos",
  clearLabel = "Quitar filtro",
  selectedLabel = (n) => `${n} seleccionados`,
}: {
  label: string;
  options: MultiOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  className?: string;
  /** Textos para otros idiomas; por defecto, español. */
  allLabel?: string;
  clearLabel?: string;
  selectedLabel?: (n: number) => string;
}) {
  const summary =
    selected.length === 0
      ? allLabel
      : selected.length <= 2
        ? options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(", ")
        : selectedLabel(selected.length);

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm whitespace-nowrap hover:bg-muted data-[popup-open]:bg-muted",
          selected.length > 0 && "border-primary",
          className,
        )}
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{summary}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="start" className="z-50">
          <Menu.Popup className="min-w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none">
            {options.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <Menu.CheckboxItem
                  key={String(o.value)}
                  checked={checked}
                  closeOnClick={false}
                  onCheckedChange={(on) =>
                    onChange(on ? [...selected, o.value] : selected.filter((v) => v !== o.value))
                  }
                  className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-muted"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border border-input",
                      checked && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </span>
                  <span className="flex-1">{o.label}</span>
                  {o.count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{o.count}</span>}
                </Menu.CheckboxItem>
              );
            })}
            {selected.length > 0 && (
              <>
                <div className="my-1 h-px bg-border" />
                <Menu.Item
                  onClick={() => onChange([])}
                  className="rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none data-[highlighted]:bg-muted"
                >
                  {clearLabel}
                </Menu.Item>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
