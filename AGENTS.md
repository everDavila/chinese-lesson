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
- **Siguiente paso:** fase 0 (andamiaje + una lección real con contenido). **Pendiente:** cerrar el estilo visual. Lección de demo en `contenido/LECCION-DEMO.md`.

## Stack y comandos
- **Runtime / lenguaje:** TypeScript (Node.js)
- **Framework / librerías:** Next.js (decidido). Base de datos y login: Supabase con keep-alive en GitHub Actions (decidido). Interfaz: Tailwind v4 + shadcn/ui, next-intl, next-themes, Hanzi Writer (decidido, ver ARQUITECTURA.md §6.1). Estilo visual: por decidir.
- **Instalar dependencias:**
- **Servidor de desarrollo:**
- **Tests:**
- **Lint / formateo:**
- **Build / despliegue:** Vercel, despliegue automático al hacer push a GitHub; ramas con URL de previsualización. Dominio: `hanzi.davila.uno` (CNAME a Vercel, pendiente de configurar).

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
9. Lecciones técnicas heredadas de otros proyectos de Ever:
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
