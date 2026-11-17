import { Check, RotateCcw } from "lucide-react";
import type { Rating } from "./student-store";
import { cn } from "@/lib/utils";

// Círculo de color de cada valoración. «Aún no la sé» lleva una flecha de
// repetir y «Lo sé» un check: así no depende solo del color.
export function RatingDot({ value, tone }: { value: Rating; tone: string }) {
  const Icon = value === 4 ? Check : value === 1 ? RotateCcw : null;
  return (
    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-black", tone)} aria-hidden>
      {Icon && <Icon className="size-3" strokeWidth={3} />}
    </span>
  );
}
