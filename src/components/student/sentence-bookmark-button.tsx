"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleSentenceBookmark } from "@/actions/student";
import { cn } from "@/lib/utils";

// Corazón de frase favorita. Optimista: cambia ya y se corrige si el servidor falla.
// Es un botón chico dentro de la fila de la frase; mide 44 px para el dedo.
export function SentenceBookmarkButton({ sentenceId, initial, className }: { sentenceId: string; initial: boolean; className?: string }) {
  const [on, setOn] = useState(initial);
  const [, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Quitar la frase de favoritas" : "Guardar la frase como favorita"}
      onClick={() => {
        const before = on;
        setOn(!before);
        startTransition(async () => {
          const result = await toggleSentenceBookmark(sentenceId);
          setOn(result ?? before);
        });
      }}
      className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", className)}
    >
      <Heart className={cn("size-5", on && "fill-primary text-primary")} aria-hidden />
    </button>
  );
}
