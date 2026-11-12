"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleBookmark } from "@/actions/student";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Corazón de favorita en la tarjeta. Optimista: cambia ya y se corrige si el servidor falla.
export function BookmarkButton({ senseId, initial }: { senseId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-pressed={on}
      aria-label={on ? "Quitar de favoritas" : "Guardar como favorita"}
      onClick={() => {
        const before = on;
        setOn(!before);
        startTransition(async () => {
          const result = await toggleBookmark(senseId);
          setOn(result ?? before);
        });
      }}
    >
      <Heart className={cn(on && "fill-primary text-primary")} />
    </Button>
  );
}
