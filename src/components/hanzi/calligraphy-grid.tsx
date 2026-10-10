import { cn } from "@/lib/utils";

// Retícula 米字格 de los cuadernos de caligrafía, detrás de un carácter.
export function CalligraphyGrid({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative aspect-square border border-grid-line", className)}>
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
