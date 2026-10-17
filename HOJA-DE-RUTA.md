# Hoja de ruta Renshi — pendientes

> Definida por Ever el 2026-10-17. Al completar un punto, márcalo aquí y
> registra la decisión en [DECISIONES.md](DECISIONES.md).

## Estado actual

Prioridades 1–3 en producción desde el 2026-10-17 (autorizado por Ever tras la
revisión en desarrollo). Sigue la 4.

## Prioridades

1. ✅ *(en producción, 2026-10-17)* **Crear lecciones
   directamente**, sin obligar a crear una colección. Después, permitir **mover
   lecciones entre colecciones** sin duplicar palabras ni alterar el historial.
   Hecho: «Nueva lección» en Mis lecciones y en «Crear»; «Mover a colección» en
   el editor y en cada lección de una colección. La rotación sigue a la
   colección (al mover, la lección empieza sin historial en la destino).
2. ✅ *(en producción, 2026-10-17)* **Selección
   múltiple en la tabla del catálogo**, persistente entre páginas, basada en
   `sense_id`. Hecho: casilla por fila y de página (con estado a medias); la
   selección se conserva entre páginas, niveles y al recargar (sessionStorage
   de la pestaña); barra con «Ver selección» y «Quitar todas». Todavía sin
   acciones: las agregan las prioridades 3 y 4.
3. ✅ *(en producción, 2026-10-17)* **Presentar desde
   el catálogo** (todo el nivel o la selección) sin crear una lección visible.
   Hecho: «Presentar el nivel» y «Presentar selección» confirman si pasan de
   100 palabras; la selección admite hasta 1000. Crean una lección rápida
   (`lessons.quick`) que no sale en Mis lecciones. HSK 7–9 completo (5600) abre
   en ~37 s desde un servidor local.
   Además: «Quitar» colecciones y lecciones (archivar o borrar definitivamente),
   con la página «Archivadas» para restaurar.
4. **Durante la presentación, "Guardar como lección"**, sin obligar a asignar
   colección.
5. **Reorganizar "Mis lecciones" y "Mis colecciones"**, separando la biblioteca
   oficial de lo que crea o copia la docente.

## Reglas que acompañan la hoja de ruta

- Retirar "Copiar HSK" (lecciones de 15 palabras) cuando ya exista crear
  lecciones desde el catálogo.
- Mantener la regla de niveles HSK por entrada (`sense_id`): si no hay entrada
  oficial, mostrar sin nivel, sin adivinar.
- No desplegar a producción hasta completar la revisión visual y las pruebas en
  desarrollo.
- Cada punto sigue [REGLAS-DESARROLLO.md](REGLAS-DESARROLLO.md): reutilizar lo
  que ya existe antes de construir.
