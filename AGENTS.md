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
- **Pendiente:** confirmar Supabase, elegir estilo visual, librería CSS y fuentes, y definir el MVP.

## Stack y comandos
- **Runtime / lenguaje:** TypeScript (Node.js)
- **Framework / librerías:** Next.js (decidido). Base de datos y login: Supabase con keep-alive en GitHub Actions (propuesta, por confirmar). Estilos y fuentes: por decidir.
- **Instalar dependencias:**
- **Servidor de desarrollo:**
- **Tests:**
- **Lint / formateo:**
- **Build / despliegue:**

## Convenciones
- Commits en español, mensajes claros y concisos (Conventional Commits opcional).
- Código e identificadores en inglés; comentarios en el idioma dominante del proyecto.
- No subir secretos ni `.env`. Usar `.env.example` con placeholders.
- Commits pequeños y atómicos.

## Reglas para los agentes
1. Lee este archivo **antes** de proponer cambios grandes.
2. Respeta las convenciones ya presentes en el código.
3. Toda decisión de arquitectura relevante se anota en la bitácora de abajo.
4. Si una tarea queda a medias, documéntalo en "Estado actual".

## Bitácora de decisiones
_(Formato: `AAAA-MM-DD - decisión - motivo`)_
- 2026-10-10 - Repo creado como público y conectado a GitHub - punto de partida del proyecto.
- 2026-10-10 - Se añaden `AGENTS.md` + `.clinerules` para compartir contexto entre varias PCs y agentes.
- 2026-10-10 - Se documenta la idea en `IDEA.md`; formato previsto: plataforma web demostrativa - las clases son online y no se busca una app nativa.
- 2026-10-10 - Se elige Next.js (React) como framework - el owner ya trabaja con Next.js; sirve también para PWA o webview más adelante, sin necesidad de Vue.
- 2026-10-10 - Contenido trilingüe (chino, español, inglés) y base curada propia con origen y estado de revisión por dato - la profesora es china y habla inglés; los alumnos son hispanohablantes.
