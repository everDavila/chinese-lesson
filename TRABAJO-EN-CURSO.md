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

`npm run worktrees -- --estado` solo inspecciona: no hace `fetch`, no crea
carpetas ni copia archivos. Lista cambios pendientes y commits por subir o
traer según las referencias locales (pueden estar desactualizadas). Comprueba
que cada carpeta sea de este repositorio y tenga la rama indicada; los fallos
se muestran como errores, nunca como una carpeta limpia.

Sin `--estado`, hace `fetch` y crea las carpetas faltantes; solo en las nuevas
copia los `.env` y las sesiones, y con `--instalar` instala dependencias. Si
falla una comprobación o preparación, devuelve un código de salida de error.
Prueba del script: `node --test tests/scripts/worktrees.test.mjs`.

## Tabla

Una fila por tarea activa. La rama va entre comillas invertidas. Para una
tarea nueva, deja `—` en Carpeta: el script calcula el nombre y puedes anotarlo
después de crearla. Las carpetas antiguas van entre comillas invertidas. Al
unir una tarea a `master`, su fila sale de la tabla (queda en la bitácora).

**La carpeta nueva no se elige a mano: la deriva el script como
`<agente>-chinese-lesson-<rama>`**, con el agente en minúsculas y espacios
convertidos en guiones (`Claude Code` → `claude-code`); las barras de la rama
también se convierten en guiones. Así `ls` agrupa por dueño. Una carpeta antigua
existente se conserva y se marca con ⚠ «nombre fuera de convenio»: avisa, no
la renombres si otro agente está trabajando ahí. Si no existe, se crea con el
nombre derivado, aunque la tabla todavía indique el antiguo.

El script consulta siempre el registro de la carpeta principal, también al
ejecutarse desde un worktree. Actualiza allí tu fila para evitar usar copias
antiguas del registro.

**Es identificación, no candado:** cualquiera puede retomar la tarea de otro
agente. Lo único que frena el script es duplicar la *misma rama* en dos
carpetas; no impide que otro la continúe. Cada worktree tiene sus propias
dependencias: un `npm ci` en carpetas separadas no afecta al otro. Compartir
carpeta sí permite pisarse archivos, dependencias y cambios de rama.

| Agente | Rama | Carpeta | Puerto | Tarea | Estado (fecha) |
|---|---|---|---|---|---|
| Codex | `ux-voto-alumno` | `codex-chinese-lesson-ux-voto-alumno` | — | Rediseño de la votación del alumno (4 commits: responder sin interrupciones, nota HSK ocultada, verde al confirmar) con `design-qa.md` y capturas | Descartada por ahora (Ever, 2026-10-17): choca con el aviso de conexión de `pendientes-prioritarios` en el mismo componente |
| Codex | `landing-publica` | — | 3006 | Portada pública de Renshi basada en la propuesta visual elegida, con una sección 3 menos densa | En construcción desde `master` (2026-10-18) |
| Codex | `rediseno-tarjeta-profesor` | `codex-chinese-lesson-rediseno-tarjeta-profesor` | 3009 | Rediseño visual del reverso en modo profesor: cabecera palabra/composición, ejemplos con frase maestra y panel docente; comprensión del grupo solo con votos | Integrado a `master` (2026-10-20): suite visual y recorridos en verde. Pendiente de Ever: barra que se oculta a los 3 s y «frase maestra» = primera frase |
| Cline | `inicio-profesor` | `cline-chinese-lesson-inicio-profesor` | 3003 | Home del profesor previo a clase: pantalla donde ve sus recursos (colecciones, plantillas, lecciones) antes de presentar | Creado el worktree desde `master` (f79a28a), `.env`/sesiones copiados, `npm ci` OK (2026-10-16) |
| Claude Code | `lab-gramatica` | `claude-code-chinese-lesson-lab-gramatica` | 3008 | Piloto `/lab/gramatica`: armar frases con 12 puntos de gramática HSK 1 (Gushi + consignas IA), revisión mínima y modo proyectar; sin base | Rama subida (`9e4be29`): piloto, franja de laboratorio para todo `/lab`, regla en `REGLAS-DESARROLLO.md` y bitácora. Consignas sin revisar; falta probarlo en celular y en clase (2026-10-19) |
