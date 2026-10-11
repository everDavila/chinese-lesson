# Bitácora de hanzi

Registro técnico de qué cambió, por qué y qué quedó sin probar. El borrador
para la bitácora pública de davila.uno sale de aquí, pero no vive aquí.

---

## 2026-10-10 — Del "palabras sueltas no sirven" a una demo con login

**Origen.** Las tarjetas de Quizlet de la profesora muestran palabras sueltas
(认识 → "conocer" + foto de un apretón de manos). Propuesta: aprender cada
palabra en frases, con descomposición en caracteres y notas culturales.
Documentado en `IDEA.md` (requisitos 1–11) y `ARQUITECTURA.md`.

**Decisiones del día** (detalle en la bitácora de `AGENTS.md`):
- Stack: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui (Base UI) +
  next-intl + next-themes; Supabase (Auth + Postgres + RLS); Vercel por CLI.
  Se descartó repetir Vue + Firebase de Nimbus: Ever quiere explorar.
- MVP centrado en enseñar en clase (modo presentación + valoración de la
  docente + votación anónima tipo Kahoot), no en el autoestudio
  (`DIAGNOSTICO-MODO-CLASE.md`).
- La unidad es el **sentido**, no la palabra: 家 casa/familia y 家 clasificador
  se enseñan en lecciones distintas y se miden por separado.
- Idiomas: interfaz según el navegador (zh/es/en, inglés de respaldo); la
  tarjeta va en el idioma de los alumnos. Textos neutros de género.
- Colores: un color, un significado. Rojo suave solo para la palabra clave;
  radical y fonético en color solo en el reverso ("Cómo se forma"); en el
  anverso, tinta monocromática donde el radical solo cambia de saturación.
  Modo oscuro "dorado" (carbón frío, crema, dorado).
- Imágenes del reverso: formas antiguas auténticas (oracular → bronce → sello)
  solo en caracteres pictográficos; ni fotos ilustrativas ni glifos hechos
  con IA.
- Futuro anotado: audio con la voz de la docente (§3.4), pinyin revelable por
  frase en modo alumno, pictogramas (prototipo con 家).

**Implementado** (rama `fase-1-supabase`, `efefe2a` → `8c4ce35`):
- Lección de demo de 10 palabras (3 HSK 1, 3 HSK 2, 4 HSK 3), 15 sentidos y
  30 frases en `contenido/leccion-demo.json`. `npm run validate:content`
  segmenta cada frase por la división HSK más favorable y avisa si se pasa
  de nivel: detectó 厕所 (HSK 5) en una frase de nivel 2. 过 salió de la
  lección: es HSK 4 en la versión 2.0, no HSK 2.
- Datos de caracteres de Make Me a Hanzi (LGPL) con el papel de cada trazo
  (semántico / fonético / otro) y trazos de hanzi-writer-data (Arphic).
- Renderizador de trazos propio (`stroke-art.tsx`): Hanzi Writer solo colorea
  trazo y radical, y solo en hex; aquí cada trazo usa el token CSS de su papel.
- Modo presentación `/present` (demo local) y `/present/session/[id]` (clase
  en vivo desde Supabase): tarjeta con giro 3D (el reverso no gira con un clic
  suelto), atajos de teclado, navegación ← n/N → al estilo Quizlet,
  traducciones ocultas, valoración 1–4 guardada en `teacher_ratings`.
- Supabase: migración inicial + trigger de perfiles, seed aplicado,
  `npm run db:migrate` vía Session pooler (la conexión directa es solo IPv6).
- Login docente, inicio con lecciones, "Crear la lección de demo" y
  "Empezar clase".
- Responsive de la tarjeta y `npm run test:visual` (Playwright en celular,
  1366×768, 1440×900 y 1920×1080, claro y oscuro; falla si hay scroll
  horizontal).
- Vercel (lo hizo otra sesión): proyecto `hanzi`, producción en
  https://davila-hanzi.vercel.app desde `master`; previsualización protegida
  en https://davila-hanzi-preview.vercel.app desde `fase-1-supabase`.

**Tropiezos y lecciones** (también en `LECCIONES.md`):
- Lightning CSS descarta en silencio `color-mix()` con `var()`: los trazos
  salían invisibles. Valores explícitos.
- La caché de Turbopack en `.next/` sobrevive a los reinicios y siguió
  sirviendo un CSS viejo: Ever veía colores que el código ya no tenía.
- Con `lang="zh-CN"`, Chrome traducía la página sola y convertía 汉字 en
  "Chinese character". Ahora `translate="no"`.
- El matcher del proxy perdió una barra (`\\.`) y todas las rutas menos `/`
  daban 404.
- Tres agentes en la misma carpeta (Claude, otra sesión de Claude con Vercel,
  Codex con una auditoría): un `git switch` y un `npm ci` ajenos tumbaron el
  servidor y dejaron la auditoría a medias. Regla nueva en `AGENTS.md`: cada
  agente en paralelo, en su propio worktree.
- Una referencia remota de git quedó corrupta al cerrarse la sesión en
  mitad de un push; se reparó y `git fsck` salió limpio.

**Pendiente:**
- Probar el flujo completo con la cuenta de Ever en la previsualización
  (login → crear lección → empezar clase → valorar) y luego pasar
  `fase-1-supabase` a `master`.
- Triar la auditoría de Codex (`AUDITORIA-UX-CONTENIDO-2026-10-10.md`).
- Revisión del español (Ever) y del chino (la profesora) del contenido.
- Pantalla de preparación de la lección; votación anónima (fase 2).
- Prototipo de pictogramas con 家 (falta el OK para descargar los SVG).

**No probado:**
- El login y la clase en vivo con un usuario real: solo se verificaron las
  consultas contra la base con la clave de servicio.
- El modo claro tras el último ajuste de tinta (solo se ajustó el oscuro).
- La voz del navegador en el equipo de la profesora.
- El modo presentación compartiendo pantalla en Zoom de verdad.

---

## 2026-10-11 — Dominio propio

- `fase-1-supabase` llegó a `master` (empujado desde otra sesión) y se
  desplegó a producción antes de probar el login con la cuenta de Ever.
- CNAME `hanzi` → `312661f168af2cce.vercel-dns-017.com` creado por Ever en
  HostGator; propagó en minutos. Vercel marcó el dominio como verificado pero
  no emitió el certificado solo; se pidió con `vercel certs issue`.
  https://hanzi.davila.uno responde con HTTPS (válido hasta enero de 2027,
  renovación automática).

**No probado:** el login en producción con la cuenta de Ever.
