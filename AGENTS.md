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
- **Fase 1b en curso (rama `fase-1b-colecciones`, 2026-10-11):** migración de colecciones probada con `npm run test:db` (sin aplicar a Supabase: depende de la migración de gobernanza de la rama `contenido-moderno` de Codex). Prototipo navegable en `/prototipo` (vistas docente y admin; datos de ejemplo en el navegador) para validar el flujo antes de conectarlo a Supabase. Recorrido automático en `tests/visual/prototipo.spec.ts`.
- **Dominio propio activo (2026-10-11):** https://hanzi.davila.uno (CNAME en HostGator → Vercel; certificado emitido con `vercel certs issue`, Vercel no lo pidió solo).
- **Auditoría UX y contenido completa (2026-10-10), correcciones de contenido aplicadas el 2026-10-11:** revisión de la lección, recorrido móvil y escritorio, accesibilidad visible y prioridades P0–P2 documentadas en [AUDITORIA-UX-CONTENIDO-2026-10-10.md](AUDITORIA-UX-CONTENIDO-2026-10-10.md). Informe visual en Word en `reports/AUDITORIA-UX-CONTENIDO-2026-10-10.docx`. No se implementaron las correcciones.

## Stack y comandos
- **Runtime / lenguaje:** TypeScript, Node.js ≥ 20.9 (probado con 22.14). Next.js 16.4 + React 19.3.
- **Framework / librerías:** Next.js (decidido). Base de datos y login: Supabase con keep-alive en GitHub Actions (decidido). Interfaz: Tailwind v4 + shadcn/ui, next-intl, next-themes, Hanzi Writer (decidido, ver ARQUITECTURA.md §6.1). Estilo visual: por decidir.
- **Instalar dependencias:** `npm ci`
- **Servidor de desarrollo:** `npm run dev` (Turbopack)
- **Tests:** `npm run test:visual` (Playwright: tarjeta en celular 390×844, 1366×768, 1440×900 y 1920×1080, claro y oscuro; capturas en `tests/screens/`, sin subir a git; comprueba que no haya scroll horizontal). Usa el `npm run dev` que esté corriendo o lo arranca.
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
