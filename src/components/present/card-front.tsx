"use client";

import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { StrokeArt, strokeTimings } from "@/components/hanzi/stroke-art";
import type { Bilingual, LessonItem } from "@/lib/lesson-types";
import { toneless } from "@/lib/pinyin";
import { cn } from "@/lib/utils";

type CardFrontProps = {
  item: LessonItem;
  playing: boolean;
  speed: number;
  runId: number;
  showPinyin: boolean;
  componentMeanings: Record<string, Bilingual>;
};

export function CardFront({ item, playing, speed, runId, showPinyin, componentMeanings }: CardFrontProps) {
  const sense = item.word.senses[item.senseIndex];

  // Los caracteres se animan uno tras otro: cada uno empieza donde acaba el anterior.
  const starts = item.characters.map((_, i) =>
    item.characters
      .slice(0, i)
      .reduce((t, prev) => t + (prev.strokes ? strokeTimings(prev.strokes, speed).end + 0.2 : 0), 0),
  );

  // Las casillas van pegadas, como en un cuaderno 田字格: la palabra se lee
  // como una unidad y cada carácter conserva su retícula y su animación.
  const size = `min(48vh, ${Math.floor(70 / item.characters.length)}vw, 30rem)`;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
      <div className="flex">
        {item.characters.map((c, i) => (
          <CalligraphyGrid key={`${c.char}-${runId}`} className={cn("bg-background/60", i > 0 && "-ml-px")}>
            <div style={{ width: size, height: size }} className="p-[6%]">
              {c.strokes ? (
                <StrokeArt
                  strokes={c.strokes}
                  roles={c.info?.strokeRoles ?? []}
                  mode="animate"
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

      {/* Leyenda de componentes, secundaria, alineada bajo cada carácter. */}
      <div className="flex">
        {item.characters.map((c) => {
          const semantic = c.info?.components.find((x) => x.role === "semantic");
          const phonetic = c.info?.components.find((x) => x.role === "phonetic");
          const charSyllable = c.info?.pinyin[0];
          const approximate =
            phonetic?.pinyin && charSyllable && toneless(phonetic.pinyin) !== toneless(charSyllable);
          return (
            <dl key={c.char} style={{ width: size }} className="flex flex-col items-center gap-1 text-[clamp(0.95rem,1.3vw,1.25rem)]">
              {semantic && (
                <div className="flex items-baseline gap-2">
                  <dt className="font-hanzi text-[clamp(1.5rem,2.2vw,2rem)] text-radical">{semantic.char}</dt>
                  <dd className="text-muted-foreground">{componentMeanings[semantic.char]?.es ?? "radical"}</dd>
                </div>
              )}
              {phonetic && (
                <div className="flex items-baseline gap-2">
                  <dt className="font-hanzi text-[clamp(1.5rem,2.2vw,2rem)] text-phonetic">{phonetic.char}</dt>
                  <dd className="text-muted-foreground">
                    {phonetic.pinyin}
                    {approximate ? " · sonido aproximado" : " · da el sonido"}
                  </dd>
                </div>
              )}
            </dl>
          );
        })}
      </div>
    </div>
  );
}
