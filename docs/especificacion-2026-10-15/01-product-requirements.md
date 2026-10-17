# Requisitos de producto — Renshi

> **Fotografía del 2026-10-15/16, no fuente de verdad.** Escrita por Codex con
> el producto de esa fecha; no incluye lo posterior (catálogo HSK por nivel,
> lecciones sueltas, presentar desde el catálogo, archivar). Prioridades:
> [HOJA-DE-RUTA.md](../../HOJA-DE-RUTA.md). Reglas: [AGENTS.md](../../AGENTS.md).

> Estado: especificación viva basada en producción y en `master` al 2026-10-15.
> Producto: **Renshi (认识)** — vocabulario chino en contexto para clases por videollamada.
> Referencias: [IDEA.md](../../IDEA.md), [ARQUITECTURA.md](../../ARQUITECTURA.md), [AGENTS.md](../../AGENTS.md) y [contenido/POLITICA-DE-CONTENIDO.md](../../contenido/POLITICA-DE-CONTENIDO.md).

## 1. Resumen

Renshi ayuda a una docente a enseñar vocabulario chino dentro de frases, no como equivalencias aisladas. La docente prepara colecciones y lecciones, presenta cada palabra con trazos, sentido, composición y ejemplos, y recoge una señal rápida de comprensión del grupo. Los alumnos participan desde el celular, sin cuenta, mediante un código temporal.

El producto es una herramienta demostrativa para clase en vivo. No intenta sustituir un LMS, un diccionario general ni una plataforma completa de autoestudio.

## 2. Problema

Las tarjetas tradicionales reducen una entrada a `认识 → conocer`. Esa equivalencia no explica:

- qué sentido se está enseñando;
- cómo cambia el uso frente a sinónimos aparentes;
- qué tonos o pronunciaciones aparecen en contexto;
- cómo se forma cada carácter;
- cómo usar la palabra en una frase contemporánea;
- si el grupo realmente cree haberla entendido.

La docente puede añadir contexto manualmente, pero hacerlo palabra por palabra durante la preparación de cada clase es lento, inconsistente y difícil de reutilizar.

## 3. Visión y propuesta de valor

**Visión:** que preparar una clase de vocabulario contextual sea tan sencillo como elegir las palabras, sin renunciar a la precisión lingüística ni al control docente.

**Propuesta de valor:** Renshi combina una biblioteca curada con una experiencia de presentación diseñada para chino:

- una entrada se enseña por **sentido**, no solo por grafía;
- las frases muestran el uso real y rotan entre clases;
- los caracteres se animan trazo a trazo y muestran componentes cuando hay datos fiables;
- la docente conserva el control sobre ejemplos, traducciones y ritmo;
- el grupo responde anónimamente sin instalar nada ni crear cuentas.

## 4. Usuarios y trabajos principales

### 4.1 Docente — usuario principal

Quiere preparar y conducir una clase por Zoom con poca fricción.

Trabajos:

- copiar una plantilla o crear una colección propia;
- buscar vocabulario por hanzi, pinyin o significado;
- elegir el sentido exacto y ordenar las palabras;
- adaptar, ocultar o añadir frases para su clase;
- decidir cuántos ejemplos mostrar y rotarlos entre sesiones;
- presentar la lección, controlar las revelaciones y valorar al grupo;
- abrir una votación para contrastar su impresión con la del alumnado.

### 4.2 Alumno — participante secundario

Quiere responder con rapidez desde el celular sin registrarse y sin distraerse de la clase.

Trabajos:

- entrar con un código de seis caracteres;
- esperar a que la docente abra una ronda;
- ver la palabra activa sin recibir la respuesta;
- elegir una de cuatro valoraciones y poder corregirla mientras la ronda siga abierta.

### 4.3 Administrador — curador de la biblioteca común

Quiere mantener una base compartida trazable sin permitir que cada docente la modifique directamente.

Trabajos:

- buscar, editar y previsualizar palabras, sentidos y frases;
- gestionar plantillas comunes;
- revisar sugerencias de docentes;
- aceptar una sugerencia como frase nueva o como reemplazo de una existente;
- rechazarla con una nota sin borrar la copia privada de la docente.

## 5. Principios de producto

1. **La unidad didáctica es el uso en contexto.** Una palabra puede aparecer varias veces con lecturas, categorías o sentidos distintos.
2. **La docente dirige.** La aplicación acompaña la explicación; no automatiza decisiones pedagógicas durante la clase.
3. **Profundidad progresiva.** Lo esencial aparece primero; composición, matices, cultura y traducciones se revelan a demanda.
4. **Sin falsa autoridad.** El contenido generado o importado permanece `unreviewed` hasta revisión humana, aunque pueda usarse en clase sin una etiqueta editorial visible.
5. **Poca fricción.** El alumno no crea cuenta; la docente reutiliza plantillas y la biblioteca común.
6. **Chino primero.** Trazos, pinyin, sentidos, clasificadores, componentes y tonos no se tratan como texto genérico.
7. **Privacidad por defecto.** La biblioteca privada de una docente y sus sesiones no son visibles para otras docentes; el voto no almacena identidad personal.

## 6. Alcance actual

### 6.1 Disponible en producción

- Autenticación para docente y administrador.
- Colecciones propias y plantillas comunes; copia independiente de plantillas.
- Lecciones ordenadas e ítems asociados a un sentido concreto.
- Búsqueda del catálogo por hanzi, pinyin sin tonos y significado.
- Biblioteca HSK 3.0 de niveles 1–3: 1000 sentidos con significado en español y 2637 frases con primera curación, todavía `unreviewed`.
- Diez plantillas temáticas HSK 1–3 con 317 ítems; todas sus apariciones tienen al menos una frase.
- Frases privadas de docente, copias editadas, originales ocultos y sugerencias al administrador.
- Rotación de ejemplos por colección o lección; selección fijada al iniciar cada sesión.
- Presentación con anverso, reverso, animación de trazos, composición cuando es completa, audio del navegador, pinyin, traducciones, matices y notas culturales disponibles.
- Presentación de palabras sin frases mediante la consigna de producción: «Inventen una frase con…».
- Valoración docente de cuatro niveles.
- Votación anónima del alumnado con código temporal y actualización automática de la palabra activa.
- Administración de la base común, plantillas y bandeja de sugerencias.
- Interfaz docente y pública en chino, español e inglés; administración en español; tema claro y oscuro.

### 6.2 Catálogo integrado con cobertura pedagógica parcial

- Catálogo HSK 4–9 del temario 2025/2026: 1000 entradas de HSK 4, 1600 de HSK 5, 1800 de HSK 6 y 5600 de la banda conjunta 7–9.
- Está en `master` y producción desde el 2026-10-12, con pinyin, categoría, glosa española básica y descomposición de caracteres.
- No incluye frases, matices ni notas culturales salvo las 85 frases temáticas HSK 4–6 ya requeridas por las plantillas de producción.

### 6.3 Fuera del MVP

- Autoestudio con cuentas de alumnos.
- Repetición espaciada o FSRS.
- Evaluación formal de dominio individual.
- Escritura guiada o libre como función estable.
- Producción de frases con corrección automática.
- Audio humano grabado.
- IA en vivo durante la clase.
- Aplicación nativa.
- Facturación, organizaciones o multitenencia comercial.

## 7. Requisitos funcionales

Los estados son: **Hecho**, **Parcial**, **Pendiente** o **Exploración**.

### 7.1 Acceso y roles

| ID | Requisito | Estado | Criterio de aceptación |
|---|---|---|---|
| PR-AUTH-01 | Una persona autenticada tiene perfil `teacher`, `reviewer` o `admin`. | Hecho | Las rutas privadas redirigen al login sin sesión; RLS limita los datos aunque se invoque la base fuera de la UI. |
| PR-AUTH-02 | Un administrador entra directamente al área `/admin`; una docente, a `/collections`. | Hecho | El destino se decide a partir del perfil, no de parámetros del cliente. |
| PR-AUTH-03 | Una docente no puede editar la biblioteca común ni las plantillas globales. | Hecho | La UI no ofrece la acción y la base la rechaza. |

### 7.2 Colecciones y lecciones

| ID | Requisito | Estado | Criterio de aceptación |
|---|---|---|---|
| PR-COL-01 | La docente puede crear, renombrar, ordenar y borrar colecciones y lecciones propias. | Hecho | Los cambios persisten y nunca afectan datos de otra docente. |
| PR-COL-02 | Puede copiar una plantilla común como colección independiente. | Hecho | La copia conserva lecciones, orden e ítems y registra la plantilla de origen. |
| PR-COL-03 | Puede buscar y añadir uno o varios sentidos, pegar una lista, cambiar el sentido, ordenar y quitar ítems. | Hecho | No se duplica el mismo sentido en una lección; las entradas no encontradas se señalan. |
| PR-COL-04 | Puede definir cuántas frases se muestran por palabra en colección y sobrescribirlo por lección; `0` significa todas. | Hecho | El valor de lección prevalece; `null` hereda el de la colección. |
| PR-COL-05 | Puede pedir al administrador palabras que no existen en el catálogo. | Pendiente | La solicitud queda en una bandeja trazable y no crea contenido global por sí sola. |

### 7.3 Ejemplos de la docente

| ID | Requisito | Estado | Criterio de aceptación |
|---|---|---|---|
| PR-EX-01 | La docente puede crear una frase privada para un sentido. | Hecho | La frase solo aparece en sus clases. |
| PR-EX-02 | Puede editar una copia de una frase global u ocultar la original. | Hecho | La copia sustituye a la original únicamente para esa docente. |
| PR-EX-03 | Puede enviar o retirar una sugerencia; el administrador puede aceptarla o rechazarla. | Hecho | Aceptar promueve contenido global; rechazar conserva la copia privada y comunica la nota. |
| PR-EX-04 | Las frases se rotan priorizando las menos vistas dentro de la misma colección. | Hecho | La selección se guarda al abrir la sesión y no cambia al recargar. |

### 7.4 Clase en vivo

| ID | Requisito | Estado | Criterio de aceptación |
|---|---|---|---|
| PR-LIVE-01 | Iniciar clase crea una sesión activa con código no ambiguo de seis caracteres. | Hecho | El código es único entre sesiones activas. |
| PR-LIVE-02 | El anverso muestra hanzi y animación de trazos; el reverso muestra el sentido elegido y profundidad opcional. | Hecho | Los datos ausentes no dejan bloques rotos; una descomposición incompleta se oculta. |
| PR-LIVE-03 | La docente controla pinyin, traducciones, audio, giro y navegación. | Hecho | La tarjeta conserva el ritmo de exposición y admite teclado en escritorio. |
| PR-LIVE-04 | Una palabra sin frases sigue formando parte de la clase con una consigna de producción. | Hecho | No se elimina silenciosamente de la lección. |
| PR-LIVE-05 | La docente asigna o quita una valoración 1–4 por sentido y sesión. | Hecho | La selección persiste y un error de guardado se informa. |
| PR-LIVE-06 | La docente abre, cierra y reabre la votación de la palabra activa. | Hecho | Solo hay una ronda abierta por sesión; volver a una palabra conserva los votos previos. |
| PR-LIVE-07 | La docente termina la sesión explícitamente. | Hecho | La sesión deja de aceptar alumnos y votos. |

### 7.5 Votación del alumno

| ID | Requisito | Estado | Criterio de aceptación |
|---|---|---|---|
| PR-VOTE-01 | El alumno entra sin cuenta mediante `/v` y un código. | Hecho | Código inválido y espera tienen estados diferenciados. |
| PR-VOTE-02 | Ve solo el hanzi y pinyin necesarios para votar, no el significado. | Hecho | La respuesta no se filtra en la carga pública. |
| PR-VOTE-03 | Elige entre «No la sé», «Me costó», «Bien» y «Fácil». | Hecho | Los objetivos táctiles son de al menos 44 px y el control expone semántica de radio. |
| PR-VOTE-04 | Puede cambiar su respuesta durante la ronda sin sumar un voto nuevo. | Hecho | El mismo navegador hace `upsert` sobre un identificador anónimo. |
| PR-VOTE-05 | La pantalla explica pérdida de conexión y reintento. | Hecho | Tras dos fallos de sondeo aparece un estado accesible; al recuperar red vuelve al flujo sin recargar. |

### 7.6 Administración y contenido

| ID | Requisito | Estado | Criterio de aceptación |
|---|---|---|---|
| PR-ADM-01 | El administrador busca y filtra el catálogo sin cargarlo completo en el navegador. | Hecho | La búsqueda devuelve página, total y facetas desde la base. |
| PR-ADM-02 | Edita palabra, sentidos, frases, notas y estado editorial y puede previsualizar la tarjeta. | Hecho | Las operaciones destructivas fallan de forma comprensible si el dato está en uso. |
| PR-ADM-03 | Crea y mantiene plantillas globales. | Hecho | Las docentes pueden leerlas y copiarlas, no modificarlas. |
| PR-ADM-04 | Cada dato publicable conserva procedencia, estado y revisión. | Parcial | Fuentes y niveles están versionados; falta atribución por frase/campo y revisión por idioma. |
| PR-ADM-05 | Se integra HSK 4–9 sin inventar niveles separados para la banda 7–9. | Hecho | Las migraciones se probaron en `hanzi-dev` y se aplicaron en producción con respaldo previo. |

### 7.7 Idioma, accesibilidad y presentación

| ID | Requisito | Estado | Criterio de aceptación |
|---|---|---|---|
| PR-UX-01 | La interfaz docente y pública usa el idioma del navegador entre `zh`, `es` y `en`, con inglés como fallback y selector recordado; admin permanece en español. | Hecho | Las tres traducciones de las superficies multilingües mantienen las mismas claves. |
| PR-UX-02 | El idioma de interfaz es independiente del idioma pedagógico del contenido. | Parcial | La UI ya es independiente; la preferencia de idioma de contenido por clase aún no existe. |
| PR-UX-03 | El producto funciona con teclado, reducción de movimiento y foco visible. | Hecho | Los controles propios y de biblioteca muestran foco y la animación respeta `prefers-reduced-motion`. |
| PR-UX-04 | Hanzi, frases y pinyin declaran su idioma para tecnologías asistivas. | Hecho | `zh-Hans` y `zh-Latn` se aplican en las superficies pedagógicas de clase y voto. |
| PR-UX-05 | La clase prioriza escritorio compartido y la votación prioriza móvil. | Hecho | No hay scroll horizontal en los tamaños cubiertos por las pruebas. |

## 8. Reglas de negocio

- La biblioteca común solo la modifica un `admin`; `reviewer` existe en el modelo, pero todavía no tiene un flujo propio completo.
- Una plantilla tiene `owner_id = null`; una colección privada pertenece a una docente.
- Una lección enseña sentidos, no palabras genéricas.
- Una sola evaluación puede estar abierta por sesión.
- Una sesión activa deja de ser válida para alumnos después de cuatro horas, aunque no se haya cerrado.
- El token anónimo del alumno vive seis horas en cookie `httpOnly`; la base guarda únicamente su hash.
- Una sugerencia aceptada deja de ser una copia privada activa y apunta a la frase promovida.
- Lo `unreviewed` puede mostrarse en clase, pero no lleva una etiqueta visible que interrumpa la enseñanza.
- La etiqueta HSK se asocia a estándar, entrada y, cuando corresponde, sentido. `words.hsk_level` es compatibilidad temporal.

## 9. Métricas de éxito de la demo

No hay analítica de producto instalada. La validación debe hacerse con observación y resultados de clase, no con métricas inventadas.

Se considerará que la siguiente demo cumple su objetivo si:

- la profesora prepara una lección real sin ayuda técnica;
- inicia una clase y llega a la segunda palabra sin atascarse;
- al menos 10 alumnos entran y votan desde sus teléfonos sin crear cuenta;
- la docente entiende la diferencia entre su valoración y la votación del grupo;
- puede explicar un contraste de uso apoyándose en una frase y no en una traducción aislada;
- identifica qué contenido corregiría o qué control le falta.

Indicadores técnicos de apoyo:

- recorridos críticos en verde contra `hanzi-dev`;
- cero errores de permisos en el recorrido esperado;
- cambio de palabra visible en el alumno dentro del intervalo de sondeo actual;
- ninguna pérdida silenciosa de una valoración o edición;
- ausencia de secretos o datos personales en logs, repositorio y respuestas públicas.

## 10. Riesgos y preguntas abiertas

- Falta validación lingüística nativa de la biblioteca marcada `unreviewed`.
- El aviso de desconexión tiene prueba unitaria, pero falta comprobarlo en navegadores y redes móviles reales.
- No se ha probado la votación con una clase real y muchos celulares simultáneos.
- La atribución de frases abiertas todavía no está modelada por frase.
- El rol `reviewer` está definido, pero la autorización efectiva de edición común se concentra en `admin`.
- El idioma de contenido por clase, las palabras de apoyo y las solicitudes de vocabulario siguen sin diseño final.
- Escritura, producción de frases y repetición espaciada son hipótesis de autoestudio, no compromisos del MVP.

## 11. Criterio de producto terminado para el MVP

El MVP no significa “todo el chino cargado”. Significa que una docente puede elegir contenido fiable, preparar una lección, impartirla y recoger una señal grupal sin soporte técnico ni exposición de datos. Para declararlo validado faltan, como mínimo, una prueba con la profesora real, una prueba de votación con un grupo real y el registro explícito de los aprendizajes de esa validación.
