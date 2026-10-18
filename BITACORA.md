# Bitácora de hanzi

Registro técnico de qué cambió, por qué y qué quedó sin probar. El borrador
para la bitácora pública de davila.uno sale de aquí, pero no vive aquí.

---

## 2026-10-10 — Del "palabras sueltas no sirven" a una demo con login

**Origen.** Las tarjetas de Quizlet de la profesora muestran palabras sueltas
(认识 → "conocer" + foto de un apretón de manos). Propuesta: aprender cada
palabra en frases, con descomposición en caracteres y notas culturales.
Documentado en `IDEA.md` (requisitos 1–11) y `ARQUITECTURA.md`.

**Decisiones del día** (resumen vigente en `DECISIONES.md`):
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

**Segunda pasada (a pedido de Ever, "nada grave" era cómodo) — 2 fallos reales
más, con evidencia:**
- **P0 nuevo** — `student-vote.tsx` (línea ~31) y `student-voting.tsx` (~46): el
  `catch` del sondeo está **vacío** (solo comenta "sin red, se reintenta"). Si
  falla la primera llamada (WiFi del salón caído, lo normal en clase), la pantalla
  del alumno se queda en **"…" indefinidamente** sin saber si perdió la conexión o
  si la profe no abrió la ronda; y en la vista de la profe los votos se congelan y
  cree que no entra nadie. **Sin estado de "reconectando".** Fix: tras N sondeos
  fallidos, aviso `role="status"` "Sin conexión, reintentando…".
- **P1 nuevo** — el hanzi/pinyin/frases van en `font-hanzi` **sin
  `lang="zh-Hans"`** (`layout.tsx` solo pone el `lang` de la interfaz). Con la
  interfaz en español, un lector de pantalla lee 家 como "ya" y no "jiā". Fix:
  envolver el contenido chino con `lang="zh-Hans"` (pinyin con `lang="zh-Latn"`).
- **Bien hecho (verificado):** los **estados vacíos existen** y están traducidos a
  es/en/zh (`noCollections`, `noTemplates`, `noLessons`, `emptyLesson`, `noMine`…);
  el primer día de la profe ve invitación a crear/copiar, no un hueco. Y
  `presentation.tsx` sí avisa del error al guardar la valoración
  (`setSaveError`), a diferencia del voto del alumno.

**Límites:** sin medidor automático de contraste (axe) ni lector de pantalla
real (NVDA/VoiceOver); accesibilidad evaluada por ARIA del código. Sesión de
prueba `laoshi` (rol docente); **rol `reviewer` sin recorrido**. **La profesora
real todavía no ha abierto la app.**

## 2026-10-12 — Biblioteca HSK 1–3: español, ejemplos y descomposición

La rama `contenido-descomposicion-cultura` completa la primera pasada de
contenido para los 1000 sentidos oficiales de HSK 1–3. Los significados en
español se construyeron por nivel desde Gushi (CC BY-SA 4.0) y se corrigieron
cuando la glosa automática elegía una acepción histórica, especializada o poco
útil para principiantes. Resultado: 300 glosas HSK 1, 200 HSK 2 y 500 HSK 3;
119 sentidos llevan además una nota de matiz. Se cargaron primero en
`hanzi-dev` y luego en producción, siempre después de respaldo y sin sobrescribir
campos o filas ya revisados (`196b6dd`, `284b02b`, `131c2e2`, `b4bd1f2`).

Los 2637 ejemplos ya cargados recibieron una primera curación lingüística por
lotes. Se corrigieron nombres latinos incrustados en chino, traducciones que
cambiaban persona o género, dólares donde el original decía yuanes, ejemplos
fechados, frases forzadas y puntuación/pinyin inconsistente. Cambiaron 178 filas
HSK 1, 86 HSK 2 y 273 HSK 3, conservando sus UUID y el estado `unreviewed` para
que una revisora humana siga teniendo la última palabra (`449e2fd`, `88745af`,
`73394f8`). Los tres lotes pasan `validate-content` y la sincronización es
idempotente: una segunda simulación devuelve cero cambios.

Para la tarjeta se generaron datos de los 655 caracteres distintos del catálogo
desde Make Me a Hanzi (LGPL-3.0-or-later) y trazos de Hanzi Writer (Arphic): 574
fórmulas completas, 545 componentes semánticos coloreables y 267 fonéticos. Las
81 descomposiciones que contienen `？` se guardan como incompletas y la interfaz
no inventa una fórmula. También quedaron 45 notas culturales bilingües
selectivas, todas `unreviewed` (`d3864da`). Caracteres, trazos y notas se probaron
en `hanzi-dev`. Después de integrar el código se respaldó producción en
`backups/supabase-2026-10-12T0513.json` y se insertaron los 636 caracteres
ausentes sin modificar los 19 existentes; `characters` quedó en 655 filas. Se
rellenaron además 44 notas culturales vacías y se preservó la nota ya existente
de 家. Una segunda simulación devolvió cero caracteres y cero notas pendientes.

La rama se fusionó con el `master` local más reciente (`0d8ecc4`). El único
conflicto fue `AGENTS.md`: se conservaron las reglas nuevas y se añadió el estado
real del contenido. Pasan lint, 14/14 pruebas unitarias y el build de Next.js.
El primer build falló por el propietario del caché global de SWC en Windows; al
usar un caché aislado dentro del worktree compiló correctamente. No se probaron
los recorridos con sesión ni una revisión nativa completa de las 2637 frases.


## 2026-10-12 (madrugada) — HSK 3.0 completo, votación que sigue a la clase y Renshi

De la limpieza de reglas a un catálogo de 10 896 palabras en producción y un
nombre nuevo. Todo en `master` y desplegado (`9e73882`); producción en
https://renshi.davila.uno.

**Reglas y mantenimiento** (`b901ebb`). `VOZ.md`, `CLAUDE.md` y `.clinerules`
estaban en voseo (lo que `VOZ.md` prohíbe): pasan a tuteo. `.clinerules` queda
como puntero; `AGENTS.md` se reduce a lo vigente, se arregla la ruta rota de la
guía de bitácora y el bloque de Next.js va al final. El keep-alive de Supabase,
que `AGENTS.md` daba por hecho, no existía: `.github/workflows/keep-alive.yml`
llama a `student_vote_state` (pública, no escribe) en prod y dev los lunes y
jueves, con la clave publicable en los secretos del repo. Lanzado a mano: verde.

**Barrido de las 988 tarjetas** (`tests/barrido`, a pedido). Tras la
descomposición de Codex: fórmula en 930 palabras, ninguna con "？" a la vista,
sin errores de JavaScript. Encontró 9 palabras de tres sílabas (矿泉水, 中学生…)
cuya cabecera se salía en 390 px: la etiqueta baja de línea y el pinyin es algo
más chico en celular (`bdb7072`). El primer barrido dio 55 falsos "？": eran
signos de interrogación de las frases; el detector mira ahora solo la fórmula.

**Interfaz** (pedidos de Ever):
- Nota "Basado en el nuevo HSK 3.0 (2025), que contempla 9 niveles" al pie de
  toda la web, en zh/es/en; en clase va como tooltip del "HSK n" (`8ea6bef`,
  `335362e`: con Cache Components, `usePathname` en el layout exige Suspense).
- Mis colecciones: buscador con lupa y botón "Nueva colección" separados; el
  campo con botón parecía un buscador (`54dfc6a`).
- Votación que sigue a la tarjeta (`cd444ef`): se activa una vez (barra de
  arriba o V); al cambiar de palabra se cierra la ronda anterior y se abre la
  nueva, y el celular del alumno cambia solo. Código y dirección fijos arriba
  toda la clase; volver a una palabra reabre su ronda con sus votos. Antes
  había que girar, bajar y pulsar "Abrir votación" en cada palabra.
- Código del alumno en seis casillas (`b264051`): se ve si falta una letra.
  Por debajo es un solo campo (pegar, teclado y lector de pantalla igual).

**HSK 3.0 completo y búsqueda en la base** (`f88120f`). Codex cargó HSK 4–9
(1000 + 1600 + 1800 + 5600 entradas; 7–9 es una sola banda y en la base es
nivel 7). El editor de lección mandaba el catálogo entero al navegador: con
1000 palabras ya tardaba ~5 s. Ahora `search_words` (migración
`20261012030000`) busca en la base por hanzi, pinyin sin tonos o significado,
con relevancia ("agua" → 水 antes que 伞 por "paraguas") y devuelve solo la
página: ~0,25 s en producción; abrir una lección pasó a 0,5–0,9 s. La primera
versión cruzaba cada palabra con cada sentido y no terminaba (timeout). "Pegar
lista" pregunta solo por los hanzi pegados. Producción: respaldo
`backups/supabase-2026-10-12T0723.json` y luego las 5 migraciones juntas
(semillas de Codex + búsqueda), para que el código nuevo no llamara a una
función inexistente. Codex y yo usamos el mismo número `20261012020000`: la mía
pasó a `…30000`.

**Palabras sin frases** (`31df27e`, `c134c62`). Con HSK 4–9, ~9900 palabras no
tienen frases y la regla "sin frases no se presenta" las dejaba fuera de clase
en silencio. Decisión de Ever: se presentan, con la consigna "Inventen una
frase con X · Díganla en voz alta; la profesora la corrige". Sus palabras
propias, cuando existan, saldrán sin consigna (拜拜 no está ni en HSK 3.0). La
tarjeta traduce las categorías del temario nuevo ("名" → sustantivo, "动、名"
→ verbo / sustantivo) y muestra "HSK 7–9".

**Renshi** (`c311455`, `9e73882`). "Hanzi" nombraba la categoría; 认识 (rènshi,
"conocer, reconocer") nombra lo que hace la app. Logo 认识, título y portada
cambian; lo interno (Vercel `hanzi`, Supabase, repo, cookie) no. Ever creó el
CNAME `renshi` en HostGator; Vercel emitió el certificado solo.
`hanzi.davila.uno` redirige (308, `vercel.json`) conservando la ruta. Hay que
volver a iniciar sesión: la cookie es por dominio.

**Lo que cazaron las pruebas** (recorridos contra hanzi-dev): la nota HSK sin
Suspense rompía la página de la lección; `hsk-note.tsx` quedó fuera de un
`commit -a` por ser nuevo; y una carrera en la votación: la respuesta lenta de
"¿estaba activa?" desactivaba la votación si la docente pulsaba V antes (el
alumno votaba y ella veía 0 votos, `21c5a19`). Los recorridos esperan ahora 15 s
y 2 min por paso: desde un servidor local cada página va hasta São Paulo.
`DEV_PORT` permite la base de dev en otro puerto (un Next huérfano ocupa el
3001 y no tengo permiso para matarlo).

**Estado de pruebas:** recorridos 9/9 contra hanzi-dev (con buscar, pegar y la
votación nueva), visuales 80/80, unitarias 18/18, permisos con
`search_words`. **No probado:** la votación con varios celulares reales; el
editor desplegado con sesión de producción (solo el mismo código contra dev y
la función en la base de producción); los recorridos contra producción.

**Pendientes:** frases para HSK 4–9 (Codex, empezando por HSK 4); palabras
propias de la docente (拜拜); temas de Cline (rama aparte, toca el catálogo);
P0 "sin conexión" en la votación y P1 `lang="zh-Hans"` de la auditoría de
Cline; avisar a la profesora del dominio nuevo; borrar los worktrees ya unidos
(`-hsk`, `-votacion`, `-busqueda`, `-renshi`); matar el Next huérfano del 3001.


## 2026-10-13 — Una frase por sentido pendiente de las plantillas temáticas

Ever redujo el alcance de esta tarea de tres a dos y finalmente a una frase
por palabra para completar primero la cobertura; no es una nueva política
general. En la rama `contenido-frases-temas` se completaron los JSON
`contenido/temas-frases-hsk4.json`, `temas-frases-hsk5.json` y
`temas-frases-hsk6.json`: 43 + 37 + 5 = 85 frases originales con pinyin,
español e inglés, procedencia `ai` / `codex-editorial`, sin licencia externa.
Los identificadores y campos léxicos originales se conservaron. Las 85 palabras
cubren 86 apariciones en plantillas porque `政府` se repite en dos temas.

Se simplificó el vocabulario que superaba el nivel de la entrada. `成` se usó
como clasificador de décimas (`三成`, 30 %), según la categoría oficial `量`;
su glosa provisional enumera otras acepciones y quedó señalada para revisión
separada. `链接` se usó como verbo, según `动`. Todos los ejemplos permanecen
`unreviewed`; el agente no aprueba contenido como revisión humana.

La comprobación obligó a corregir dos problemas de las herramientas:
`scripts/validate-content.mjs` solo incorporaba los niveles oficiales 1–3 y
mezclaba los superiores con una tabla provisional; ahora usa el temario
completo y su banda 7–9, sin heredar niveles provisionales de HSK 3.0.
`scripts/sync-hsk-examples.mjs` leía intervalos de órdenes que superaban las
1000 filas máximas de Supabase: HSK 5 aparentaba no tener `数据` y HSK 6
aparentaba no tener `生态`. Ahora consulta los órdenes exactos en grupos de
100 y comprueba hanzi y pinyin. Los 85 UUID de dev difieren de los de
producción; la identidad entre bases se conserva por fuente, orden y lectura.

Carga en `hanzi-dev` tras el respaldo completo de la carpeta principal
`backups/supabase-2026-10-13T2101.json` (ignorado por Git): 2654 → 2739
frases. Se verificaron las 85 nuevas campo por campo y se compararon todas las
anteriores con el respaldo: ninguna modificada ni eliminada. La segunda
simulación de los tres lotes devolvió cero inserciones. Pasaron las seis
pruebas focalizadas de `tests/scripts/theme-content.test.mjs`, las tres
validaciones por nivel, sintaxis de los scripts y ESLint.

**No probado / pendiente:** contraste sistemático con BCC, revisión humana
nativa, recorrido visual y uso en una clase real. No se aplicó contenido en
producción ni se desplegó o subió `master`. El trabajo se conserva en su rama.


### 2026-10-13 — Integración de las frases temáticas en producción

A pedido de Ever, `contenido-frases-temas` se integró en `master` mediante
el merge `1b48328` (contenido y herramientas en `f3bf413`), conservando las
propuestas nuevas de autoestudio y el registro principal. Pasaron las seis
pruebas focalizadas y las tres validaciones de nivel sobre la integración.

Tras el respaldo de producción `backups/supabase-2026-10-13T2239.json`, se
simuló y aplicó cada lote: 43 + 37 + 5 = 85 frases. Producción pasó de 2654 a
2739 frases. Se verificaron los UUID de los sentidos, hanzi y pinyin, chino,
traducciones, `computed_level`, `origin: ai` y `status: unreviewed`. Comparadas
las frases anteriores con el respaldo: ninguna modificada ni eliminada.
Repetir la simulación devolvió cero inserciones en los tres niveles.

La consulta de cobertura en producción confirmó diez colecciones temáticas,
317 ítems con frases y cero ítems sin frases. Se actualizaron `AGENTS.md` y
`contenido/FRASES-TEMAS-PENDIENTES.md`; se retiró únicamente la fila de esta
tarea de `TRABAJO-EN-CURSO.md`, como corresponde al integrarla.

**Pendiente / no probado:** revisión humana nativa, contraste sistemático con
BCC, prueba visual de la clase con estos ejemplos y su uso con la profesora.
Las frases siguen siendo borradores editoriales `unreviewed`.


## 2026-10-16 — Inicio docente para preparar la clase

La entrada autenticada de la profesora dejó de enviarla directamente a una
lista: ahora `/` es su espacio de preparación. Conserva la estética carbón,
crema y dorado aprobada, muestra Renshi en la cabecera y organiza el trabajo
en tres niveles: acciones principales, lecciones propias para continuar y
biblioteca común. El panda no aparece en la cabecera y se retiró el bloque
redundante de accesos rápidos de la referencia.

La pantalla usa únicamente datos existentes. `listTeacherLessons` recupera
las lecciones de la cuenta y sus conteos; “Continuar” abre el editor actual y
presentar sigue disponible como acción secundaria mediante la sesión real.
La nueva ruta `/library` separa plantillas HSK y temáticas y reutiliza
`copy_collection`, de modo que no hay otro modelo ni escrituras paralelas.
El buscador de la cabecera conduce al filtro real de colecciones y el acceso
“Nueva colección” abre directamente el formulario existente.

Se actualizaron los tres idiomas, el recorrido autenticado que antes esperaba
una redirección automática y una prueba visual específica. Pasaron ESLint,
las 18 pruebas unitarias, la compilación de producción y dos recorridos
Playwright en oscuro (1440 × 900 y 390 × 844), incluidos biblioteca, creación
y ausencia de desbordamiento horizontal. La comparación queda en
`design-qa.md`; las capturas se generaron en `tests/screens/`.

**Decisiones y límites:** no se inventaron “editada hoy”, una próxima clase,
HSK 4–9 disponibles ni imágenes sin procedencia, porque esos datos no existen
en el modelo o en producción. Tampoco se cambió auth, RLS, migraciones ni la
presentación. **No probado:** copiar una plantilla desde esta pantalla no se
ejecutó en el recorrido visual para no escribir en producción; el mismo RPC ya
está cubierto por los recorridos funcionales existentes. Falta validación con
la profesora y despliegue.

## 2026-10-17 — Inicio docente reducido a fijados y recientes

El inicio se redujo a dos bloques: accesos fijados por la profesora y sus
lecciones recientes. Se retiraron el saludo grande, las tarjetas de creación y
la biblioteca del contenido principal; esas funciones siguen en la cabecera y
el menú lateral. Una lección fijada se puede presentar o editar. Una colección
fijada solo se abre: la unidad de una clase sigue siendo la lección y no se
crean sesiones ambiguas con cientos de palabras.

La migración `20261017000000_inicio_docente_fijados.sql` añade fechas reales de
última edición y `teacher_pins`, una relación privada protegida por RLS que
referencia el material existente sin duplicarlo. Se respaldó y migró
`hanzi-dev`; crear y borrar un fijado de prueba funcionó. Pasaron ESLint, las
18 pruebas unitarias y el build. **No probado:** el recorrido visual autenticado
quedó bloqueado porque la sesión local de `laoshi` venció. La migración no se
aplicó en producción.

## 2026-10-17 — Integración a producción: biblioteca por nivel, lecciones sueltas y ramas de Codex

**Qué subió.** La rama `integrar-inicio` llegó a `master` por avance directo
(`a353133..1cf2aa5`) con: inicio docente de Codex, biblioteca HSK por nivel
completo (`hsk_catalog`, paginación shadcn), prioridades 1–3 de la hoja de
ruta, «Quitar» = archivar o borrar, selección en bloque en el editor, y las
ramas `contenido-hsk4-9`, `contenido-espanol-latinoamericano`,
`prueba-escritura`, `pendientes-prioritarios` (aviso de conexión; los 6
documentos de especificación quedaron como fotografía en
`docs/especificacion-2026-10-15/`) y `ayudas-frase-notas`.

**Orden en producción.** Respaldo (`backups/supabase-2026-10-17T2337.json`) →
`db push` de 4 migraciones (`20261017000000`–`20261017030000`) →
`validar-catalogo-hsk.mjs` (7 niveles exactos) → push a `master` → Vercel
listo. Antes, contra `hanzi-dev`: recorridos 11/11, visuales 120/120, 20
pruebas unitarias. El español peninsular se comprobó en solo lectura: 0 de 2739
frases en dev y en producción.

**Conflictos resueltos.** `lessons.ts`: la consulta de palabras citadas en
notas va en tandas (`inChunks`) para no romper con HSK 7–9. `card-back.tsx`:
estructura de `ayudas-frase-notas` con los `lang` de `pendientes-prioritarios`.
Dos pruebas buscaban el botón viejo «tocar el chino para revelar».

**Sin probar / pendiente.** `/lab/escritura` con el dedo en celular; la
tarjeta nueva en clase real; `ux-voto-alumno` descartada por ahora (choca con
el aviso de conexión); registro de cuentas abierto en Supabase (Ever lo cierra
en el panel).

## 2026-10-18 — Tres agentes, una rama y la marca en hanzi

**Contexto.** Entre el 17 y el 18 trabajaron en paralelo Claude Code, Codex y
Cline, cada uno en su worktree. Antes de subir nada, Ever pidió ver todas las
ramas y decidir qué entraba.

**Decisiones de Ever en el camino.**
- El umbral para confirmar una presentación grande era 500 palabras. Ever
  preguntó por qué; era arbitrario. Quedó en 100: "nadie aprende más de 100
  hanzi en una sola clase".
- «Quitar» no debía obligar a elegir entre perder historial o llenarse de
  basura: ahora pregunta **archivar o borrar**. Lo archivado se restaura desde
  «Archivadas» con sus clases y votos.
- En el editor, agregar palabras de una en una era lento (cada «+» iba y volvía
  del servidor). Ahora se marcan varias, incluso en búsquedas distintas, y se
  añaden o quitan de golpe.

**Triage de ramas.** Diez ramas tenían trabajo fuera de `master`. Se ordenaron
de menos a más conflictivas y se marcó, para cada una, qué la detendría sin Ever
frente a la PC (aprobar un diseño, probar en el celular, autorizar producción).
Entraron cinco; `ux-voto-alumno` se descartó por ahora porque chocaba con el
aviso de conexión de otra rama en el mismo componente. Los seis documentos de
especificación de Codex se guardaron como **fotografía** en
`docs/especificacion-2026-10-15/`: su plan competía con `HOJA-DE-RUTA.md` y dos
planes vigentes confunden a los agentes.

**Verificar antes de creer.** Codex reportó que había corregido 36 frases en
español peninsular en producción. Se comprobó en solo lectura: 0 de 2739 frases
con `vosotros`, `coche` u `ordenador`, en dev y en producción. Ever preguntó
cuántas veces Codex había roto el código: ninguna caída de producción es suya
hasta donde se puede saber (git no registra qué agente hace cada commit). La
única caída, el editor ~2 h el 17, vino de subir código antes que su migración,
y su commit no tiene el estilo de Codex. Lo que sí deja Codex son cabos sueltos:
pruebas sin actualizar y estados reportados antes de tiempo.

**A producción.** Con la autorización de Ever: respaldo, 4 migraciones,
validación del catálogo (los 9 niveles exactos, ~120 ms por página), push y
Vercel listo. Después, dos ajustes pequeños directos a `master`: la marca de la
barra lateral pasó de «Renshi» a **认识**, sin el lema "Enseña chino, a tu
manera" (pedido de Ever), y el README se puso al día con lo publicado.

**Revisado y aceptado tal cual.** La ayuda emergente de Codex para palabras
citadas en notas (en la nota de 爱, tocar 喜欢 muestra xǐhuan, "gustar" y
audio). Se vio que el recuadro sale algo desplazado y en celular roza el borde;
Ever decidió dejarlo así.

**Sin probar / pendiente.** `/lab/escritura` con el dedo; la tarjeta nueva en
una clase real; cerrar el registro de cuentas en Supabase (Ever, en el panel);
la carpeta principal del repo quedó atrás de `master` por un cambio sin
commitear de otro agente en `TRABAJO-EN-CURSO.md`. Siguiente prioridad: P4,
«Guardar como lección» lo presentado desde el catálogo.
