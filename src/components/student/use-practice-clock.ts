"use client";

import { useEffect, useRef } from "react";

// Tiempo activo de una sesión de práctica: cuenta mientras el alumno toca la
// pantalla; pasados 3 minutos sin tocar, esa espera no se suma (igual que la
// tarjeta de escritura). Devuelve cómo marcar actividad y leer lo acumulado.
const IDLE_MS = 3 * 60_000;

// Fuera del hook: el reloj no es parte del render.
export const clock = () => Date.now();

export function usePracticeClock(onLeave: () => void) {
  const activity = useRef({ activeMs: 0, last: 0 });
  const leave = useRef(onLeave);
  useEffect(() => {
    leave.current = onLeave;
  });

  const touch = () => {
    const now = clock();
    const a = activity.current;
    if (a.last && now - a.last <= IDLE_MS) a.activeMs += now - a.last;
    a.last = now;
  };

  useEffect(() => {
    const onActivity = () => touch();
    const onHide = () => leave.current();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("pagehide", onHide);
      leave.current();
    };
  }, []);

  return { touch, activeMs: () => Math.round(activity.current.activeMs) };
}
