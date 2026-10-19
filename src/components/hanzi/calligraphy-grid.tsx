import { cn } from "@/lib/utils";

// Retícula 米字格 de los cuadernos de caligrafía, detrás de un carácter.
// `paper`: textura de papel de arroz (estilo tinta china del anverso).
export function CalligraphyGrid({
  className,
  paper = false,
  children,
}: {
  className?: string;
  paper?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative aspect-square border border-grid-line", className)}>
      {paper && (
        <svg className="absolute inset-0 size-full opacity-40 mix-blend-multiply dark:opacity-15 dark:mix-blend-screen" aria-hidden>
          {/* Mismo filtro en cada casilla: el id repetido apunta a una definición idéntica. */}
          <filter id="renshi-rice-paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.55 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#renshi-rice-paper)" />
        </svg>
      )}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full text-grid-line"
        aria-hidden
        preserveAspectRatio="none"
      >
        <g stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 2" vectorEffect="non-scaling-stroke">
          <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="50" y1="0" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <div className="relative size-full">{children}</div>
    </div>
  );
}
