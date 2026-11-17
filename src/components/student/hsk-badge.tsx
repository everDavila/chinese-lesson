import { cn } from "@/lib/utils";

// Insignia de nivel: dice qué tan temprano aparece la palabra en el temario
// HSK 3.0 (1 = de las primeras; 7 = banda avanzada 7–9). Sin nivel, no se pinta.
export function HskBadge({ hsk, className }: { hsk: number; className?: string }) {
  if (!hsk || hsk < 1) return null;
  return (
    <span
      className={cn("inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground", className)}
      title={hsk === 7 ? "Banda avanzada HSK 7–9" : `Nivel HSK ${hsk}`}
    >
      {hsk === 7 ? "HSK 7–9" : `HSK ${hsk}`}
    </span>
  );
}
