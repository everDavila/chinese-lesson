# Reglas de desarrollo

> Regla de Ever para todos los agentes (2026-10-17). Se aplica antes de
> implementar cualquier funcionalidad.

## Antes de implementar, en este orden

1. **Revisar el proyecto:** comprobar si ya existe un componente, utilidad,
   biblioteca o patrón que resuelva la necesidad.
2. **Revisar las dependencias instaladas:** aprovechar las librerías que ya
   utiliza Renshi.
3. **Investigar soluciones existentes:** buscar componentes y librerías
   consolidadas, compatibles con nuestro stack (Next.js, React, TypeScript y
   las herramientas del proyecto).
4. **Evaluar alternativas:** documentación, mantenimiento activo,
   accesibilidad, rendimiento, seguridad, licencias y compatibilidad.
5. **Desarrollar desde cero solo cuando esté justificado:** si ninguna
   solución existente cumple los requisitos, o si incorporar una dependencia
   cuesta más que una implementación sencilla.

## Reglas de implementación

- No reinventar componentes comunes: paginación, tablas, selectores,
  calendarios, diálogos o formularios.
- Priorizar los componentes del sistema de diseño existente (shadcn/ui sobre
  Base UI; se añaden con `npx shadcn@latest add <componente>`).
- No instalar bibliotecas distintas que resuelvan el mismo problema.
- No incorporar dependencias innecesarias.
- Preferir soluciones accesibles y mantenidas activamente.
- No modificar componentes de terceros directamente si se pueden extender
  mediante sus APIs.
- Mantener la coherencia visual y funcional de Renshi.

## Pilotos y experimentos

Regla de Ever (2026-10-19): Ever graba la pantalla, y quien vea el video tiene
que saber que un piloto no es Renshi terminado.

- Todo piloto o experimento vive bajo `/lab/<nombre>`. Ahí hereda sola la
  franja «Laboratorio · Piloto en prueba» de `src/app/[locale]/lab/layout.tsx`;
  no se quita ni se tapa.
- Si un experimento tiene que vivir fuera de `/lab` (por ejemplo, dentro de
  una lección), muestra la misma franja de forma visible mientras sea piloto.

## Antes de desarrollar un componente nuevo

Identifica y explica:

- Qué soluciones existen ya en el proyecto.
- Qué bibliotecas externas podrían usarse.
- Cuál recomiendas y por qué.
- Si requiere instalar alguna dependencia nueva.

No hace falta pedir autorización para reutilizar componentes existentes. Pero
**antes de introducir una dependencia importante o reemplazar una biblioteca
del proyecto, explica la decisión y sus consecuencias** a Ever.

## Criterio fundamental

No construyas desde cero lo que ya existe y funciona correctamente. Pero
tampoco incorpores una biblioteca compleja para resolver un problema sencillo.

El objetivo es reducir deuda técnica, acelerar el desarrollo y mantener
Renshi consistente, escalable y fácil de mantener.
