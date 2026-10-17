"use server";

import { lookupWords, searchWords, type WordSearch, type WordStatus } from "@/lib/content";
import { currentUserId } from "@/lib/lessons";

// Búsqueda del catálogo desde el editor de lección y la tabla del admin. El
// catálogo es solo para cuentas con sesión (RLS); sin sesión, nada.

export async function searchWordsAction(
  query: string,
  levels: number[],
  statuses: WordStatus[] = [],
  limit = 40,
): Promise<WordSearch | null> {
  if (!(await currentUserId())) return null;
  return searchWords({ query: query.slice(0, 100), levels, statuses, limit: Math.min(limit, 200) });
}

export async function lookupWordsAction(hanzi: string[]): Promise<{ hanzi: string; senseId: string }[]> {
  if (!(await currentUserId())) return [];
  return lookupWords(hanzi);
}

