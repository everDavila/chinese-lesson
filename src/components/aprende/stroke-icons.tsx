import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

// Esquemas de los trazos del capítulo «Los trazos» (Saber más). Dibujos propios,
// hechos a mano como líneas: no son glifos de ninguna fuente. El punto marca dónde
// empieza el trazo y la línea sigue el recorrido. Se pintan con `{{trazo:nombre}}`
// dentro del markdown de los capítulos (ver markdown.tsx).

type Stroke = { d: string; start: [number, number]; label: string };

export const STROKES: Record<string, Stroke> = {
  // Los cinco básicos
  heng: { d: "M16 54 L84 46", start: [16, 54], label: "héng: horizontal, de izquierda a derecha" },
  shu: { d: "M50 12 L50 88", start: [50, 12], label: "shù: vertical, de arriba abajo" },
  pie: { d: "M72 14 Q62 56 22 88", start: [72, 14], label: "piě: diagonal que baja hacia la izquierda" },
  dian: { d: "M42 30 L60 58", start: [42, 30], label: "diǎn: punto corto, baja hacia la derecha" },
  zhe: { d: "M20 24 L78 24 L78 82", start: [20, 24], label: "zhé: línea con un quiebre" },
  // Los tres extra de 永
  na: { d: "M18 18 Q40 62 84 84", start: [18, 18], label: "nà: diagonal que baja hacia la derecha" },
  ti: { d: "M22 78 L80 40", start: [22, 78], label: "tí: línea corta que sube hacia la derecha" },
  gou: { d: "M50 12 L50 74 Q50 88 32 80", start: [50, 12], label: "gōu: gancho al final de otro trazo" },
  // Compuestos
  hengzhe: { d: "M20 24 L78 24 L78 82", start: [20, 24], label: "héngzhé: horizontal y quiebre hacia abajo" },
  hengpie: { d: "M20 24 L76 24 L28 82", start: [20, 24], label: "héngpiě: horizontal y diagonal hacia la izquierda" },
  henggou: { d: "M16 42 L84 42 L76 60", start: [16, 42], label: "hénggōu: horizontal con gancho hacia abajo" },
  hengzhegou: { d: "M20 24 L78 24 L78 80 L68 70", start: [20, 24], label: "héngzhégōu: horizontal, baja y gancho hacia la izquierda" },
  hengzheti: { d: "M18 26 L58 26 L58 76 L86 56", start: [18, 26], label: "héngzhétí: horizontal, baja y sube a la derecha" },
  hengzhewangou: { d: "M20 24 L62 24 L62 68 Q62 82 76 82 Q90 82 86 62", start: [20, 24], label: "héngzhéwāngōu: horizontal, baja, curva y gancho hacia arriba" },
  hengzhezhepie: { d: "M20 18 L70 18 L40 50 L74 50 Q60 72 28 88", start: [20, 18], label: "héngzhézhépiě: horizontal, quiebre, horizontal y diagonal hacia la izquierda" },
  hengzhezhezhegou: { d: "M18 22 L56 22 L56 48 L82 48 L82 74 Q82 88 68 82", start: [18, 22], label: "héngzhézhézhégōu: varios quiebres y gancho final" },
  shugou: { d: "M50 12 L50 76 Q50 88 34 80", start: [50, 12], label: "shùgōu: vertical con gancho hacia la izquierda" },
  shuti: { d: "M34 14 L34 80 L68 58", start: [34, 14], label: "shùtí: vertical y sube a la derecha" },
  shuzhe: { d: "M26 16 L26 80 L78 80", start: [26, 16], label: "shùzhé: vertical y quiebre hacia la derecha" },
  shuwan: { d: "M30 16 L30 72 Q30 84 44 84 L80 84", start: [30, 16], label: "shùwān: vertical y curva hacia la derecha" },
  shuwangou: { d: "M32 16 L32 70 Q32 84 48 84 L76 84 L76 66", start: [32, 16], label: "shùwāngōu: vertical, curva, horizontal y gancho hacia arriba" },
  piezhe: { d: "M62 16 Q42 44 28 62 L80 62", start: [62, 16], label: "piězhé: diagonal hacia la izquierda y quiebre a la derecha" },
  piedian: { d: "M60 14 Q38 40 24 58 L70 82", start: [60, 14], label: "piědiǎn: diagonal hacia la izquierda y punto hacia la derecha" },
  xiegou: { d: "M24 16 Q74 44 72 76 L60 68", start: [24, 16], label: "xiégōu: curva inclinada con gancho hacia arriba" },
  wogou: { d: "M18 30 Q30 76 56 78 Q78 78 86 52", start: [18, 30], label: "wògōu: curva tendida con gancho hacia arriba" },
};

export function StrokeIcon({ name }: { name: string }) {
  const s = STROKES[name];
  if (!s) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={s.label}
      className="inline-block size-14 shrink-0 rounded-md border border-border bg-background align-middle"
    >
      {/* Guía tenue (米字格) para que se vea la dirección. */}
      <g className="text-muted-foreground/30" stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" fill="none">
        <path d="M0 0 L100 100 M100 0 L0 100 M50 0 L50 100 M0 50 L100 50" />
      </g>
      <path d={s.d} fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" className="text-foreground" />
      <circle cx={s.start[0]} cy={s.start[1]} r={6} className="fill-emerald-500" />
    </svg>
  );
}

// El carácter de un ejemplo con UN trazo marcado: `{{ej:口:1}}` es el 口 con su
// segundo trazo (se cuenta desde 0) en verde y los demás en gris. Los contornos vienen de
// contenido/etimologia/trazos-ejemplos.json (scripts/build-trazos-ejemplos.mjs), que
// sale de hanzi-writer-data (Arphic PL, ver /creditos).
let examples: Record<string, string[]> | null = null;
function strokesOf(char: string): string[] | null {
  examples ??= JSON.parse(readFileSync(path.join(process.cwd(), "contenido", "etimologia", "trazos-ejemplos.json"), "utf8"));
  return examples?.[char] ?? null;
}

export function ExampleChar({ char, index }: { char: string; index: number }) {
  const strokes = strokesOf(char);
  if (!strokes || !strokes[index]) return null;
  return (
    <svg
      viewBox="0 0 1024 1024"
      role="img"
      aria-label={`${char} con su trazo ${index + 1} de ${strokes.length} marcado`}
      className="inline-block size-14 shrink-0 rounded-md border border-border bg-background align-middle"
    >
      <g transform="scale(1,-1) translate(0,-900)">
        {strokes.map((d, i) => (
          <path key={i} d={d} className={i === index ? "fill-emerald-500" : "fill-foreground/20"} />
        ))}
      </g>
    </svg>
  );
}
