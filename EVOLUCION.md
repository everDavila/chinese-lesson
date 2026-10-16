# Evolución del proyecto (para ponerse al día)

> Resumen para un agente que llega sin contexto. Cuenta **cómo llegó el
> proyecto a donde está** en una sola lectura. No reemplaza nada: el estado
> vigente está en [ESTADO-ACTUAL.md](ESTADO-ACTUAL.md), el detalle técnico por día en
> [BITACORA.md](BITACORA.md) y quién hace qué ahora en
> [TRABAJO-EN-CURSO.md](TRABAJO-EN-CURSO.md). Si algo de aquí choca con el
> código o el `git log`, manda el código (ver AGENTS.md).
>
> Escrito el 2026-10-13 sobre `master` en `2860530`.

## Orden de lectura sugerido

1. [VOZ.md](VOZ.md) — cómo hablarle a Ever. Obligatorio.
2. Este archivo — el porqué de cada pieza.
3. [AGENTS.md](AGENTS.md) — reglas; [ESTADO-ACTUAL.md](ESTADO-ACTUAL.md) y
   [DECISIONES.md](DECISIONES.md) solo si la tarea los necesita.
4. [TRABAJO-EN-CURSO.md](TRABAJO-EN-CURSO.md) — qué ramas están vivas y de quién.
5. Según la tarea: [IDEA.md](IDEA.md), [ARQUITECTURA.md](ARQUITECTURA.md),
   [contenido/POLITICA-DE-CONTENIDO.md](contenido/POLITICA-DE-CONTENIDO.md),
   [LECCIONES.md](LECCIONES.md), las auditorías.

## En una frase

Renshi (认识) es una web para que la profesora de chino de Ever enseñe
vocabulario **en contexto** por Zoom: tarjeta con frases, descomposición del
carácter y uso, valoración de la docente y votación anónima de los alumnos
desde el celular. Nació el 2026-10-10 como reacción a las tarjetas de Quizlet
de palabras sueltas; en cuatro días pasó de idea a producción con el temario
HSK 3.0 completo.

## Línea de tiempo

### 2026-10-10 — Idea, diseño y primera demo

- **Mañana-tarde: solo documentos.** `IDEA.md` (requisitos 1–11),
  `ARQUITECTURA.md`, `BRIEF-DISENO.md`, `DIAGNOSTICO-MODO-CLASE.md`. Decisiones
  que siguen vigentes: web y no app nativa; Next.js + Supabase + Vercel por CLI;
  **la unidad es el sentido, no la palabra** (家 casa ≠ 家 clasificador); MVP
  centrado en enseñar en clase, no en autoestudio; trilingüe zh/es/en; rojo
  suave solo para la palabra clave; modo oscuro "dorado".
- **Fase 0–1 (`efefe2a` → `c8023f3`).** Proyecto Next.js, lección de demo de 10
  palabras en `contenido/leccion-demo.json` con validador de nivel
  (`npm run validate:content`), datos de Make Me a Hanzi y trazos propios
  (`stroke-art.tsx`), tarjeta con giro 3D, conexión a Supabase con login y
  sesiones de clase.
- **Primer choque entre agentes:** tres sesiones en la misma carpeta; un
  `git switch` y un `npm ci` ajenos tumbaron el trabajo. De ahí nace la regla
  de **un worktree por agente**.

### 2026-10-11 — De prototipo a vistas reales y versión estable

- **Modelo de datos definitivo** (`77451cb`, `4d355a1`): colecciones →
  lecciones → ítems por sentido; plantillas que la docente copia; **solo admin
  edita la base común**; frases propias de la docente privadas, con copias
  editadas y sugerencias que el admin acepta o rechaza.
- **Contenido moderno (Codex, rama `contenido-moderno`):** política basada en
  GF 0025-2021 / HSK 3.0, catálogos oficiales HSK 1–3 (300 + 200 + 500),
  niveles por sentido y versionados.
- **Vistas reales** (fase 1b/1c): `/collections` para la docente, `/admin`
  para Ever. Cuentas creadas por CLI; recorridos de Playwright con sesión real
  que **Ever guarda tecleando la clave él mismo**.
- **Rendimiento:** funciones de Vercel movidas a `gru1` junto a Supabase
  (`/collections` de 1,3 s a 0,5 s).
- **Base de desarrollo `hanzi-dev`:** desde aquí toda migración pasa primero
  por dev, con respaldo previo.
- **Rotación de frases y votación de alumnos** (`/v`, funciones
  `security definer` para `anon`, sin clave secreta en Vercel). Se juntaron en
  `pruebas-dev`, se probaron y pasaron a producción.
- **Ejemplos generados sin etiqueta "Sin curar" en clase**: `unreviewed` queda
  como dato editorial. Decisión de Ever para que la demo no saliera marcada.
- Cierre del día: tag `estable-2026-10-12`.

### 2026-10-12 (madrugada) — Biblioteca HSK y Renshi

- **Contenido HSK 1–3 completo (Codex):** significados y matices en español
  para los 1000 sentidos y 2637 frases curadas, cargadas sin pisar UUID.
- **Descomposición y cultura:** 655 caracteres, fórmulas coloreables, 45 notas
  culturales; probado en dev y sincronizado con producción.
- **Auditoría UX/UI** contra dev (`reports/AUDITORIA-UX-UI-2026-10-12.md`):
  foco visible, contraste del rojo, diálogos propios en vez de
  `window.confirm`.
- **Voz unificada** en `VOZ.md`; los punteros (`CLAUDE.md`, `.clinerules`,
  `AGENTS.md`) solo remiten ahí. Keep-alive de Supabase en GitHub Actions.
- **Catálogo HSK 4–9 (Codex, `contenido-hsk4-9`):** 1000 + 1600 + 1800 + 5600
  entradas, 7–9 como una sola banda (nivel 7 en la base). Sin frases a
  propósito. Para que el editor no cargara 11 000 palabras, búsqueda en la base
  con `search_words` (`f88120f`).
- **Palabras sin frases se presentan** con la consigna "Inventen una frase con
  X" (`31df27e`). Antes desaparecían en silencio de la clase.
- **Votación que sigue a la tarjeta** (`cd444ef`) y código del alumno en seis
  casillas (`b264051`).
- **Renombre a Renshi** (`c311455`, `9e73882`): `renshi.davila.uno`; lo
  interno (Vercel `hanzi`, Supabase, repo) no cambió a propósito.
- **Plantillas por tema (Cline, `cline-temas`):** 10 colecciones por contexto
  (Comer fuera, Viajes, Salud…), unidas a `master` (`6c3d09c`).

### 2026-10-12 (día) — Trabajo en paralelo y coordinación

- **Práctica de escritura** en `/lab/escritura` (Claude Code, rama
  `prueba-escritura`, `643f259`). Sin unir.
- **`TRABAJO-EN-CURSO.md` + `npm run worktrees`** (`566e2ea`): una fila por
  agente, el script crea las carpetas que falten al cambiar de PC.
- **Panda que guía el código del alumno** (`69297af`, `5b8e25f`): unido.
- **Rediseño de la votación del alumno** (Codex, `ux-voto-alumno`, 4 commits
  hasta `0e14493`). Sin unir: quedó detrás del panda y no es fast-forward.

### 2026-10-13 — Plantillas en producción y frases pendientes

- Migración de temas (`20261012040000`) aplicada en producción con respaldo
  `backups/supabase-2026-10-13T1950.json` (`e2b5409`).
- **Convenio de carpetas:** `<agente>-chinese-lesson-<rama>`, derivado por el
  script, no a mano (`9e6d2ef`).
- **Corrección de un error propio de la documentación:** se había escrito que
  las plantillas de tema no tenían frases; 231 de 317 sí (`a41314f`).
- **Frases pendientes de las plantillas** (`dd8533f`, `2860530`): 85 palabras
  HSK 4–6 sin frases, repartidas en `contenido/temas-frases-hsk{4,5,6}.json`
  con las claves reales de producción. Orden de trabajo en
  [contenido/FRASES-TEMAS-PENDIENTES.md](contenido/FRASES-TEMAS-PENDIENTES.md).
  Un archivo por nivel porque el importador escribe un solo
  `metadata.level` en `sentences.computed_level`.

## Agentes y cómo se reparten

- **Claude Code:** interfaz, Supabase, despliegue, pruebas, documentación.
- **Codex:** contenido lingüístico (catálogos, curación, descomposición) y la
  votación del alumno.
- **Cline:** plantillas por tema y una auditoría. Su tarea ya está unida.
- Todos los commits salen con el autor de Ever; el agente se deduce de la rama
  y de `TRABAJO-EN-CURSO.md`, no del autor.

## Ramas que siguen vivas (al 2026-10-13)

| Rama | Qué tiene sin unir | Situación |
|---|---|---|
| `prueba-escritura` | `/lab/escritura` | Falta que Ever la pruebe en el celular |
| `ux-voto-alumno` | Rediseño de la votación (Codex) | Necesita merge real, no fast-forward |
| `contenido-hsk4-9` | 2 commits de reacciones de la mascota | El catálogo ya está en `master`; hay cambios sin commitear en esa carpeta |

El resto de ramas remotas (`fase-1*`, `rotacion-frases`, `votacion-alumnos`,
`pruebas-dev`, `contenido-moderno`, `cline-temas`, `fix-panda-cursor`,
`ux-panda-codigo`…) ya están en `master`: son historia.

## Lo que aprendió el proyecto (y conviene no repetir)

- Varios agentes en una sola carpeta se pisan. Worktree propio, siempre.
- Una migración nueva se prueba en `hanzi-dev` con respaldo antes de
  producción; dos agentes ya chocaron con el mismo número de migración.
- Código nuevo que llama a una función de la base se despliega **después** de
  la migración, no antes.
- Next 16 con Cache Components: `usePathname` en el layout exige `Suspense`;
  `redirect()` dentro de `Suspense` devuelve 200. Más trampas en
  [LECCIONES.md](LECCIONES.md).
- Los documentos de estado se desactualizan rápido: verificar contra el
  código y la base antes de afirmar algo.

## Pendientes grandes

- Frases para HSK 4–9 (unas 9900 palabras), empezando por las 85 de los temas.
- Revisión humana de todo el contenido: sigue `unreviewed`.
- Palabras propias de la docente fuera del temario (拜拜).
- Probar la votación con varios celulares reales y los recorridos contra
  producción.
- Ítems abiertos de las dos auditorías e ideas en
  [IDEAS-POR-CONTRASTAR.md](IDEAS-POR-CONTRASTAR.md).
