import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

// «Aprende»: capítulos sobre cómo funciona la escritura china. El texto vive en
// contenido/etimologia/*.md (se edita ahí, no en el código). Solo en español
// por ahora; la interfaz sí cambia de idioma.

export type Chapter = { slug: string; file: string; minutes: number };

export const CHAPTERS: Chapter[] = [
  { slug: "seis-tipos", file: "cap-01-los-seis-tipos.md", minutes: 4 },
  { slug: "pictogramas", file: "cap-02-pictogramas.md", minutes: 3 },
];

const DIR = path.join(process.cwd(), "contenido", "etimologia");

export function getChapter(slug: string): { chapter: Chapter; title: string; body: string } | null {
  const chapter = CHAPTERS.find((c) => c.slug === slug);
  if (!chapter) return null;
  const text = readFileSync(path.join(DIR, chapter.file), "utf8");
  const title = text.match(/^# (.+)$/m)?.[1] ?? slug;
  // El título va aparte, en la cabecera de la página.
  return { chapter, title, body: text.replace(/^# .+\r?\n/, "") };
}

export function listChapters(): { chapter: Chapter; title: string }[] {
  return CHAPTERS.flatMap((c) => {
    const found = getChapter(c.slug);
    return found ? [{ chapter: c, title: found.title }] : [];
  });
}

export type PictogramRow = {
  hanzi: string;
  pinyin: string;
  nivelMinimoHSK3: number;
  esPalabraSola: boolean;
  clasificacion: "claro" | "dudoso" | "descartar";
  nota: string;
  pistaDatasetEn: string;
};
export type PictogramList = { metadata: { descripcion: string; total: number; porClasificacion: Record<string, number> }; caracteres: PictogramRow[] };

export function getPictogramList(): PictogramList {
  return JSON.parse(readFileSync(path.join(DIR, "pictogramas-hsk1-3.json"), "utf8")) as PictogramList;
}
