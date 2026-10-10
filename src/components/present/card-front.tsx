"use client";

import { CalligraphyGrid } from "@/components/hanzi/calligraphy-grid";
import { StrokeArt, strokeTimings } from "@/components/hanzi/stroke-art";
import type { Bilingual, LessonItem } from "@/lib/lesson-types";
import { splitPinyin, toneless } from "@/lib/pinyin";

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
  const syllables = splitPinyin(sense.pinyin);

  // Los caracteres se animan uno tras otro: cada uno empieza donde acaba el anterior.
  const starts = item.characters.map((_, i) =>
    item.characters
      .slice(0, i)
      .reduce((t, prev) => t + (prev.strokes ? strokeTimings(prev.strokes, speed).end + 0.2 : 0), 0),
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex items-start justify-center gap-[min(4vw,3rem)]">
        {item.characters.map((c, i) => {
          const semantic = c.info?.components.find((x) => x.role === "semantic");
          const phonetic = c.info?.components.find((x) => x.role === "phonetic");
          const charSyllable = c.info?.pinyin[0];
          const approximate =
            phonetic?.pinyin && charSyllable && toneless(phonetic.pinyin) !== toneless(charSyllable);
          const size = `min(52vh, ${Math.floor(78 / item.characters.length)}vw, 30rem)`;
          return (
            <div key={`${c.char}-${runId}`} className="flex flex-col items-center gap-3">
              <CalligraphyGrid className="bg-card">
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
              {showPinyin && (
                <p className="text-3xl text-muted-foreground">{syllables[i] ?? ""}</p>
              )}
              <dl className="flex min-h-12 gap-6 text-base">
                {semantic && (
                  <div className="flex items-baseline gap-2">
                    <dt className="font-hanzi text-3xl text-radical">{semantic.char}</dt>
                    <dd className="text-muted-foreground">
                      {componentMeanings[semantic.char]?.es ?? "radical"}
                    </dd>
                  </div>
                )}
                {phonetic && (
                  <div className="flex items-baseline gap-2">
                    <dt className="font-hanzi text-3xl text-phonetic">{phonetic.char}</dt>
                    <dd className="text-muted-foreground">
                      {phonetic.pinyin}
                      {approximate ? " · sonido aproximado" : " · da el sonido"}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
