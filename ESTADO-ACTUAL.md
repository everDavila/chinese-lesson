# Estado actual

> Contexto operativo detallado. Se lee solo cuando una tarea depende del
> estado del producto o del contenido. Verifica las afirmaciones contra el
> código y la base antes de actuar.

- **Producción:** https://renshi.davila.uno (el producto se llama Renshi, 认识;
  https://hanzi.davila.uno redirige ahí y https://davila-hanzi.vercel.app sigue),
  desde `master`. Última versión estable etiquetada: `estable-2026-10-12`.
- **Funciona:** docente en `/collections` (colecciones, plantillas HSK 1–3,
  lecciones, frases propias, copias editadas, sugerencias, rotación de frases,
  clase en vivo con valoración y votación anónima de alumnos en `/v`; el panda
  guía y valida el código de acceso del alumno); admin en
  `/admin` (base común, editor de palabra, vista previa, plantillas, bandeja de
  sugerencias). Cuentas: Ever (`admin`) y la profesora (`teacher`).
- **Descripciones opcionales (2026-10-16):** colecciones y lecciones admiten
  descripción editable (detalle, alta y copia desde plantillas; la búsqueda de
  la lista la tiene en cuenta; las tarjetas no la muestran). La migración
  `20261016000000_lesson_description.sql` (añade `lessons.description` y hace
  que `copy_collection` la copie) está aplicada en `hanzi-dev` y en producción
  (2026-10-17, respaldo `backups/supabase-2026-10-17T1634.json`). El código
  llegó a producción unas 2 h antes que la migración: en ese rato el editor de
  lecciones fallaba al pedir la columna.
- **Plantillas de vocabulario por contexto:** 10 colecciones curadas (Comer
  fuera, Vida diaria, Trabajo, Viajes, Transporte, Compras, Salud y cuerpo,
  Tecnología, Medio ambiente, Sociedad y cultura) sobre el temario HSK 3.0
  1–3, aplicadas en producción el 2026-10-13 (317 ítems, 287 sentidos
  distintos: unos se repiten entre temas). **Los 317 ítems tienen frases**:
  231 de la curación HSK 1–3 (3 por palabra) y 86 apariciones cubiertas por
  85 frases originales nuevas (una por sentido, `政府` está en dos temas).
  Todas `unreviewed`, sin etiqueta visible en clase.
- **Frases de temas:** integradas en `master` desde `contenido-frases-temas` y
  cargadas en `hanzi-dev` y producción el 2026-10-13, con respaldo previo en
  cada base. Son 43 HSK 4, 37 HSK 5 y 5 HSK 6; una por sentido solo para esta
  tarea. Verificadas las 85 frases sin modificar ninguna anterior; siguen
  `unreviewed`, pendientes de revisión humana. Seguimiento en
  [contenido/FRASES-TEMAS-PENDIENTES.md](contenido/FRASES-TEMAS-PENDIENTES.md).
- **Contenido HSK 1–3:** los 1000 sentidos oficiales tienen significado en
  español y 2637 frases (840 + 530 + 1267) con primera curación lingüística.
  Significados, matices y frases ya están en `hanzi-dev` y producción; siguen
  `unreviewed` hasta aprobación humana. La curación conservó UUID y corrigió
  178 filas HSK 1, 86 HSK 2 y 273 HSK 3.
- **Español latinoamericano (2026-10-17):** las 36 frases de producción que
  conservaban `vosotros` o vocabulario peninsular fueron corregidas también en
  `hanzi-dev` y en los seis lotes fuente HSK 1–3. Conservan UUID, origen
  `open_data` y estado `unreviewed`; inventario y criterio en
  [contenido/REVISION-ESPANOL-LATINOAMERICANO-2026-10-17.md](contenido/REVISION-ESPANOL-LATINOAMERICANO-2026-10-17.md).
  La política y `npm run validate:spanish` evitan reintroducir esas formas.
- **Catálogo HSK 4–9:** el temario oficial 2025/2026 añade 1000 entradas en
  HSK 4, 1600 en HSK 5, 1800 en HSK 6 y 5600 en la banda conjunta HSK 7–9.
  Está en `master` (`44b7185`, `c0759d7`) y la bitácora registra su carga en
  producción el 2026-10-12, tras el respaldo
  `backups/supabase-2026-10-12T0723.json`. Tiene pinyin, categoría, glosa
  española básica y descomposición; la mayoría de sentidos no tiene frases,
  matices ni notas culturales todavía.
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
