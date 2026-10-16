# AGENTS.md

> Instrucciones compartidas para cualquier agente del repositorio. Este archivo
> se carga siempre: deja aquí solo reglas universales. El contexto extenso vive
> en documentos enlazados y se lee únicamente cuando la tarea lo requiere.

## Proyecto

- **Renshi (认识)** — demo web para enseñar vocabulario chino en contexto por
  Zoom. Repositorio: https://github.com/everDavila/chinese-lesson (Ever Dávila,
  `everDavila`). Producción: https://renshi.davila.uno desde `master`.
- Stack: Next.js 16.4 (Cache Components), React 19.3, TypeScript, Tailwind v4,
  shadcn/ui (Base UI), next-intl, next-themes, Hanzi Writer, Supabase y Vercel.
  Node ≥ 20.9.
- Antes de una propuesta grande, lee [IDEA.md](IDEA.md) y
  [ARQUITECTURA.md](ARQUITECTURA.md).

## Contexto bajo demanda

No leas todos estos archivos por defecto:

- Estado vigente: [ESTADO-ACTUAL.md](ESTADO-ACTUAL.md).
- Cómo llegó el proyecto aquí: [EVOLUCION.md](EVOLUCION.md).
- Trabajo y ramas activas: [TRABAJO-EN-CURSO.md](TRABAJO-EN-CURSO.md).
- Historial de decisiones: [DECISIONES.md](DECISIONES.md).
- Historial técnico: [BITACORA.md](BITACORA.md).
- Voz para hablar con Ever: [VOZ.md](VOZ.md).
- Lecciones técnicas: [LECCIONES.md](LECCIONES.md).
- Ideas aún no decididas: [IDEAS-POR-CONTRASTAR.md](IDEAS-POR-CONTRASTAR.md).
- Política lingüística: [contenido/POLITICA-DE-CONTENIDO.md](contenido/POLITICA-DE-CONTENIDO.md).

## Antes de editar

1. Ejecuta `git status` y `git log`. No pises cambios que no reconoces.
2. Busca tu tarea en [TRABAJO-EN-CURSO.md](TRABAJO-EN-CURSO.md). Si hay varias
   sesiones o agentes, cada uno usa su worktree y puerto. `npm run worktrees`
   deriva la carpeta `<agente>-chinese-lesson-<rama>`; no la inventes a mano.
3. Verifica cualquier documento previo contra el código actual.
4. Para Next.js, lee la guía relevante de `node_modules/next/dist/docs/` antes
   de escribir código; esta versión tiene cambios incompatibles.

Lo grande o riesgoso —auth, modelo de datos o cambios globales— va en una rama
o worktree aparte. Lo pequeño puede ir directo. Antes de cambiar de PC o cerrar
una tarea, commitea, sube la rama y actualiza solo tu fila de trabajo.

## Seguridad, datos y despliegue

- Nunca subas secretos ni `.env*`, `input-externo/`, `backups/` o
  `tests/.auth*`. Usa placeholders en `.env.example`.
- Ever escribe claves y contraseñas; un agente nunca las pide ni las pega en
  el chat.
- Pide confirmación antes de una operación destructiva y antes de push o
  despliegue a `master`, salvo petición explícita de Ever.
- Toda migración se prueba primero en `hanzi-dev`, con respaldo previo mediante
  `npm run db:backup`. Vercel no lleva la clave secreta de Supabase.
- Vercel y Supabase están en São Paulo (`gru1` / `sa-east-1`). Los despliegues
  se gestionan solo por CLI; `master` despliega a producción.

## Comandos y pruebas

- Los comandos viven en `package.json`.
- Sesiones: `npm run test:sesion admin` / `laoshi`; Ever escribe la clave. Los
  recorridos marcan y eliminan sus datos de prueba.
- Base dev: `npm run dev:base-dev` (puerto 3001), `test:sesion:dev`,
  `test:recorridos:dev`, `db:dev:copiar`. En PowerShell usa los scripts `:dev`:
  `npm run x -- y --dev` pierde `--dev`.
- Playwright usa `PLAYWRIGHT_PORT` (3000 por defecto); cada agente toma un
  puerto distinto.

## Convenciones

- Código e identificadores en inglés; commits en español, pequeños y atómicos.
  El mensaje explica qué cambió, por qué y la decisión detrás.
- Commitea con rutas explícitas (`git commit <archivos> -m …`); no hagas un
  `git add` general separado del commit.
- Si cambia una decisión de arquitectura, actualiza [DECISIONES.md](DECISIONES.md)
  y la bitácora. Si termina algo relevante, actualiza
  [ESTADO-ACTUAL.md](ESTADO-ACTUAL.md).
- Cuando Ever diga **«para bitácora»**, lee y sigue
  [PARA-BITACORA.md](PARA-BITACORA.md). No publiques ni despliegues.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
