"use client";

import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { StrokeArt, strokeTimings } from "@/components/hanzi/stroke-art";
import type { LessonItem } from "@/lib/lesson-types";
import { cn } from "@/lib/utils";

type CardFrontProps = {
  item: LessonItem;
  playing: boolean;
  speed: number;
  runId: number;
  showPinyin: boolean;
};

export function CardFront({ item, playing, speed, runId, showPinyin }: CardFrontProps) {
  const sense = item.word.senses[item.senseIndex];

  // Los caracteres se animan uno tras otro: cada uno empieza donde acaba el anterior.
  const starts = item.characters.map((_, i) =>
    item.characters
      .slice(0, i)
      .reduce((t, prev) => t + (prev.strokes ? strokeTimings(prev.strokes, speed).end + 0.2 : 0), 0),
  );

  // Las casillas van pegadas, como en un cuaderno 田字格: la palabra se lee
  // como una unidad y cada carácter conserva su retícula y su animación.
  // En celular se aprovecha casi todo el ancho; en escritorio limita la altura.
  const size = `min(48vh, ${Math.floor(84 / item.characters.length)}vw, 30rem)`;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
      <div className="flex">
        {item.characters.map((c, i) => (
          // La key lleva el índice: en palabras repetidas (爸爸) el carácter solo
          // duplicaría la key y React dejaría la casilla vieja pegada en el DOM.
          <CalligraphyGrid key={`${i}-${c.char}-${runId}`} className={cn("bg-background/60", i > 0 && "-ml-px")}>
            <div style={{ width: size, height: size }} className="p-[6%]">
              {c.strokes ? (
                <StrokeArt
                  strokes={c.strokes}
                  roles={c.info?.strokeRoles ?? []}
                  mode="animate"
                  tone="subtle"
                  playing={playing}
                  speed={speed}
                  startDelay={starts[i]}
                  className="size-full"
                  title={c.char}
                />
              ) : (
                <span className="font-hanzi flex size-full items-center justify-center text-[min(40vh,24rem)] leading-none">
                  {c.char}
                </span>
              )}
            </div>
          </CalligraphyGrid>
        ))}
      </div>

      {/* Pinyin de la palabra entera, no sílaba por casilla. */}
      <p className={cn("text-[clamp(1.75rem,3vw,2.5rem)] text-muted-foreground", !showPinyin && "invisible")}>
        {sense.pinyin}
      </p>

    </div>
  );
}
