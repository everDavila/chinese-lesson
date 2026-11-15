import { pinyinSegments } from "@/lib/pinyin";

// Colores por tono (convención habitual: 1 rojo, 2 verde, 3 azul, 4 violeta,
// neutro gris). Tonos 700 en claro y 400 en oscuro para mantener el contraste.
// El color no es lo único que informa: el pinyin conserva sus marcas.
export const TONE_COLOR: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "text-red-700 dark:text-red-400",
  2: "text-green-700 dark:text-green-400",
  3: "text-blue-700 dark:text-blue-400",
  4: "text-purple-700 dark:text-purple-400",
  5: "text-muted-foreground",
};

/** Pinyin con cada sílaba del color de su tono; sin colores, texto plano. */
export function ToneText({ pinyin, colored, className }: { pinyin: string; colored: boolean; className?: string }) {
  if (!colored) return <span lang="zh-Latn" className={className}>{pinyin}</span>;
  return (
    <span lang="zh-Latn" className={className}>
      {pinyinSegments(pinyin).map((seg, i) => (
        <span key={i} className={seg.tone ? TONE_COLOR[seg.tone] : undefined}>{seg.text}</span>
      ))}
    </span>
  );
}
