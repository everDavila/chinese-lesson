"use client";

import { useEffect, useState } from "react";
import type { StrokeSummary } from "@/lib/write-stats";

// El carácter dibujado con los trazos que costaron marcados en rojo, para que
// el alumno vea dónde repasar. Los trazos salen de los datos de Hanzi Writer
// (/hanzi-writer/<carácter>.json): líneas en una cuadrícula de 1024, con la
// vertical invertida (la transformación es la de Make Me a Hanzi).

type Paths = Record<string, string[] | null>;

export function FailedStrokes({ chars, label }: { chars: StrokeSummary["chars"]; label: (c: { char: string; list: string }) => string }) {
  const [paths, setPaths] = useState<Paths>({});

  useEffect(() => {
    let cancelled = false;
    const wanted = chars.filter((c) => c.failed.length > 0).map((c) => c.char);
    Promise.all(
      wanted.map(async (char) => {
        try {
          const r = await fetch(`/hanzi-writer/${encodeURIComponent(char)}.json`);
          const data = r.ok ? await r.json() : null;
          return [char, Array.isArray(data?.strokes) ? (data.strokes as string[]) : null] as const;
        } catch {
          return [char, null] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setPaths(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [chars]);

  const withFails = chars.filter((c) => c.failed.length > 0);
  if (!withFails.length) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-4" data-testid="failed-strokes">
      {withFails.map((c) => {
        const strokes = paths[c.char];
        const failed = new Set(c.failed);
        return (
          <li key={c.char} className="flex flex-col items-center gap-1">
            {strokes && (
              <svg viewBox="0 0 1024 1024" className="size-28" role="img" aria-label={label({ char: c.char, list: c.failed.join(", ") })}>
                <g transform="scale(1, -1) translate(0, -900)">
                  {strokes.map((d, i) => (
                    <path key={i} d={d} fill={failed.has(i + 1) ? "var(--rating-1)" : "currentColor"} opacity={failed.has(i + 1) ? 1 : 0.3} />
                  ))}
                </g>
              </svg>
            )}
            <span lang="zh-Hans" className="text-sm text-muted-foreground">{label({ char: c.char, list: c.failed.join(", ") })}</span>
          </li>
        );
      })}
    </ul>
  );
}
