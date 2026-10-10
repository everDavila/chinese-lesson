# Lecciones heredadas

> Lecciones verificadas en **Nimbus** (`appclima`: Vue 3 + Firebase +
> Capacitor), traducidas a este proyecto (Next.js + Supabase). Las que no
> aplican se descartan al final.
>
> Cuando pase de ~20 lecciones: partir en `docs/lecciones/` (un archivo por
> lección + `README.md` como índice).

## CSS y animación
- **`filter: blur()` sobre algo pequeño o semitransparente lo vuelve
  invisible.** Diluye la opacidad efectiva por debajo de lo perceptible (pasó
  tres veces en Nimbus). Para algo suave pero visible: `radial-gradient` con
  centro sólido que se degrada a transparente.
  *Aquí:* brillos o halos en tarjetas, retícula 米字格, resaltado de radicales.
- **No verifiques animaciones con capturas al azar.** La ventana visible suele
  ser una fracción del ciclo y la captura falla por mala suerte. Lee el estado
  computado (`getComputedStyle`: opacidad, nombre y duración de la animación).
  *Aquí:* trazos de Hanzi Writer y giro de tarjeta en los tests de Playwright.

## Estado y depuración
- **Mutar estado anidado puede no propagar a los derivados.** En Pinia,
  `$patch` con el objeto completo sí propaga. *Equivalente en React:*
  actualizar siempre de forma inmutable (objeto nuevo), nunca mutar el
  existente; si algo "no se actualiza", sospechar de esto primero.
- **Atajo de depuración en consola** para que Ever fuerce estados sin pedir
  snippets: exponer el estado en `window.__algo`, solo en desarrollo
  (`process.env.NODE_ENV === 'development'`).
  *Aquí:* forzar una tarjeta, un alumno o un color del semáforo.

## Riesgos de arquitectura a vigilar
- **Privacidad:** guardamos datos de alumnos (nombre, resultados). Antes de
  usarlo con alumnos reales: página de privacidad y términos, y qué se borra
  y cuándo.
- **Pruebas separadas de producción.** El plan gratis de Supabase permite 2
  proyectos: uno de desarrollo y otro de producción. Probar el panel nunca
  debe escribir datos reales.
- **2FA en las cuentas de administración** (Supabase, Vercel, GitHub).
- **No escribir en la base por cada evento menor.** Guardar un `Review` por
  valoración está bien; no registrar cada vista, giro o clic. Si hace falta,
  agrupar las escrituras al terminar la sesión de práctica.

## No aplican (por ahora)
- Tokens de notificaciones push (rotan y caducan): no hay push en el MVP.
  Revisar si se añaden recordatorios de repaso.
