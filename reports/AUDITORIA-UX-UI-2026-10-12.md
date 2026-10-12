# Auditoría UX / UI — 2026-10-12

Recorrido completo con sesiones reales (docente + admin + alumno anónimo) contra la
**base de desarrollo `hanzi-dev`** (puerto 3001). Producción no se tocó.

## Metodología

- **Recorridos funcionales:** `npm run test:recorridos:dev` → **8/8 en verde** (1.0 min).
  Cubren: copiar plantilla HSK 1, renombrar, escribir/sugerir frase, copia editada,
  ocultar/mostrar original, presentar con 2 y con 1 frase por palabra (rotación),
  votación alumno↔profesora, editor de admin, vista previa, plantillas y bandeja de
  sugerencias (rechazo con nota). Limpian al empezar y al terminar; la docente ve la
  frase rechazada y sigue siendo suya.
- **Capturas:** 20 PNG en `tests/screens/recorridos/` (escritorio + celular 390×844 por
  vista, más clase en anverso/reverso/valoración y alumno votando).
- **Análisis estático (1ª pasada):** accesibilidad (`aria-*`, `role`, foco), i18n,
  contraste de la paleta, uso de diálogos nativos. Sin `dangerouslySetInnerHTML`.
- **Análisis estático (2ª pasada, a pedido):** donde de verdad se rompe una app —
  estados vacíos, manejo de error/red, y el idioma (`lang`) del contenido chino.
  Ver "Segunda pasada" más abajo.
- **Verificaciones automáticas que ya pasan en cada vista:** sin scroll horizontal en
  celular, sin claves de traducción crudas, botones de valoración ≥ 44 px en rejilla 2×2.

## Lo que está bien (verificado, no supuesto)

- **i18n sólido:** 150 claves idénticas en `es`, `en` y `zh`. **Cero huecos**: nadie ve
  una clave cruda tipo `Vote.waiting` en clase. Buena señal para una demo trilingüe.
- **Sin scroll horizontal** en ninguna vista en celular (el test lo mide en cada captura).
- **Votación accesible por rol:** `role="radiogroup"` + `role="radio"` + `aria-checked`,
  y `aria-live="polite"` en los estados de espera/resultado. Un lector de pantalla
  entiende el grupo de 4 opciones.
- **Objetivos táctiles grandes:** las 4 tarjetas de voto son `min-h-24` (≈96 px) y el
  campo de código `h-14`. Cómodo para votar desde el celular durante la clase.
- **El estado editorial ("Sin curar") no se muestra al alumno** en la tarjeta: es información
  interna. Correcto.
- **Paleta dorada coherente** en oscuro: texto crema (L 0.93) sobre carbón (L 0.17) y
  dorado (L 0.78) dan contrastes altos; el `--keyword` rojo se usa solo para la palabra
  clave, como se decidió.

## Hallazgos priorizados

### P1 — Foco de teclado invisible en los botones nativos del voto
`src/components/vote/student-vote.tsx`: las 4 tarjetas de voto (línea 99) y el botón de
enviar código (línea 167) son `<button>` **sin** `focus-visible:ring`. Los `<Button>` de
shadcn sí lo traen, pero estos son botones crudos. Quien tabule o use lector de pantalla
no ve dónde está el foco en la pantalla más importante para el alumno.
**Fix:** añadir `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`
(o migrarlos a `<Button>`). Un caso, un cambio.

### P2 — `window.confirm` nativo en flujos de docente y admin
Aparece en `collections.tsx` (borrar colección/lección), `examples.tsx` (borrar frase) y
`admin.tsx` (descartar cambios, quitar sentido/frase). Problemas: (1) en `admin.tsx` los
textos están **hardcodeados en español**, pero `/admin` debería seguir el idioma del
navegador como el resto; (2) el diálogo nativo rompe la estética y no es estilizable;
(3) algunos navegadores permiten suprimirlos, lo que deja el borrado sin confirmación
real. **Fix:** diálogo propio con `role="alertdialog"`, traducido, o al menos sacar los
textos a los mensajes.

### P2 — Revisar contraste del rojo de palabra clave en texto pequeño
`--keyword` (rojo, `oklch(0.6 0.13 25)` en claro) pasa AA solo como **texto grande**
(≈3:1). En frases va en grande y va bien, pero si el keyword aparece en matices o notas
a tamaño normal podría quedar bajo 4.5:1. No corrí medidor automático de contraste;
recomiendo pasarlo por uno (p. ej. axe/Playwright) antes de la siguiente demo.
**Fix si procede:** oscurecer el keyword solo cuando va en cuerpo de texto pequeño.

### P3 — Sin banner de "cambios sin guardar" al salir del editor
`admin.tsx` tiene estado `dirty` y avisa en pantalla, pero no intercepta la salida de la
página. Si la docente/admin cierra la pestaña a medias, pierde el trabajo sin aviso.
Menor: es una herramienta de admin, no de clase.

## Segunda pasada — donde de verdad se rompe una app

Pedido de Ever tras notar que "nada grave" era una conclusión cómoda. Fui a los
sitios que la 1ª pasada no tocó: **estados vacíos**, **manejo de error/red**, y el
**`lang` del contenido chino**. Evidencia con archivo:línea.

### P0 nuevo — Sin estado de "sin conexión": el alumno se queda en "…" para siempre
`student-vote.tsx` (línea 31-37): el sondeo hace `setState(await
studentStateAction(code))` dentro de un `try/catch`, pero el `catch` está **vacío**
(solo un comentario `// Sin red: se reintenta`). Si la primera llamada falla porque
el WiFi del salón se cae —que pasa en clase—, `state` se queda en `null` y la
pantalla muestra **"…" indefinidamente** (línea 71-74). El alumno no sabe si está
conectado, si la profe aún no abrió la ronda, o si su datos se fueron. No hay
reintento visible, ni "reconectando", ni error. Es la pantalla más crítica del
alumno y se queda muda ante el fallo más común. **Fix:** tras N sondeos fallidos,
mostrar un aviso "Sin conexión, reintentando…" con `role="status"`. Lo mismo aplica
a `student-voting.tsx` (línea 46-52), donde `results` se congela en el último valor
y la profe cree que no entran votos cuando en realidad se perdió la red.

### P1 nuevo — El hanzi/pinyin no declara `lang="zh"`
`layout.tsx` pone `lang` según el locale de la interfaz (`es`/`en`/`zh`) y
`translate="no"` (correcto, evita que el traductor del navegador rompa 汉字). Pero
el contenido chino en sí —el hanzi gigante de la tarjeta, el pinyin, las frases— va
en `<span className="font-hanzi">` **sin** `lang="zh-Hans"`. Cuando la interfaz está
en español (`lang="es"`), un lector de pantalla lee 家 con fonética española ("ya")
en vez de china ("jiā"), y el pinyin suena a castellano. Es accesibilidad real para
el usuario ciego, y también afecta la entonación en algunos TTS. **Fix:** envolver
el contenido chino con `lang="zh-Hans"` (los pinyin, con `lang="zh-Latn"`).

### Bien hecho (verificado, para que quede constancia)
- **Estados vacíos existen y están traducidos a los 3 idiomas:** `noCollections`
  ("Aún no tienes colecciones…"), `noTemplates`, `noLessons`, `emptyLesson`,
  `noOriginals`, `noMine`, y "No hay sugerencias pendientes". El primer día de la
  profe no ve una lista en blanco: ve una invitación a crear o copiar plantilla.
  Eso está bien.
- **`catch` en `presentation.tsx` sí avisa:** `setSaveError(t("saveError"))` — la
  valoración de la docente tiene feedback de error, a diferencia del voto del alumno.

## No probado / límites de esta auditoría

- **Sin medidor automático de contraste WCAG** (no integré axe esta vez); los contrastes
  de paleta son estimados a ojo/cálculo, no medidos con herramienta.
- **Sin lector de pantalla real** (NVDA/VoiceOver): la accesibilidad se evaluó por
  atributos ARIA del código, no con asistencia real.
- **Sin cuenta real de la profesora:** los recorridos usan la sesión de prueba
  `laoshi` en base-dev. **La profesora de verdad todavía no ha abierto la app.**
- Recorridos con `laoshi` = rol docente; **no probé el rol `reviewer`** (existe el rol
  pero sin recorrido específico).

## Recomendación

El **P1 (foco de teclado)** es el único que afecta al alumno en plena clase y es un
cambio de una línea: lo arreglaría antes de la próxima demo. El P2 de `window.confirm`
en admin es cosmético/i18n y puede esperar. Lo demás son mejoras menores.
