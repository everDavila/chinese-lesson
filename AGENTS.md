# AGENTS.md

> **Fuente de verdad compartida** para cualquier agente que trabaje en este
> repositorio (Cline, Claude Code, Codex…). Viaja con el repo. Mantenlo al día:
> el historial detallado va en [BITACORA.md](BITACORA.md), no aquí.

## Proyecto
- **chinese-lesson** — https://github.com/everDavila/chinese-lesson (owner: Ever Dávila, `everDavila`).
- Demo web para que la profesora de chino de Ever enseñe vocabulario **en
  contexto** (frases, descomposición, tono y uso) por Zoom. Idea en
  [IDEA.md](IDEA.md), arquitectura en [ARQUITECTURA.md](ARQUITECTURA.md): léelos
  antes de proponer algo grande.
- Voz para hablar con Ever: [VOZ.md](VOZ.md).
- Si llegas sin contexto: [EVOLUCION.md](EVOLUCION.md) cuenta cómo llegó el
  proyecto hasta aquí, en una lectura.

## Estado actual
- **Producción:** https://renshi.davila.uno (el producto se llama Renshi, 认识;
  https://hanzi.davila.uno redirige ahí y https://davila-hanzi.vercel.app sigue),
  desde `master`. Última versión estable etiquetada: `estable-2026-10-12`.
- **Funciona:** docente en `/collections` (colecciones, plantillas HSK 1–3,
  lecciones, frases propias, copias editadas, sugerencias, rotación de frases,
  clase en vivo con valoración y votación anónima de alumnos en `/v`; el panda
  guía y valida el código de acceso del alumno); admin en
  `/admin` (base común, editor de palabra, vista previa, plantillas, bandeja de
  sugerencias). Cuentas: Ever (`admin`) y la profesora (`teacher`).
- **Plantillas de vocabulario por contexto:** 10 colecciones curadas (Comer
  fuera, Vida diaria, Trabajo, Viajes, Transporte, Compras, Salud y cuerpo,
  Tecnología, Medio ambiente, Sociedad y cultura) sobre el temario HSK 3.0
  1–3, aplicadas en producción el 2026-10-13 (317 ítems, 287 sentidos
  distintos: unos se repiten entre temas). **231 de los 317 tienen frases** de
  la curación HSK 1–3 (3 por palabra); los 86 restantes salen con la consigna
  "Inventen una frase con X". Todas `unreviewed`, sin etiqueta visible en clase.
- **Frases de temas (rama `contenido-frases-temas`):** redactadas 85 frases
  originales, una por sentido solo para esta tarea (43 HSK 4, 37 HSK 5, 5 HSK
  6), que cubren las 86 apariciones pendientes de las plantillas. Validadas y
  cargadas en `hanzi-dev` con respaldo el 2026-10-13; todas `unreviewed`.
  No aplicadas en producción ni unidas a `master`. Seguimiento en
  [contenido/FRASES-TEMAS-PENDIENTES.md](contenido/FRASES-TEMAS-PENDIENTES.md).
- **Contenido HSK 1–3:** los 1000 sentidos oficiales tienen significado en
  español y 2637 frases (840 + 530 + 1267) con primera curación lingüística.
  Significados, matices y frases ya están en `hanzi-dev` y producción; siguen
  `unreviewed` hasta aprobación humana. La curación conservó UUID y corrigió
  178 filas HSK 1, 86 HSK 2 y 273 HSK 3.
- **Catálogo HSK 4–9 en preparación (rama `contenido-hsk4-9`):** el temario
  oficial 2025/2026 añade 1000 entradas en HSK 4, 1600 en HSK 5, 1800 en HSK
  6 y 5600 en la banda conjunta HSK 7–9. Tienen pinyin, categoría, glosa
  española básica y descomposición, pero deliberadamente no tienen frases,
  matices ni notas culturales. Las cuatro migraciones y 3088 caracteres ya
  están probados en `hanzi-dev`; todavía no están en producción ni en `master`.
- **Descomposición y cultura:** preparados 655 caracteres y sus trazos; 574
  fórmulas completas, 545 componentes semánticos coloreables, 267 fonéticos y
  81 descomposiciones incompletas que la interfaz oculta. Hay 45 notas
  culturales bilingües. Todo fue probado en `hanzi-dev` y sincronizado con
  producción el 2026-10-12 después del respaldo
  `backups/supabase-2026-10-12T0513.json`: `characters` quedó en 655 filas y
  las 45 notas existentes o cargadas quedaron preservadas como `unreviewed`.
- **Pendiente:** auditorías en
  [AUDITORIA-UX-CONTENIDO-2026-10-10.md](AUDITORIA-UX-CONTENIDO-2026-10-10.md) y
  [reports/AUDITORIA-UX-UI-2026-10-12.md](reports/AUDITORIA-UX-UI-2026-10-12.md)
  (cada una con su seguimiento); ideas sin decidir en
  [IDEAS-POR-CONTRASTAR.md](IDEAS-POR-CONTRASTAR.md).

## Stack y comandos
- Next.js 16.4 (Cache Components) + React 19.3, TypeScript, Tailwind v4 +
  shadcn/ui (Base UI), next-intl (zh/es/en; admin solo en español), next-themes,
  Hanzi Writer. Node ≥ 20.9.
- Supabase (Auth + Postgres + RLS), región sa-east-1. Keep-alive en
  `.github/workflows/keep-alive.yml` (secretos del repo: URL y clave publicable
  de cada base, nunca la secreta).
- Vercel, región `gru1`: push a `master` → producción; otras ramas → preview.
  Solo por CLI (`npx vercel@latest …`), sin pasos en el panel. Vercel **no**
  tiene la clave secreta de Supabase. Si un dominio nuevo no recibe
  certificado, `npx vercel@latest certs issue <dominio>`.
- Comandos en `package.json`. Lo que no se deduce de ahí:
  - **Sesiones para los recorridos:** `npm run test:sesion admin` / `laoshi`
    abre el login y **la clave la escribe Ever, nunca un agente**; queda en
    `tests/.auth/` (fuera de git). Los recorridos escriben en la base con la
    marca "Prueba automática" / "自动测试" y la borran.
  - **Base de desarrollo `hanzi-dev`:** claves en `.env.dev.local` (en otra PC,
    `npx supabase login` y `npm run db:dev:crear`). `npm run dev:base-dev`
    (puerto 3001), `test:sesion:dev`, `test:recorridos:dev`, `db:dev:copiar`.
    En PowerShell, `npm run x -- y --dev` pierde el `--dev`: usa los scripts
    `:dev`. **Toda migración se prueba ahí antes de producción**, con respaldo
    previo (`npm run db:backup`).
  - Playwright usa el puerto de `PLAYWRIGHT_PORT` (3000 por defecto); otro
    agente con su servidor usa el siguiente libre.

## Convenciones
- Código e identificadores en inglés; commits en español, pequeños y atómicos.
  El mensaje explica **qué, por qué y la decisión detrás**; tiene que
  entenderse sin abrir el diff.
- Nunca subir secretos ni `.env*`, `input-externo/`, `backups/`, `tests/.auth*`.
  Placeholders en `.env.example`.
- Las claves y contraseñas las escribe Ever; un agente nunca las pide ni las
  pega en el chat.
- Pide confirmación antes de operaciones destructivas y de push o despliegue a
  `master`, salvo que Ever lo haya pedido explícitamente.

## Reglas para los agentes
1. **Antes de editar**, `git status` y `git log`: cambios sin commitear que no
   reconoces son de otra sesión o agente; no los pises.
2. **Commitea con rutas explícitas** (`git commit <archivos> -m …`), nunca un
   `git add` suelto separado del commit.
3. **Varias sesiones o agentes a la vez: cada uno en su propia carpeta**
   (`git worktree add ../<agente>-chinese-lesson-<tarea> <rama>`) y su propio
   puerto. En la misma carpeta se pisan: un `git switch` o un `npm ci` rompe el
   trabajo del otro.
   **La carpeta lleva el agente al frente** (`codex-chinese-lesson-hsk4-9`, no
   `chinese-lesson-codex-hsk4-9`): así `ls` agrupa por dueño y el nombre no se
   confunde con el de la tarea. **No la escribas a mano**: la deriva
   `npm run worktrees` de la columna Agente. Si la tuya no sigue el convenio, el
   script te lo dice y no crea otra carpeta para una rama que ya está en uso.
   **Qué carpeta es la tuya:** [TRABAJO-EN-CURSO.md](TRABAJO-EN-CURSO.md) (una
   fila por agente: rama, carpeta, puerto, tarea y estado). Al empezar, búscate
   ahí; si la carpeta no existe en esta PC, `npm run worktrees` la crea desde la
   rama de GitHub. Al abrir una tarea nueva, agrega tu fila.
   **Antes de que Ever cambie de PC** (o al cerrar una tarea): commitea, sube tu
   rama (`git push -u origin <rama>`) y actualiza solo tu fila. Una rama sin
   subir no existe en la otra PC.
4. Lo grande o riesgoso (auth, modelo de datos, algo global) va en una rama o
   worktree aparte y se prueba antes de tocar `master`. Lo chico va directo.
5. Antes de fiarte de una nota o documento previo, verifícalo contra el código
   actual.
6. Decisiones de arquitectura → bitácora de abajo. Al terminar algo relevante,
   actualiza "Estado actual".
7. Lecciones técnicas: [LECCIONES.md](LECCIONES.md). Ideas sin decidir:
   [IDEAS-POR-CONTRASTAR.md](IDEAS-POR-CONTRASTAR.md); al decidir una, pasa a la
   bitácora de abajo y sale de ese archivo.

## Cuando Ever diga "para bitácora"
Dos salidas, en este orden; no publicar ni desplegar nada.
1. **[BITACORA.md](BITACORA.md):** entrada con la fecha de hoy: qué cambió,
   por qué, decisiones, pendientes y lo que NO se probó. Con detalle técnico
   (archivos, commits). Revisar el `git log` del día. Nunca tokens, claves ni
   correos.
2. **Borrador para la bitácora pública de davila.uno**, como texto para
   copiar: primera persona con la voz de Ever, humor seco y autocrítico,
   honesto con lo que falta, remate corto. Texto plano, párrafos de 1–3
   frases, sin rutas ni commits, entendible sin saber programar. Una idea
   por entrada (~120 palabras), sin tope diario pero sin microcambios. Por
   entrada: proyecto, fecha y hora aproximada, dimensión (Idea, Producto,
   Interfaz, Implementación, Infraestructura, Aprendizaje, Hito,
   Investigación, Testing, Contenido, Datos, Diseño de sistema,
   Accesibilidad, Proceso, Cierre del día), tag (Hipótesis, Decisión,
   Exploración, Avance, Completado, Lección, Hito, Fallo, Pivote, Insight,
   Duda, Pausa, Validación) y texto. Si falta un porqué, una sola pregunta
   antes. Si es visual, recordar la captura y qué mostrar. Guía completa en
   `D:\reposGIT\appclima\CLAUDE.md`, sección "Cuando diga 'para bitácora'"
   (solo existe en la PC de Ever).

## Bitácora de decisiones
_(Formato: `AAAA-MM-DD - decisión - motivo`)_
- 2026-10-10 - Plataforma web demostrativa, no app nativa - las clases son online.
- 2026-10-10 - Next.js como framework - Ever ya trabaja con Next.js; sirve para PWA o webview más adelante.
- 2026-10-10 - Contenido trilingüe (chino, español, inglés) y base curada propia con origen y estado de revisión por dato - la profesora es china y habla inglés; los alumnos son hispanohablantes.
- 2026-10-10 - Supabase (Auth + Postgres + RLS) con keep-alive en GitHub Actions - hace falta login para profesoras; Ever prefiere explorar un stack nuevo en vez de repetir Vue + Firebase de Nimbus.
- 2026-10-10 - Vercel con subdominio propio `hanzi.davila.uno`, gestionado solo por CLI; URL `davila-hanzi.vercel.app` (`hanzi.vercel.app` estaba tomado) - Next.js necesita servidor Node; un subdominio por proyecto no comparte origen con Nimbus; Ever no quiere pasos manuales ni URLs aleatorias.
- 2026-10-10 - El MVP se centra en la enseñanza en clase (presentación, valoración de la profesora y votación anónima), no en el autoestudio - la demo es para mostrarle a la profesora cómo podría enseñar mejor.
- 2026-10-10 - Datos de caracteres y radicales importados una vez a la base propia (sin API en vivo); IA solo para arrancar la biblioteca; votación tipo Kahoot (URL + código); rojo suave solo para la palabra clave; Tailwind v4 + shadcn/ui + next-intl + next-themes + Hanzi Writer - decisiones de Ever tras revisar el modo profesora.
- 2026-10-10 - Interfaz según el idioma del navegador (zh, es o en; si no, inglés), con selector que se recuerda, separada del idioma del contenido; textos neutros de género - los docentes previstos son chinos, pero podrá haber hispanohablantes o anglohablantes.
- 2026-10-10 - Modo oscuro con paleta "dorada": carbón frío casi negro, texto crema, acentos dorados; los hanzi conservan sus colores - aprobada por Ever tras compararla en paralelo.
- 2026-10-11 - Colecciones → lecciones → ítems por sentido; plantillas curadas (HSK y libros, solo listas de palabras) que la docente copia; **solo admin edita la base común** - diseño de ARQUITECTURA.md §4.1, aprobado por Ever. La lista de Básico 1 (`contenido/colecciones/basico-1.json`) es la colección de la clase de su profesora; se arma cuando la base esté poblada.
- 2026-10-11 - Ejemplos HSK cargados por nivel con un importador idempotente que solo inserta faltantes en sentidos `unreviewed`; temario oficial 2025/2026 para validar nivel, Gushi/Tatoeba como fuentes abiertas y complementos propios como `ai` - evita pisar contenido curado y conserva la procedencia.
- 2026-10-11 - Contenido basado en GF 0025-2021/HSK 3.0, contrastado con el corpus BCC; HSK 2.0 solo como compatibilidad. Política en [contenido/POLITICA-DE-CONTENIDO.md](contenido/POLITICA-DE-CONTENIDO.md) - evita heredar vocabulario y ejemplos desactualizados.
- 2026-10-11 - Niveles HSK como relación versionada por entrada/sentido, no por hanzi; propuestas de docentes separadas de la biblioteca global - una palabra cambia de nivel entre estándares y el temario repite formas con otra lectura (`只` zhī/zhǐ, `长` cháng/zhǎng).
- 2026-10-11 - HSK 3.0 niveles 1–3: 300 + 200 + 500 entradas (temario oficial de 2025, vigente desde 2026-07) - no mezclar con las listas de HSK 2.0 ni las comunitarias.
- 2026-10-11 - Cada ejemplo prioriza vocabulario de su nivel o inferior y admite pocas palabras superiores, marcadas como apoyo con hanzi, pinyin, significado y nivel al pasar el cursor o tocar; en colecciones de libro manda el vocabulario ya visto - frases naturales sin abandonar al principiante. **Las palabras de apoyo aún no están implementadas en la tarjeta.**
- 2026-10-11 - Los ejemplos generados se muestran antes de la revisión humana, **sin etiqueta visible en clase**; `unreviewed` queda como dato editorial - si no, toda la demo salía con "Sin curar" delante de la profesora. Decisión de Ever.
- 2026-10-11 - Las frases propias de la docente son privadas y salen siempre en sus clases; una "copia editada" sustituye a la original solo para ella y puede ocultar originales. Si el admin acepta una sugerencia, pasa a la base común (nueva o reemplazando la original, con el texto anterior en `revisions`); si la rechaza, sigue siendo suya - la docente no depende del admin para enseñar, y nadie más toca la base común.
- 2026-10-11 - La docente no ve el estado editorial, solo cuántas frases saldrán en clase; las palabras sin frases no se presentan - coherente con quitar "Sin curar".
- 2026-10-11 - Funciones de Vercel en `gru1` (São Paulo), junto a Supabase - en `iad1` cada consulta cruzaba el continente: `/collections` bajó de 1,3 s a 0,5 s.
- 2026-10-11 - Base de desarrollo aparte (`hanzi-dev`): toda migración se prueba ahí con los recorridos antes de producción - local, producción y la carga de contenido compartían una sola base.
- 2026-10-11 - Rotación de frases: la docente elige cuántas por palabra (2 por defecto); al abrir la clase se eligen primero las no vistas por esa colección y quedan fijas en la sesión - una palabra repasada no debe repetir los mismos ejemplos (idea de Ever).
- 2026-10-11 - Los alumnos votan sin cuenta mediante dos funciones `security definer` con `execute` para `anon`, no con la clave secreta en Vercel - las claves secretas no se suben a servicios externos; RLS sigue cerrada para anon.
- 2026-10-11 - "Cómo se forma" muestra solo las piezas con su pinyin, sin glosas ni "sonido aproximado"; sin datos fiables, no se muestra - la clase nombra la pieza ("el de kǒu"); el sonido del fonético confundía. Decisión de Ever.
- 2026-10-11 - El admin entra directo a `/admin` - aterrizaba en la vista de la docente.
- 2026-10-12 - Keep-alive: GitHub Actions llama dos veces por semana a `student_vote_state` en prod y dev con la clave publicable - Supabase pausa los proyectos gratuitos tras 7 días sin actividad; la función es pública y no escribe nada.
- 2026-10-12 - HSK 4–9 usa el temario de examen 2025/2026: 1000 + 1600 + 1800 + 5600 entradas, con 7–9 como una sola banda oficial - no mezclar las 11.000 entradas del examen vigente con las 11.092 de GF 0025-2021 ni inventar niveles 7, 8 y 9 separados.
- 2026-10-12 - Las palabras sin frases se presentan con la consigna "Inventen una frase con X"; las propias de la docente (cuando existan) saldrán sin consigna - con HSK 4–9, ~9900 palabras no tienen frases y la regla anterior las dejaba fuera de clase. Decisión de Ever.
- 2026-10-12 - El producto se llama **Renshi** (认识, "conocer, reconocer"), en https://renshi.davila.uno; hanzi.davila.uno redirige (vercel.json). Los nombres internos (proyecto de Vercel `hanzi`, Supabase, repo) no cambian - "Hanzi" nombraba la categoría, no el producto; renombrar lo interno rompe configuración sin ganar nada. Decisión de Ever.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
