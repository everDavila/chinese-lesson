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
| Claude Code | `integrar-inicio` | `chinese-lesson-integrar` | 3005 | Integrar el inicio docente de Codex y rehacer la biblioteca HSK por nivel completo (`hsk_catalog`), sin lecciones de 15 | Hecho y probado contra hanzi-dev: catálogo por nivel con paginación (shadcn), prioridades 1–3 de la hoja de ruta y «Quitar» (archivar o borrar). Recorridos 11/11, visuales 120/120; 4 migraciones solo en dev. Esperando revisión de Ever y autorización para producción (2026-10-17) |
| Claude Code | `prueba-escritura` | `chinese-lesson-escritura` | 3006 | Práctica de escritura en `/lab/escritura` (Hanzi Writer: calcar o de memoria, niveles de tolerancia) | Hecha y probada con trazos simulados; falta que Ever la pruebe con el dedo en el celular y fijar los valores de cada nivel (2026-10-12) |
| Codex | `ux-voto-alumno` | `codex-chinese-lesson-ux-voto-alumno` | — | Rediseño de la votación del alumno (4 commits: responder sin interrupciones, nota HSK ocultada, verde al confirmar) con `design-qa.md` y capturas | Sin unir a `master`; quedó atrás del panda del código, el merge no es fast-forward (2026-10-13) |
| Codex | `contenido-hsk4-9` | `chinese-lesson-contenido-hsk4-9` | — | Catálogo HSK 4–9 (en producción); 2 commits más sobre la mascota de credenciales sin unir | Sin trabajo pendiente: los 23 archivos eran solo cambios de modo de permisos (bit ejecutable) al copiar entre PCs, sin contenido; rama en 0 ahead/0 behind con `origin`. Resuelto con `core.fileMode=false` en el `.git` común (2026-10-14) |
| Codex | `documentacion-producto` | `codex-chinese-lesson-documentacion-producto` | — | Requisitos de producto, flujos, brief de diseño, requisitos técnicos, esquema backend y plan de implementación | Seis documentos terminados y verificados en el commit `0624c78`; rama local, pendiente de revisión y de subir/unir (2026-10-15) |
| Codex | `pendientes-prioritarios` | `codex-chinese-lesson-pendientes-prioritarios` | 3002 | Conexión de la votación, idioma semántico, documentación y tria de ramas | Terminada, verificada y subida en `91538d3`; lista para revisar/unir. `documentacion-producto` quedó absorbida; `ux-voto-alumno` y `prueba-escritura` se conservan como experimentos, sin fusión ciega (2026-10-16) |
| Cline | `inicio-profesor` | `cline-chinese-lesson-inicio-profesor` | 3003 | Home del profesor previo a clase: pantalla donde ve sus recursos (colecciones, plantillas, lecciones) antes de presentar | Creado el worktree desde `master` (f79a28a), `.env`/sesiones copiados, `npm ci` OK (2026-10-16) |
| Codex | `inicio-profesor-renshi` | `codex-chinese-lesson-inicio-profesor-renshi` | 3004 | Implementar el espacio de preparación docente a partir del HTML y la referencia visual aprobada, usando datos y flujos reales | Terminada, probada y subida en `158ac2b`; 4 commits listos para revisar o integrar, sin desplegar (2026-10-16) |
| Codex | `contenido-espanol-latinoamericano` | `codex-chinese-lesson-contenido-espanol-latinoamericano` | 3008 | Auditar producción y fuentes, corregir español peninsular y fijar español neutro latinoamericano como política validable | Terminada: 36 traducciones corregidas y verificadas en fuentes, `hanzi-dev` y producción; UUID, origen y estado preservados. Validador, lint y 18 pruebas pasan; rama lista para integrar (2026-10-17) |
| Codex | `ayudas-frase-notas` | `codex-chinese-lesson-ayudas-frase-notas` | 3010 | Controles progresivos de audio, pinyin y traducción; ayuda contextual para palabras chinas en notas | Implementada; pruebas unitarias y lint pasan, pendiente de verificación visual por bloqueo local de SWC (2026-10-17) |
