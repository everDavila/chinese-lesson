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

- Flujo completo probado por Ever en producción: login, lección de demo
  creada, 2 sesiones de clase y 2 valoraciones guardadas.
- Correcciones de contenido de la auditoría de Codex aplicadas (detalle en
  la auditoría, "Seguimiento"). `npm run db:sync-content` lleva los cambios
  del JSON a Supabase sin pisar filas revisadas (solo `status =
  unreviewed`); el seed no sirve para eso porque no sobrescribe palabras
  existentes. El validador de nivel rechazó la sugerencia `这个东西很好用`
  (用 es HSK 3).
- Lección reordenada para que 认识 / 知道 / 了解 vayan seguidos.

**No probado:** cómo se ven las notas nuevas, más largas, en el celular.

## 2026-10-11 — Del prototipo a las vistas reales de docente y admin

Rama `fase-1c-admin-docente`. El prototipo (`/prototipo`, datos en
localStorage) se sustituye por pantallas sobre Supabase y se borra.

- **Hallazgo:** los 1000 sentidos del temario HSK 3.0 estaban en la base sin
  significado y con la categoría en chino ("量、（名）"); el prototipo se veía
  bien porque leía un JSON aparte. Migración `20261011020000_catalog_glosses`
  (generada con `scripts/build-catalog-glosses.mjs`) pasa la glosa inglesa y
  la categoría, solo donde estaba vacío. 11 entradas siguen sin glosa porque
  la fuente no la trae. El español sigue pendiente: es trabajo de curación.
- **Migración `20261011021000_admin_docente`:** `based_on_sentence_id` y
  `review_note` en `teacher_examples`; `teacher_hidden_sentences`;
  `save_word(jsonb)` y `set_word_status` (solo admin, en una transacción);
  `accept_teacher_example(id, replace_original)`; el admin lee los perfiles
  (para ver quién sugiere) y puede borrar en la base común; plantillas
  HSK 1/2/3 (20/14/34 lecciones de 15) desde `word_levels`, en orden oficial.
  49 comprobaciones de permisos en PGlite.
- **Pantallas:** `/collections` (docente, zh/es/en), `/admin` (solo admin, en
  español). Lecturas en `src/lib/content.ts`, escrituras en
  `src/actions/manage.ts` (devuelven un código de error que la pantalla
  traduce). `getLesson` mezcla las frases de la docente y descarta las
  palabras sin frases. El inicio con sesión lleva a `/collections`, donde
  siguen las lecciones de demo antiguas como "Lecciones sueltas".
- **Respaldo:** `npm run db:backup` sobrescribía el archivo del día (se perdió
  el de las 02:18; el nuevo contiene todo lo que había) y no copiaba las
  tablas nuevas. Ahora lleva hora en el nombre e incluye `collections`,
  `teacher_examples`, `word_levels`, etc. Respaldo previo a esta migración:
  `backups/supabase-2026-10-11T1359.json`.
- Consultas de las pantallas probadas contra la base real con la clave de
  servicio; sin sesión, las rutas protegidas llevan al login (Playwright).

**No probado:** ningún recorrido con sesión iniciada (crear colección,
copiar plantilla, editar palabra, sugerir y aceptar frases, presentar). No
tengo las claves y no inicio sesión por Ever: lo prueba él con sus dos
cuentas. Tampoco el diseño de las pantallas nuevas en el celular.

**Después, el mismo día:** Ever guardó las sesiones (`npm run test:sesion`) y
`npm run test:recorridos` probó todo con login real, también en celular.
Destapó un error que venía de antes: con sesión, Supabase usa `Date.now()` y
Cache Components lo rechazaba al prerenderizar (arreglado con `connection()`
en `createClient`). También se arreglaron 47 glosas cortadas a media palabra
(migración `20261011030000`, regla en `scripts/lib/gloss.mjs`) y la pantalla
de frases avisa si se cambia el chino y el pinyin o la traducción siguen
como estaban.

## 2026-10-11 (tarde y noche) — Base de desarrollo, rotación, votación y versión estable

Del prototipo en producción a una versión estable (`estable-2026-10-12`,
`507605c`) con dos funciones nuevas probadas primero en una base aparte.
Al final se unió la carga de frases de Codex (`0a72cc2`).

**Rendimiento** (`cd3d2c0`). Con sesión, `/collections` tardaba 1,3 s y se
veía en blanco. Tres causas: Vercel corría en Virginia (`iad1`) y Supabase
está en São Paulo, así que `vercel.json` fija `gru1`; la lista de plantillas
traía los hanzi de 68 lecciones solo para contarlos (0,8 s → 0,15 s); y el
fallback de Suspense era vacío (ahora `ManageLoading`). Medido en el Chrome
de Ever: 1,3 s → 0,5 s.

**Interfaz** (todo en `master` y desplegado):
- El admin entra directo a `/admin` (`fc4314f`).
- Auditoría UX: P0.1 valoración 2×2 en celular con botones ≥ 44 px
  (`54474b1`); P1.1 barra fija con la palabra al bajar por el reverso y P1.3
  inglés de apoyo plegado en celular (`1e59bbf`; la barra va fuera de la zona
  que se desplaza porque un sticky dentro de la cara girada en 3D quedaba
  detrás de la lista); P2.2 composición y frases en dos columnas desde
  1280 px (`e5495ae`, y a todo el ancho si no hay fórmula, `4b04e6f`); P2.1 el
  inicio explica la demo (`0a03116`).
- Hanzi del reverso un punto más chicos en celular (`f99071a`).
- "Cómo se forma", tras varias vueltas con Ever (`c51f91b` → `d5de8b2`):
  solo la fórmula con el pinyin de cada pieza debajo (知 zhī = 矢 shǐ + 口
  kǒu), sin glosas. Sin datos fiables no se muestra: antes decía "carácter
  simple" en 爱, que no lo es (`d6838bd`). Piezas anidadas de Make Me a Hanzi
  (得 = 彳 + ⿱旦寸) se aplanan; con una pieza desconocida (？, en 心 y 习) la
  fórmula no sale.

**Base de desarrollo `hanzi-dev`** (sa-east-1). Ever hizo `npx supabase
login`; `npm run db:dev:crear` la creó y aplicó las migraciones, y
`npm run db:dev:copiar` copió contenido y plantillas de producción con los
mismos ids. Cuentas propias (`hanzi` admin, `laoshi`) creadas por Ever con
`crear-docente`, que ahora pide la clave oculta (`scripts/lib/prompt.mjs`).
Servidor `npm run dev:base-dev` en el 3001 (lanzador propio: Next no admite
`node --env-file`), sesiones `npm run test:sesion:dev`, recorridos
`npm run test:recorridos:dev`.

**Rotación de frases** (migración `20261012000000`). La docente elige cuántas
frases por palabra ve la clase (1, 2, 3 o todas; 2 por defecto) en la
colección o en una lección. Al abrir la clase se eligen y guardan
(`session_sentences`): primero las que esa clase no vio, luego las vistas hace
más tiempo; sus frases propias también rotan. Algoritmo puro en
`src/lib/rotation.ts` con 6 pruebas.

**Votación de alumnos** (migración `20261012010000`). Tecla V en la clase;
el alumno vota en `/v/CÓDIGO` desde el celular, sin cuenta (hanzi y pinyin,
sin significado; votar otra vez cambia el voto). La docente ve los votos en
vivo (sondeo cada 2,5 s) y el semáforo (`src/lib/semaphore.ts`, 8 pruebas).
Como Vercel no tiene la clave de servicio de Supabase, los alumnos pasan por
dos funciones `security definer` con `execute` para `anon` que validan clase
activa y votación abierta; RLS sigue cerrada. Identidad: token en cookie
httpOnly, en la base solo su hash.

**Paso a producción.** Las dos ramas se juntaron en `pruebas-dev`
(conflictos solo en `package.json` y mensajes), se aplicaron sus migraciones
en `hanzi-dev` y pasaron 8/8 recorridos allí (incluidos rotación y un alumno
anónimo que vota). Luego: respaldo `backups/supabase-2026-10-12T0133.json`,
migraciones en producción, fusión en `master`, 8/8 recorridos y 63/63
visuales contra producción, y `/v/…` comprobado ya desplegado.

**Contenido (Codex, `0a72cc2`).** Los 1000 sentidos de HSK 1–3 tienen 2–3
frases (2654 en total, de Tatoeba, Gushi e IA, todas `unreviewed`), cargadas
con un importador que solo inserta y respeta lo revisado. Revisado y unido;
el validador de nivel pasa.

**Herramientas y fallos encontrados:**
- Las sesiones guardadas caducaban: Supabase renueva el token cada hora e
  invalida el anterior. El recorrido guarda la sesión renovada tras cada paso.
- En PowerShell, `npm run x -- admin --dev` pierde el `--dev` (se come el
  `--`): de ahí `test:sesion:dev`. Primer intento con el nombre detrás de
  `--dev` fallaba (`789abe2`).
- Mala UX señalada por Ever: el campo de crear colección parece un buscador.
  Anotado con buenas prácticas en `IDEAS-POR-CONTRASTAR.md`, sin hacer.

**No probado / pendiente:** con alumnos reales y varios celulares a la vez;
límite de peticiones en la votación; significado en español (15 de 1005
sentidos); datos de componentes y trazos (19 de 655 caracteres); atribución
por frase de Tatoeba y Gushi. Todo en `IDEAS-POR-CONTRASTAR.md`.

## 2026-10-12 — Auditoría UX/UI contra base-dev

Auditoría completa con sesiones reales (docente + admin + alumno anónimo)
contra `hanzi-dev` (3001). Producción intacta. Recorridos **8/8** en verde y 20
capturas en `tests/screens/recorridos/`. Informe completo:
`reports/AUDITORIA-UX-UI-2026-10-12.md`.

**Verificado y bien:** i18n sin huecos (150 claves idénticas en es/en/zh);
sin scroll horizontal en celular en ninguna vista; votación accesible por rol
(`radiogroup`/`radio`/`aria-live`); objetivos táctiles grandes (≈96 px); el
estado editorial "Sin curar" no se muestra al alumno.

**Hallazgos priorizados (PENDIENTES DE APLICAR):**
- **P1** — `src/components/vote/student-vote.tsx`: los `<button>` nativos de las
  4 tarjetas de voto (línea ~99) y el de enviar código (~167) **no tienen
  indicador de foco de teclado**. Los `<Button>` de shadcn sí traen
  `focus-visible:ring`, pero estos son botones crudos. Quien tabule o use lector
  de pantalla no ve el foco en la pantalla clave del alumno. Fix de una línea:
  añadir `focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-ring` (o migrar a `<Button>`). **Único que afecta en
  plena clase; candidato a arreglar antes de la siguiente demo.**
- **P2** — `window.confirm` nativo en `collections.tsx`, `examples.tsx` y
  `admin.tsx`. En admin los textos están **hardcodeados en español** (rompe el
  i18n del resto) y el diálogo nativo se puede suprimir en algunos navegadores
  (borrado sin confirmación real). Fix: diálogo propio `role="alertdialog"`
  traducido.
- **P2** — revisar contraste del `--keyword` (rojo) en texto pequeño: pasa AA
  solo como texto grande.

**Límites:** sin medidor automático de contraste (axe) ni lector de pantalla
real (NVDA/VoiceOver); accesibilidad evaluada por ARIA del código. Sesión de
prueba `laoshi` (rol docente); **rol `reviewer` sin recorrido**. **La profesora
real todavía no ha abierto la app.**

