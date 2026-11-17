# Auditoría UX · 2026-11-17

Páginas sin sesión, a 390 px (celular) y 1280 px (escritorio), con capturas y
axe-core (WCAG 2 A/AA y buenas prácticas): `/es`, `/es/login`, `/es/aprende`,
`/es/lab`, `/es/lab/quiz`, `/es/lab/tarjetas`, `/es/lab/emparejar`,
`/es/lab/radicales`, `/es/creditos`. Servidor de desarrollo local.

**Alcance.** No se auditaron las pantallas con cuenta (alumno, docente, admin):
no hay sesiones de prueba vigentes. Es lo más importante que falta, y es donde
vive casi todo el diseño que usan los alumnos.

## Corregido en esta pasada

| Hallazgo | Dónde | Arreglo |
|---|---|---|
| Error de hidratación: `Math.random()` en el render del servidor y del cliente | `/lab/emparejar` (mi piloto) | Las tandas se arman al pulsar «Empezar» |
| Sin `<main>` (axe `landmark-one-main`) | Portada `/es` | Contenido envuelto en `<main>` |
| Sin `<h1>` y barra de avance sin nombre (axe *serious*) | `/lab/tarjetas` | `h1` visible solo para lector y `aria-label` |
| El logotipo 认识 se partía en dos líneas a 390 px | Portada | `whitespace-nowrap` y `shrink-0` |
| Enlaces del pie de 15 px de alto (área táctil mínima 24 px) | Todas las páginas | `py-2` |

## Sin corregir (para decidir)

1. **Tablas con desplazamiento sin teclado** (axe *serious*,
   `scrollable-region-focusable`): el contenedor de `src/components/ui/table.tsx`
   tiene `overflow-x-auto` y no se puede enfocar. Arreglarlo con `tabIndex={0}`
   añade una parada de tabulador a *cada* tabla, incluidas las que no se
   desbordan; lo razonable es hacerlo solo cuando hay desborde. Afecta a
   `/lab/radicales`.
2. **Franja del laboratorio fuera de un landmark** (axe `region`, moderado):
   `lab-chrome.tsx` usa `role="note"`; no es un defecto real, es ruido de axe.
3. **Portada:** 40 nodos fuera de landmark y una cabecera de tabla vacía
   (`.w-8`). Revisar después de envolver en `<main>`; no se volvió a medir la
   cabecera vacía.
4. **Objetivos táctiles pequeños** que quedan: selector de idioma (el `<select>`
   mide 19 px, pero su `<label>` de 40 px lo rodea, así que el toque cae bien),
   «Repetir el trazo» (20 px) y los botones de las palabras de la demo (16×24).
5. **Tipografía en el pie y créditos:** texto de 12 px (`text-xs`); legible, pero
   en el límite para pantallas pequeñas.

## Lo que se vio bien

Jerarquía clara en la portada y en «Saber más»; el selector del laboratorio
(Todos / En prueba / Implementados) y las tarjetas de piloto se leen en una
mano; ninguna página tiene desplazamiento horizontal a 390 px.

## Lo que falta para una auditoría de verdad

- Pantallas con cuenta, a 390 px: inicio del alumno (racha, meta, repaso,
  progreso), práctica (elegir fuente, tarjeta, escribir), rastreador de nivel,
  inicio de la docente, editor de lecciones y presentación.
- Contraste medido en modo oscuro (aquí solo se vio el claro).
- Prueba con el dedo en un celular real (las pruebas de toque fueron emuladas).
- Una pasada de diseño, no solo de accesibilidad: densidad del inicio del
  alumno (nueve secciones apiladas), coherencia entre «Aprender», «Saber más» y
  «Biblioteca», y qué aporta cada franja del laboratorio.
