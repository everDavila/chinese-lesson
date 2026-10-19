"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { StrokeArt, strokeTimings } from "@/components/hanzi/stroke-art";
import type { LessonItem } from "@/lib/lesson-types";
import { cn } from "@/lib/utils";

// La misma palabra con el trazo liso (por defecto en clase) y con tinta china
// (botón «Tinta» o tecla I en la presentación). Un botón repite las dos.
export function InkCompare({ item }: { item: LessonItem }) {
  const t = useTranslations("Lab");
  const [run, setRun] = useState(0);
  const starts = item.characters.map((_, i, all) =>
    all.slice(0, i).reduce((acc, prev) => acc + (prev.strokes ? strokeTimings(prev.strokes, 1).end + 0.2 : 0), 0.4),
  );
  const word = (ink: boolean) => (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-muted-foreground">{ink ? t("inkStyle") : t("plainStyle")}</p>
      <div lang="zh-Hans" className="flex">
        {item.characters.map((c, i) =>
          c.strokes ? (
            <CalligraphyGrid key={`${i}-${c.char}-${run}`} paper={ink} className={cn("bg-card", i > 0 && "-ml-px")}>
              <div className="size-[min(36vw,10rem)] p-[6%]">
                <StrokeArt strokes={c.strokes} roles={c.info?.strokeRoles ?? []} mode="animate" tone={ink ? "ink" : "subtle"} ink={ink} startDelay={starts[i]} className="size-full" title={c.char} />
              </div>
            </CalligraphyGrid>
          ) : null,
        )}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid gap-8 sm:grid-cols-2">
        {word(false)}
        {word(true)}
      </div>
      <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex items-center gap-2 text-sm text-keyword-text hover:underline">
        <RotateCcw className="size-4" /> {t("replay")}
      </button>
    </div>
  );
}
