"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Reordenar arrastrando (HTML5 drag & drop nativo, sin librerías). La fila se
// arrastra desde cualquier punto que no sea un control; el asa (grip) es el
// ancla visual y, con teclado, ↑ ↓ mueven la fila de a uno — el DnD del
// navegador no responde al dedo, así que en pantallas pequeñas siguen
// vivas las flechas Subir/Bajar de cada lista.
//
// El índice llega de fuera (onReorder) porque la lista vive en Supabase: al
// soltar se encadenan moveItemAction/moveLessonAction ±1 hasta la destino.

export function useDragReorder(itemCount: number, opts: { onReorder: (from: number, to: number) => void; disabled?: boolean }) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Arrastrar desde inputs/selects/enlaces los rompe: el drag empieza en la fila.
  const inControl = (target: EventTarget | null) =>
    target instanceof HTMLElement && !!target.closest("a, select, input, textarea, button");

  return {
    /** Props para el <li> de la fila. */
    row: (i: number) => ({
      draggable: !opts.disabled,
      onDragStart: (e: React.DragEvent) => {
        if (opts.disabled || inControl(e.target)) return e.preventDefault();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(i));
        setDragFrom(i);
        setOverIndex(i);
      },
      onDragOver: (e: React.DragEvent) => {
        if (dragFrom === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overIndex !== i) setOverIndex(i);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const from = dragFrom ?? Number(e.dataTransfer.getData("text/plain"));
        setDragFrom(null);
        setOverIndex(null);
        if (Number.isInteger(from) && from !== i && from >= 0 && from < itemCount) opts.onReorder(from, i);
      },
      onDragEnd: () => {
        setDragFrom(null);
        setOverIndex(null);
      },
      className: cn(overIndex === i && dragFrom !== null && dragFrom !== i && "border-primary"),
    }),
    /** Props para el asa: con teclado, ↑ ↓ mueven la fila (accesibilidad). */
    handle: (i: number) => ({
      onKeyDown: (e: React.KeyboardEvent) => {
        if (opts.disabled || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
        e.preventDefault();
        const to = i + (e.key === "ArrowUp" ? -1 : 1);
        if (to >= 0 && to < itemCount) opts.onReorder(i, to);
      },
    }),
  };
}
