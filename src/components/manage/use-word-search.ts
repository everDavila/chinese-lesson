"use client";

import { useEffect, useRef, useState } from "react";
import { searchWordsAction } from "@/actions/search";
import type { WordSearch, WordStatus } from "@/lib/content";

const DEBOUNCE_MS = 250;

/**
 * Busca en el catálogo de la base mientras se escribe: espera a que se deje
 * de teclear y descarta las respuestas que llegan tarde (una búsqueda vieja no
 * pisa a la nueva). `initial` evita la lista vacía mientras llega la primera.
 */
export function useWordSearch(
  query: string,
  levels: number[],
  statuses: WordStatus[] = [],
  limit = 40,
  initial: WordSearch | null = null,
  /** Cambiarlo vuelve a pedir lo mismo (p. ej. tras publicar una palabra). */
  version = 0,
) {
  const [result, setResult] = useState<WordSearch | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const key = JSON.stringify([query.trim(), levels, statuses, limit, version]);
  const first = useRef(initial ? key : null);

  useEffect(() => {
    // La primera vez, si el servidor ya trajo el resultado, no se repite.
    if (first.current === key) {
      first.current = null;
      return;
    }
    const id = ++latest.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const [q, lv, st, lim] = JSON.parse(key) as [string, number[], WordStatus[], number, number];
        const r = await searchWordsAction(q, lv, st, lim);
        if (id !== latest.current) return;
        setResult(r);
        setFailed(false);
      } catch {
        if (id === latest.current) setFailed(true);
      } finally {
        if (id === latest.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [key]);

  return { result, loading, failed };
}

/** HSK 3.0 agrupa los niveles 7, 8 y 9 en una sola banda: en la base es 7. */
export const hskLabel = (level: number) => (level === 7 ? "7–9" : level || "?");
export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7];
