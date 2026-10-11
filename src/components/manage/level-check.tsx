"use client";

import { useEffect, useState } from "react";
import { makeLevelChecker, type Levels } from "@/lib/level-check";
import { cn } from "@/lib/utils";

type Checker = ReturnType<typeof makeLevelChecker>;

// La lista HSK completa pesa ~200 KB: se carga solo en los editores de frases.
export function useLevelChecker(): Checker | null {
  const [checker, setChecker] = useState<Checker | null>(null);
  useEffect(() => {
    import("../../../data/hsk-levels.json").then((m) => setChecker(() => makeLevelChecker(m.default as Levels)));
  }, []);
  return checker;
}

/** Línea bajo una frase: ¿usa vocabulario por encima del nivel de la palabra? */
export function LevelNote({
  checker,
  zh,
  keyword,
  level,
  labels,
}: {
  checker: Checker | null;
  zh: string;
  keyword: string;
  level: number;
  labels: { empty: string; ok: (level: number | string) => string; over: (level: number | string, pieces: string) => string; outside: string };
}) {
  const over = checker && zh ? checker(zh, keyword, level || 9) : [];
  return (
    <p className={cn("text-xs", over.length ? "text-destructive" : "text-muted-foreground")}>
      {!zh
        ? labels.empty
        : over.length
          ? labels.over(level || "?", over.map((o) => `${o.piece} (${o.level ?? labels.outside})`).join(", "))
          : labels.ok(level || "?")}
    </p>
  );
}
