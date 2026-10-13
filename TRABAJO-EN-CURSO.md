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

**La carpeta no se elige a mano: la deriva el script como
`<agente>-chinese-lesson-<rama>`**, con el agente al frente, para que `ls`
agrupe por dueño. Las de esta tabla son de antes del convenio y el script las
marca con ⚠ «nombre fuera de convenio»: avisá, no las renombres si otro agente
está trabajando ahí.

**Es identificación, no candado:** cualquiera puede retomar la tarea de otro
agente. Lo único que frena el script es duplicar la *misma rama* en dos
carpetas (un `npm ci` en una rompe la otra); no impide que otro la continúe.

| Agente | Rama | Carpeta | Puerto | Tarea | Estado (fecha) |
|---|---|---|---|---|---|
| Claude Code | `prueba-escritura` | `chinese-lesson-escritura` | 3006 | Práctica de escritura en `/lab/escritura` (Hanzi Writer: calcar o de memoria, niveles de tolerancia) | Hecha y probada con trazos simulados; falta que Ever la pruebe con el dedo en el celular y fijar los valores de cada nivel (2026-10-12) |
| Codex | `ux-voto-alumno` | `codex-chinese-lesson-ux-voto-alumno` | — | Rediseño de la votación del alumno (4 commits: responder sin interrupciones, nota HSK ocultada, verde al confirmar) con `design-qa.md` y capturas | Sin unir a `master`; quedó atrás del panda del código, el merge no es fast-forward (2026-10-13) |
| Codex | `contenido-hsk4-9` | `chinese-lesson-contenido-hsk4-9` | — | Catálogo HSK 4–9 (en producción); 2 commits más sobre la mascota de credenciales sin unir | 23 archivos sin commitear en esta PC; por confirmar con Codex (2026-10-12) |
