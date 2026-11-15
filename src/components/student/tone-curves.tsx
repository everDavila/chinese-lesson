import { tonesOf } from "@/lib/pinyin";
import { cn } from "@/lib/utils";
import { TONE_COLOR } from "./tone-text";

// Contorno de cada tono bajo el pinyin: ayuda a ver la melodía de la palabra.
// Decorativo: el pinyin con marcas ya lleva la información para lectores de pantalla.
const PATHS: Record<1 | 2 | 3 | 4, string> = {
  1: "M3 4 H21",
  2: "M3 13 Q10 11 21 3",
  3: "M3 6 Q6 15 12 15 Q18 15 21 4",
  4: "M3 3 Q12 5 21 14",
};

export function ToneCurves({ pinyin, className, colored = false }: { pinyin: string; className?: string; colored?: boolean }) {
  const tones = tonesOf(pinyin);
  if (!tones.length) return null;
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)} aria-hidden>
      {tones.map((tone, i) => (
        <svg key={i} viewBox="0 0 24 18" className={cn("h-5 w-7", colored && TONE_COLOR[tone])} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          {tone === 5 ? <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" /> : <path d={PATHS[tone]} />}
        </svg>
      ))}
    </span>
  );
}
