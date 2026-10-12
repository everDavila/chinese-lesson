# Trabajo en curso

> Qué está haciendo cada agente, en qué rama y en qué carpeta. **Viaja con el
> repo**: al cambiar de PC, cada agente busca aquí su fila y sigue donde quedó.
> Las carpetas (worktrees) no viajan con git; las ramas sí, si están subidas.

## Al empezar en una PC

1. `git pull` en la carpeta principal (`chinese-lesson`).
2. `npm run worktrees`: crea las carpetas de la tabla que falten en esta PC, a
   partir de las ramas de GitHub, y copia los `.env` y las sesiones de prueba
   de la carpeta principal. `npm run worktrees -- --instalar` además corre
   `npm ci` en las nuevas. (En PowerShell el `--` se pierde: usa
   `node scripts/worktrees.mjs --instalar`.)
3. Cada agente se abre en **su** carpeta, lee su fila y sigue.

## Antes de que Ever cambie de PC (o al cerrar una tarea)

Cada agente, en su carpeta:
1. Commitea lo que tenga (aunque esté a medias, con un mensaje que lo diga) y
   **sube su rama**: `git push -u origin <rama>`.
2. Actualiza **solo su fila** de la tabla: en qué quedó y qué falta. Commitea
   este archivo en `master` con ruta explícita.

`npm run worktrees -- --estado` lista, por fila, si la carpeta existe, si hay
cambios sin commitear y si la rama tiene commits sin subir.

## Tabla

Una fila por tarea activa. La rama y la carpeta van entre comillas invertidas:
el script las lee de ahí. Al unir una tarea a `master`, su fila sale de la tabla
(queda en la bitácora).

| Agente | Rama | Carpeta | Puerto | Tarea | Estado (fecha) |
|---|---|---|---|---|---|
| Claude Code | `prueba-escritura` | `chinese-lesson-escritura` | 3006 | Práctica de escritura en `/lab/escritura` (Hanzi Writer: calcar o de memoria, niveles de tolerancia) | Hecha y probada con trazos simulados; falta que Ever la pruebe con el dedo en el celular y fijar los valores de cada nivel (2026-10-12) |
| Cline | `cline-temas` | `chinese-lesson-cline` | 3002 | Plantillas por tema (10 dominios, migración `20261012040000`) | Unida a `master` y aplicada en hanzi-dev; falta aplicarla en producción con respaldo (2026-10-12) |
| Codex | `contenido-hsk4-9` | `chinese-lesson-hsk4-9` | — | Catálogo HSK 4–9 (en producción); 2 commits más sobre la mascota de credenciales sin unir | Por confirmar con Codex (2026-10-12) |
