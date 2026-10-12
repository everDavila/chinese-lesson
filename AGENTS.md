# AGENTS.md

> **Fuente de verdad compartida** para cualquier agente o herramienta de IA que
> trabaje en este repositorio (Cline, Claude Code, Codex, Cursor, etc.).
> Vive dentro del repo, así que **viaja contigo** al clonarlo en otras PCs.
> Mantenlo siempre actualizado.

## Proyecto
- **Nombre:** chinese-lesson
- **Repositorio:** https://github.com/everDavila/chinese-lesson
- **Owner:** Ever Dávila (`everDavila`)
- **Objetivo:** Demo web para enseñar vocabulario chino **en contexto** (frases,
  descomposición en caracteres, matices de tono y uso) en vez de palabras sueltas.
  Detalle completo de la idea en **[IDEA.md](IDEA.md)** y propuesta técnica en
  **[ARQUITECTURA.md](ARQUITECTURA.md)**: léelos antes de proponer nada.

## Estado actual
- Repo inicializado (público) y conectado a GitHub.
- Configuración base compartida añadida (`AGENTS.md` + `.clinerules`).
- Idea discutida y documentada en `IDEA.md` (2026-10-10).
- La demo es para la profesora de Ever (mostrarle la propuesta).
- Arquitectura propuesta en `ARQUITECTURA.md`; framework: Next.js.
- MVP centrado en la enseñanza en clase (fases 0–3 en `ARQUITECTURA.md` §6).
- **Fase 0 completa:** andamiaje, contenido validado de la lección de demo, datos de caracteres y trazos. Supabase `hanzi` con migración inicial + seed aplicados y `.env.local` configurado (no se sube).
- **Fase 1 en curso:** `/present` (demo local, sin login) y `/present/session/[id]` (clase en vivo: lección desde Supabase, valoraciones en `teacher_ratings`). Login de la profesora en `/login`; en el inicio, "Crear la lección de demo" y "Empezar clase". Migraciones aplicadas con `npm run db:migrate`. También en la rama: interfaz en zh/es/en según el navegador, paleta dorada del modo oscuro, tarjeta responsive y `npm run test:visual`. Falta: probar el flujo con la cuenta de Ever, pantalla de preparación de la lección. Lección de demo en `contenido/LECCION-DEMO.md`.
- **Ramas (2026-10-11):** `master` en GitHub y en producción (https://hanzi.davila.uno y https://davila-hanzi.vercel.app), ya con todo lo de `fase-1-supabase`. `fase-1-supabase` en GitHub con previsualización protegida en https://davila-hanzi-preview.vercel.app (dominio fijo ligado a la rama con la API de Vercel). Flujo probado por Ever en producción (2026-10-11).
- **Fase 1c: vistas reales de docente y admin (rama `fase-1c-admin-docente`, fusionada en `master` y en producción el 2026-10-11):** sustituyen al prototipo `/prototipo` (borrado). Docente en `/collections` (zh/es/en): colecciones, copiar plantillas HSK 1–3, lecciones, palabras por sentido y "Presentar" (sesión real). Por palabra, `/collections/[c]/[l]/[senseId]`: frases de la base (ocultar en sus clases o "editar una copia", que la sustituye solo en sus clases) y frases propias privadas que puede sugerir al admin. Admin en `/admin` (solo rol `admin`, en español): base común con filtros, editor de palabra (`save_word`), vista previa de la tarjeta, plantillas y bandeja de sugerencias (aceptar como nueva, aceptar reemplazando la original o rechazar con nota). Migraciones `20261011020000` (glosas inglesas y categorías del catálogo) y `20261011021000` (frases de docente, plantillas, funciones) **aplicadas en Supabase**. Sin sesión, todo lleva al login (`tests/visual/access.spec.ts`). **Sin probar con login real desde aquí:** los recorridos con sesión los tiene que hacer Ever con sus dos cuentas.
- **Versión estable (2026-10-12):** rotación de frases y votación anónima de alumnos en `master` y en producción (migraciones `20261012000000` y `20261012010000` aplicadas, tras respaldo `backups/supabase-2026-10-12T0133.json`). Probadas primero en la base de desarrollo y luego en producción: `npm run test:recorridos` 8/8, visuales 63/63, unitarias 14/14, permisos sin fallos. Etiqueta git `estable-2026-10-12`.
- **Dominio propio activo (2026-10-11):** https://hanzi.davila.uno (CNAME en HostGator → Vercel; certificado emitido con `vercel certs issue`, Vercel no lo pidió solo).
- **Auditoría UX y contenido completa (2026-10-10), correcciones de contenido aplicadas el 2026-10-11:** revisión de la lección, recorrido móvil y escritorio, accesibilidad visible y prioridades P0–P2 documentadas en [AUDITORIA-UX-CONTENIDO-2026-10-10.md](AUDITORIA-UX-CONTENIDO-2026-10-10.md). Informe visual en Word en `reports/AUDITORIA-UX-CONTENIDO-2026-10-10.docx`. No se implementaron las correcciones.
- **Contenido HSK 1–3 cargado (2026-10-11):** los 1000 sentidos oficiales (988 formas escritas) tienen 2–3 frases con chino, pinyin, español e inglés: HSK 1 `840`, HSK 2 `530` y HSK 3 `1267`, para `2637` candidatas. Se insertaron `2604` nuevas respetando las ya existentes. Todo quedó `unreviewed`; frases externas como `open_data` y complementos propios como `ai`. Último respaldo previo: `backups/supabase-2026-10-12T0007.json` (hora UTC en el nombre; local, ignorado por git). Rama de trabajo: `contenido-moderno`.
- **Descomposición y cultura HSK 1–3 (2026-10-11, rama `contenido-descomposicion-cultura`):** generados localmente los 655 caracteres distintos desde Make Me a Hanzi; 574 tienen fórmula completa, 545 permiten colorear componente semántico y 267 componente fonético. Las 81 descomposiciones con `？` se conservan como dato incompleto y la interfaz no muestra su fórmula. Preparadas 45 notas culturales/sociolingüísticas bilingües selectivas (`ai`, `unreviewed`): la simulación añade 44 y respeta la nota existente de 家. Cargado y comprobado primero en `hanzi-dev`; producción aún no se ha tocado. Lint, 14 pruebas unitarias y build pasan.
- **Contenido moderno en curso (2026-10-11):** rama/worktree `contenido-moderno`. Política editorial en [contenido/POLITICA-DE-CONTENIDO.md](contenido/POLITICA-DE-CONTENIDO.md). Primera entrega ampliada a HSK 3.0 niveles 1-3: 300 + 200 + 500 entradas nuevas (1000 acumuladas), con sentidos provisionales para que la vista de colecciones pueda buscar y seleccionar antes de curar. Los Excel de `input-externo/` no se importan.
- **Ejemplos borrador para la demo (2026-10-11):** primer lote de 20 frases HSK 1 en `contenido/ejemplos-borrador-hsk1-demo.json`, preparado para Supabase con la migración `20261011004000_hsk1_draft_examples_demo.sql`. Tienen origen `ai`, estado `unreviewed`; **la tarjeta ya no muestra la etiqueta "Sin curar"** (decisión del 2026-10-11, ver bitácora).
- **Fase 1b fusionada a master y en producción (2026-10-11):** `fase-1b-colecciones` → `master` (fast-forward `6d16439..2d33b0e`), desplegado en https://hanzi.davila.uno. Las 8 migraciones (2 del 10-10 y 6 del 10-11, entre ellas catálogo y gobernanza) están **aplicadas en Supabase**; verificado con `npm run test:db`. Perfil de Ever promovido a `admin` (`scripts/promover-admin.mjs`) y cuenta de la profesora `laoshi@davila.uno` creada con rol `teacher` (`scripts/crear-docente.mjs`, clave por variable de entorno). Backup previo en `backups/supabase-2026-10-11.json` (fuera de git). Para comprobar un login real, `scripts/probar-login.mjs`.

## Stack y comandos
- **Runtime / lenguaje:** TypeScript, Node.js ≥ 20.9 (probado con 22.14). Next.js 16.4 + React 19.3.
- **Framework / librerías:** Next.js (decidido). Base de datos y login: Supabase con keep-alive en GitHub Actions (decidido). Interfaz: Tailwind v4 + shadcn/ui, next-intl, next-themes, Hanzi Writer (decidido, ver ARQUITECTURA.md §6.1). Estilo visual: por decidir.
- **Instalar dependencias:** `npm ci`
- **Servidor de desarrollo:** `npm run dev` (Turbopack)
- **Tests:** `npm run test:visual` (Playwright: tarjeta en celular 390×844, 1366×768, 1440×900 y 1920×1080, claro y oscuro; capturas en `tests/screens/`, sin subir a git; comprueba que no haya scroll horizontal). Usa el `npm run dev` que esté corriendo o lo arranca. `npm run test:db`: migraciones y permisos en PGlite. **Recorridos con sesión** (`tests/flows/`): primero `npm run test:sesion -- admin` y `npm run test:sesion -- laoshi` (abre el login; la clave la escribe Ever, nunca un agente; la sesión queda en `tests/.auth/`, fuera de git); luego `npm run test:recorridos`. Escriben en la base real, con la marca "Prueba automática" / "自动测试", y lo borran al empezar y al terminar; capturas en `tests/screens/recorridos/`.
- **Base de desarrollo `hanzi-dev` (creada 2026-10-11, sa-east-1):** mismo esquema y contenido que producción (copiado), con sus propias cuentas `hanzi` (admin) y `laoshi`. Claves en `.env.dev.local` (fuera de git; en otra PC se regenera con `npm run db:dev:crear` tras `npx supabase login`). Servidor: `npm run dev:base-dev` (puerto 3001). Sesiones: `npm run test:sesion:dev admin` / `laoshi` (en PowerShell, `npm run x -- y --dev` pierde el `--dev`). Recorridos: `npm run test:recorridos:dev`. Contenido al día: `npm run db:dev:copiar`. Probar ahí antes de aplicar migraciones en producción.
- **Lint / formateo:** `npm run lint` (ESLint flat config)
- **Build / despliegue:** Vercel, proyecto `hanzi` conectado a GitHub: push a `master` → producción en https://davila-hanzi.vercel.app; otras ramas → URL de previsualización. Todo se gestiona con el CLI (`npx vercel@latest …`, `vercel login` una vez por PC), sin pasos manuales en el panel. Variables públicas de Supabase cargadas en Production y Preview. Dominio `hanzi.davila.uno` activo: CNAME `hanzi` → `312661f168af2cce.vercel-dns-017.com` en el DNS de HostGator; si un dominio nuevo no recibe certificado en unos minutos, `npx vercel@latest certs issue <dominio>`.

## Convenciones
- Commits en español, mensajes claros y concisos (Conventional Commits opcional).
- Código e identificadores en inglés; comentarios en el idioma dominante del proyecto.
- No subir secretos ni `.env`. Usar `.env.example` con placeholders.
- Commits pequeños y atómicos. El mensaje explica **qué, por qué y la
  decisión detrás**; tiene que entenderse sin abrir el diff.

## Cómo trabajar con Ever
- Respuestas cortas con sustancia, no informes. Sin relleno corporativo
  ("¡Excelente pregunta!").
- Tono irónico, directo, algo arrogante pero útil, como un stand-up ácido.
  Nunca imitar la voz de Ever.
- Es peruano: tuteo estándar, nunca voseo ni modismos porteños.
- Suele dictar por voz: los mensajes pueden cortarse o traer palabras mal
  transcritas ("subagent" = Supabase, "HCK" = HSK). Interpretar y avisar si
  algo se cortó.
- Cuando da feedback numerado sobre una lista, responder punto por punto en el
  mismo orden, sin reagrupar.
- **Al cerrar algo, decir siempre el estado real:** código local, commiteado,
  pusheado o desplegado. Nunca asumir que ya lo sabe.

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
   `D:eposGITappclimaCLAUDE.md`, sección "Cuando diga 'para bitácora'".

## Reglas para los agentes
1. Lee este archivo **antes** de proponer cambios grandes.
2. Respeta las convenciones ya presentes en el código.
3. Toda decisión de arquitectura relevante se anota en la bitácora de abajo.
4. Si una tarea queda a medias, documéntalo en "Estado actual".
5. **Antes de editar**, `git status` y `git log`: cambios sin commitear que no
   reconoces son de otra sesión o agente; no los pises.
6. **Commitea con rutas explícitas** (`git commit <archivos> -m …`), nunca un
   `git add` suelto separado del commit: se mezclan cambios de otra sesión.
7. Lo grande o riesgoso (auth, modelo de datos, service worker, algo global)
   va en una rama o worktree aparte y se prueba antes de tocar `master`. Lo
   chico va directo.
8. Antes de fiarte de una nota, memoria o documento previo, verifícalo contra
   el código actual: un archivo o función citado en una nota vieja existía
   cuando se escribió, no necesariamente ahora.
9. **Varias sesiones o agentes a la vez: cada uno en su propia carpeta**
   (`git worktree add ../chinese-lesson-<tarea> <rama>`). En la misma carpeta
   se pisan: un `git switch` o un `npm ci` de uno rompe el servidor o el
   trabajo del otro (pasó el 2026-10-10 con Codex, Vercel y Claude a la vez).
10. Lecciones técnicas heredadas de otros proyectos de Ever:
   [LECCIONES.md](LECCIONES.md).
11. Ideas y hallazgos aún sin decidir: [IDEAS-POR-CONTRASTAR.md](IDEAS-POR-CONTRASTAR.md).
   Al decidir una, pasa a la bitácora de abajo y sale de ese archivo.

## Bitácora de decisiones
_(Formato: `AAAA-MM-DD - decisión - motivo`)_
- 2026-10-10 - Repo creado como público y conectado a GitHub - punto de partida del proyecto.
- 2026-10-10 - Se añaden `AGENTS.md` + `.clinerules` para compartir contexto entre varias PCs y agentes.
- 2026-10-10 - Se documenta la idea en `IDEA.md`; formato previsto: plataforma web demostrativa - las clases son online y no se busca una app nativa.
- 2026-10-10 - Se elige Next.js (React) como framework - el owner ya trabaja con Next.js; sirve también para PWA o webview más adelante, sin necesidad de Vue.
- 2026-10-10 - Contenido trilingüe (chino, español, inglés) y base curada propia con origen y estado de revisión por dato - la profesora es china y habla inglés; los alumnos son hispanohablantes.
- 2026-10-10 - Se elige Supabase (Auth + Postgres + RLS) con keep-alive en GitHub Actions - hace falta login para profesoras; Ever prefiere explorar un stack nuevo en vez de repetir Vue + Firebase de Nimbus.
- 2026-10-10 - Despliegue en Vercel (git push → deploy automático) con subdominio propio `hanzi.davila.uno` - Next.js necesita servidor Node; un subdominio por proyecto evita proxy y no comparte origen con Nimbus (`lab.davila.uno`).
- 2026-10-10 - El MVP se centra en la enseñanza en clase (modo presentación, valoración de la profesora y votación anónima), no en el autoestudio - la demo es para mostrarle a la profesora cómo podría enseñar mejor. Se añade una fase 0: sin una lección real no hay nada que presentar.
- 2026-10-10 - Datos de caracteres y radicales importados una vez a la base propia (sin API en vivo); IA solo para arrancar la biblioteca; votación tipo Kahoot (URL + código); rojo suave solo para la palabra clave; capa de interfaz confirmada (Tailwind v4 + shadcn/ui + next-intl + next-themes + Hanzi Writer) - decisiones de Ever tras revisar el modo profesora.
- 2026-10-10 - Despliegue en Vercel gestionado solo por CLI; URL `davila-hanzi.vercel.app` (`hanzi.vercel.app` ya estaba tomado) - Ever no quiere pasos manuales en el panel ni URLs aleatorias; regla: `<proyecto>.vercel.app` o `davila-<proyecto>.vercel.app`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
- 2026-10-10 - Interfaz en chino por defecto con selector 中文/Español/English, separada del idioma del contenido para los alumnos (va con la clase); textos de interfaz neutros de género - los docentes previstos son chinos, pero podrá haber hispanohablantes o anglohablantes.
- 2026-10-10 - Idioma de la interfaz según el navegador (zh, es o en; si no, inglés), con selector que se recuerda - corrige la decisión anterior de chino fijo por defecto.
- 2026-10-11 - Colecciones → lecciones → ítems por sentido; plantillas curadas (HSK y libros, solo listas de palabras) que la docente copia; **solo admin edita la base común**, las docentes aportan con frases propias privadas y sugerencias - diseño de ARQUITECTURA.md §4.1, aprobado por Ever. La lista de Básico 1 (`contenido/colecciones/basico-1.json`) es la colección de la clase de su profesora para la demo; se usa cuando la base esté poblada.
- 2026-10-10 - Modo oscuro con paleta "dorada": carbón frío casi negro, texto crema, acentos dorados; los hanzi conservan sus colores - aprobada por Ever tras compararla en paralelo (worktree).
- 2026-10-11 - Los ejemplos HSK se cargan por nivel con un importador idempotente que solo inserta faltantes en sentidos `unreviewed`; se usan el temario oficial 2025/2026 para validar nivel, Gushi/Tatoeba como fuentes abiertas y complementos propios como borradores `ai` - evita pisar contenido curado y conserva procedencia honesta.
- 2026-10-11 - El contenido nuevo se basará en GF 0025-2021/HSK 3.0 y se contrastará con corpus contemporáneo BCC; HSK 2.0 queda solo como compatibilidad - se evita heredar vocabulario, traducciones y ejemplos desactualizados de libros o Excel sin procedencia.
- 2026-10-11 - Los niveles HSK pasan a una relación versionada por palabra y las propuestas de docentes viven separadas de la biblioteca global - una palabra puede cambiar de nivel entre estándares y un profesor no debe sobrescribir contenido curado para todos.
- 2026-10-11 - HSK 3.0 nivel 1 se toma del temario oficial publicado en 2025 y efectivo desde 2026-07: son 300 entradas - evita mezclarlo con las listas de 150 palabras de HSK 2.0 o las listas comunitarias de unas 500 palabras basadas en documentos anteriores.
- 2026-10-11 - Se incorporan también HSK 3.0 niveles 2 y 3: 200 y 500 entradas nuevas, respectivamente; el acumulado llega a 1000 - la demo necesita suficiente vocabulario para que la docente arme colecciones reales.
- 2026-10-11 - La clasificación HSK se conserva por entrada/sentido, no como una única etiqueta por hanzi - el temario repite 11 formas entre niveles 1-3 cuando cambia la lectura o el uso (`只` zhī/zhǐ, `长` cháng/zhǎng, `点1`/`点2`, etc.).
- 2026-10-11 - Cada ejemplo HSK prioriza vocabulario de su nivel o inferior (1→1; 2→1-2; 3→1-3), pero admite pocas palabras superiores necesarias para contexto o información. Se marcan como apoyo y muestran hanzi, pinyin, significado breve y nivel mediante hover/foco/toque; no cuentan como aprendidas. En colecciones de libro manda el vocabulario acumulado ya visto - mantiene frases naturales sin abandonar al principiante.
- 2026-10-11 - Los ejemplos generados pueden mostrarse en la demo antes de la revisión humana, pero **sin etiqueta visible en clase**; el estado `unreviewed` queda en la base como dato editorial - aplicarlas hacía que toda la demo saliera con "Sin curar" delante de la profesora (todas las frases de la base siguen sin revisar). Decisión de Ever; la retomó Cline de la sesión de Claude Code que se quedó sin sesión.
- 2026-10-11 - Las frases propias de la docente son privadas y salen siempre en sus clases; una "copia editada" sustituye a la original solo para ella y puede ocultar originales. Si las sugiere y el admin las acepta, pasan a la base común (como frase nueva o reemplazando la original, con el texto anterior en `revisions`); si las rechaza, siguen siendo suyas - Ever quiere que la docente no dependa del admin para enseñar con sus frases, sin que nadie más pueda tocar la base común.
- 2026-10-11 - La docente no ve el estado editorial (curada/borrador); solo cuántas frases saldrán en clase. Las palabras sin ninguna frase no se presentan - coherente con quitar "Sin curar" de la tarjeta.
- 2026-10-11 - Funciones de Vercel en `gru1` (São Paulo), junto a Supabase (`vercel.json`) - en `iad1` cada consulta cruzaba el continente: `/collections` bajó de 1,3 s a 0,5 s.
- 2026-10-11 - Base de desarrollo aparte (`hanzi-dev`, mismo plan gratuito): toda migración se prueba ahí con los recorridos antes de producción - local, producción y la carga de contenido compartían una sola base.
- 2026-10-11 - Rotación de frases: la docente elige cuántas por palabra (2 por defecto); al abrir la clase se eligen primero las no vistas por esa clase (misma colección) y quedan fijas en la sesión - una palabra repasada en varias clases no debe repetir los mismos ejemplos (idea de Ever).
- 2026-10-11 - Los alumnos votan sin cuenta mediante dos funciones `security definer` con `execute` para `anon`, no con la clave de servicio en Vercel - las claves secretas no se suben a servicios externos; RLS sigue cerrada para anon.
- 2026-10-11 - "Cómo se forma" muestra solo las piezas con su pinyin debajo, sin glosas ni "sonido aproximado"; sin datos fiables, no se muestra - así la clase nombra la pieza ("el de kǒu"); el sonido del fonético confundía. Decisión de Ever.
- 2026-10-11 - El admin entra directo a `/admin` - aterrizaba en la vista de la docente.
