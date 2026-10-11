# Arquitectura (borrador)

> Propuesta del 2026-10-10. Basada en [IDEA.md](IDEA.md). Stack aún sin
> confirmar; las decisiones abiertas están al final.

## 1. Visión general

Plataforma web, escritorio primero, con dos roles:

- **Profesora:** escribe o elige palabras → el sistema genera la ficha
  completa → ella revisa → asigna la lección → ve el semáforo de resultados.
- **Alumno:** practica las tarjetas (trazos animados, frase como pista,
  pinyin ocultable, audio) → se valora con 4 botones.

```
Profesora ──► [Editor de lección] ──► [Motor de contenido] ──► Ficha revisada
                                                                   │
Alumno ◄── [Práctica de tarjetas] ◄─────────────── Lección asignada
   │
   └──► Review (valoración 1–4 + acierto) ──► [Panel semáforo] ──► Profesora
```

## 2. Recursos externos para chino

| Recurso | Qué aporta | Licencia | Uso |
|---|---|---|---|
| [Temario HSK 3.0](https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf) / [GF 0025-2021](https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/t20210329_523304.html) | Temario oficial publicado en 2025, efectivo desde 2026-07, y norma base de nueve niveles | Documento oficial; verificar redistribución por artefacto | Fuente canónica: niveles 1-3 introducen 300 + 200 + 500 entradas (1000 acumuladas); HSK 2.0 queda como compatibilidad |
| [BCC](https://bcc.blcu.edu.cn/) | Corpus contemporáneo de Beijing Language and Culture University, separado por oralidad, noticias y otros dominios | Consulta y estadísticas con cita académica | Validar frecuencia, registro y colocaciones; no copiar frases automáticamente |
| [Hanzi Writer](https://github.com/chanind/hanzi-writer) | Animación de trazos y modo de práctica de escritura en el navegador | Código MIT; datos de trazos bajo Arphic Public License | Anverso de la tarjeta; modo "escribe tú" |
| [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) | Descomposición en componentes, radical y pista etimológica (~9000 caracteres) | Descomposición/etimología LGPL (por confirmar); trazos Arphic | Descomposición 认 → 讠 + 人 |
| [CC-CEDICT](https://cc-cedict.org/wiki/) | Diccionario chino–inglés (~120 000 entradas): simplificado, tradicional, pinyin, varias lecturas | CC BY-SA | Pinyin, lecturas múltiples (的 de/dí/dì). **Solo en inglés** |
| [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) / [ivankra/hsk30](https://github.com/ivankra/hsk30) | Espejos técnicos de listas HSK para automatizar comparaciones | MIT | Borrador de importación; siempre se contrasta con la norma o el temario oficial |
| [Tatoeba](https://tatoeba.org/es/downloads) | Frases aportadas por la comunidad | CC BY (algunas CC0) | Solo candidato con trazabilidad y revisión, nunca ejemplo curado automático |
| pinyin-pro (npm) | Hanzi → pinyin con cambios de tono de 一 y 不 | Por confirmar | Pinyin de las frases generadas |
| `Intl.Segmenter` (nativo del navegador/Node) | Segmenta frases chinas en palabras | — | Calcular el nivel HSK de una frase |
| Web Speech API (nativo) / TTS en la nube | Audio de palabra y frase | — / de pago | Audio. Nativo para la demo; nube si la calidad no basta |
| LLM (p. ej. Claude API) | Borradores de frases, traducción y notas | De pago por uso | Asistencia editorial; nunca fuente ni aprobación |

**Idiomas (decidido 2026-10-10).** Dos ajustes independientes:

1. **Idioma de la interfaz** (botones, menús, etiquetas): **el del
   navegador** si es chino, español o inglés; **si no, inglés**. Selector
   **中文 / Español / English** para cambiarlo; la elección se recuerda y manda
   sobre el navegador. URLs: inglés sin prefijo, `/zh` y `/es`.
2. **Idioma del contenido para los alumnos** (significados, traducciones,
   notas): va con la clase, no con quien usa la app. Hoy se muestran español
   e inglés; más adelante se elegirá por lección.

Así una docente china ve la app en chino mientras sus alumnos ven los
significados en español. El contenido base es **trilingüe: chino, español e
inglés**. Textos de la interfaz con lenguaje neutro de género ("docente",
"acceso docente"; en chino 教师 ya es neutro).

**Hueco importante:** no hay una base abierta y acreditada suficiente en
**español**. CC-CEDICT aporta inglés; el español se redacta como borrador y lo
revisa una persona. La IA puede ayudar, pero no se registra como autoridad.

## 3. Motor de contenido (la "ventaja extra")

Al escribir una palabra (ej. 认识):

1. **Datos fijos** (sin IA): nivel HSK (norma/temario oficial), pinyin, lecturas y
   significado en inglés (CC-CEDICT), caracteres, componentes y radical
   (Make Me a Hanzi), trazos (Hanzi Writer).
2. **Borrador editorial:** significado en español, de 2 a 3 frases (una por
   uso) con traducción al español y al inglés, nota de matiz (falsos amigos
   como 认识 / 知道 / 去过) y nota cultural si aporta. Puede redactarlo una
   persona o una IA, pero siempre nace `unreviewed`.
3. **Validación automática y de corpus:** se segmenta cada frase y se comprueba
   que sus palabras sean del nivel objetivo o inferior (o ya vistas en clase).
   Una palabra superior necesaria se registra como apoyo, no como error
   silencioso, y se contrastan registro y colocaciones con BCC.
4. **Revisión por idioma:**
   - **Chino** (frases, pinyin, matices, cultura) → la profesora.
   - **Español** → Ever (en la demo).
   - **Inglés** → la profesora, si hace falta.

## 3.1 Base curada propia

Lo que viene de fuera o de la IA es solo un **punto de partida**. Cada
corrección se guarda y la base propia crece con el uso:

- Cada campo guarda **origen** (CC-CEDICT, HSK, Make Me a Hanzi, Tatoeba, IA,
  persona), **estado** (sin revisar / revisado / corregido), **quién lo
  revisó** y cuándo.
- **Prioridad al mostrar:** corregido o revisado por una persona > dato
  abierto > IA sin revisar.
- Lo revisado no se vuelve a generar ni se pisa al actualizar las fuentes
  externas; solo se importan campos nuevos o no revisados.
- Con el tiempo, la base curada (frases actuales, español revisado, notas
  culturales) es el valor diferencial del proyecto.
- Ojo: lo derivado de CC-CEDICT hereda su licencia **CC BY-SA** (si se
  publica, debe compartirse con la misma licencia).

## 3.2 Radicales y datos de caracteres (sin API)

No se consume ninguna API en tiempo real. Los datos abiertos se **importan
una vez** a la base propia con un script y desde ahí se curan:

- `Radical`: carácter, variantes (言 → 讠), número Kangxi, trazos, nombre y
  significado (es, en), nota, ejemplos frecuentes. Unos 214 (Kangxi); se
  curan primero los ~50 más frecuentes en HSK 1–3.
- `Character`: carácter, pinyin, radical, componentes con su papel
  (semántico / fonético), pista etimológica (de Make Me a Hanzi).
- Los trazos de Hanzi Writer se sirven como JSON autoalojado.

## 3.2.1 Formas antiguas de los caracteres (futuro)

- Campo por carácter: `ancient_forms` (oracular, bronce, sello), cada una
  con SVG, fuente y licencia. Solo para caracteres con etimología
  pictográfica o ideográfica.
- Los SVG se guardan en Storage o en `public/` y se pintan con los tokens de
  la app (tinta, dorado), dentro del marco de la retícula, para que encajen
  con la estética sin alterar el glifo.
- Se curan poco a poco, como las frases y el audio; si la etimología es
  discutida, se dice.

## 3.3 Uso de la IA

La IA solo **arranca** la biblioteca: genera frases, español y notas
culturales para palabras que aún no existen. Lo generado se revisa y queda
en la base curada; reutilizar una palabra no vuelve a llamar a la IA. En el
MVP no hay IA en vivo: el contenido inicial se genera en sesión de
desarrollo (gratis) y una palabra nueva sin biblioteca se rellena con datos
abiertos y queda "pendiente de ejemplos".

## 3.4 Audio con voz real (futuro)

Hoy el audio sale de la síntesis de voz del navegador: gratis, pero
robótica y dependiente de las voces instaladas. Idea de Ever: que el audio
también se cure, como las frases. Cada docente graba poco a poco palabras y
frases con su voz, y esas grabaciones sustituyen a la voz del navegador.

- **Prioridad al reproducir:** grabación revisada > grabación sin revisar >
  voz del navegador. Lo que aún no tiene grabación sigue sonando como hoy,
  así que se puede avanzar de a poco.
- **Grabar desde la app:** botón "Grabar" en la pantalla de revisión de la
  ficha (MediaRecorder del navegador, micrófono del portátil). Escuchar,
  repetir o guardar. Sin estudio ni programas aparte.
- **Dónde se guarda:** Supabase Storage (bucket `audio`). Una frase de unos
  3 s en Opus ocupa unos 15 KB: miles de grabaciones caben en el plan gratis
  (1 GB).
- **Datos:** tabla `audio_recordings` (entidad: palabra, sentido o frase;
  id; ruta en Storage; quién grabó; duración; estado de revisión; fecha).
  Varias voces por frase es posible (útil para oír acentos distintos).
- **Compatibilidad:** Safari no siempre graba en el mismo formato que
  Chrome; se guarda lo que dé el navegador y, si hace falta, se convierte a
  un formato común al subir.
- **Consentimiento:** la voz es un dato personal. Quien graba acepta que se
  use en la plataforma y puede borrar sus grabaciones.
- **Alternativa intermedia:** TTS de calidad en la nube (voz neuronal) para
  lo que nadie ha grabado, si la del navegador no basta.

## 4. Modelo de datos

- `User`: id, nombre, rol (docente / revisor / administrador de contenido), idiomas que revisa.
- `Class`: grupo de alumnos de una profesora.
- `ContentSource`: fuente, editor, tipo, versión, URL, licencia, fecha de
  consulta y permiso de redistribución.
- `Word`: hanzi, caracteres[], nota cultural. La clasificación no se guarda
  directamente aquí para no pisar un estándar con otro.
- `WordLevel`: entrada oficial vinculada a palabra y, cuando se puede, a su
  sentido; estándar, nivel, orden, etiqueta original, pinyin, categoría y
  fuente. Admite varias filas para el mismo hanzi.
- `Sense` (**sentido o uso**): palabra, pinyin, significado (es, en),
  categoría (sustantivo, clasificador, verbo…), nota de matiz, orden
  sugerido. Ej. 家 → ① casa/hogar/familia · ② clasificador de empresas y
  tiendas (一家公司). Las lecturas distintas (的 de/dí/dì) también son
  sentidos, cada uno con su pinyin.
- `Sentence`: **sentido**, texto, pinyin, traducción (es, en), nivel calculado
  y palabras de apoyo superiores (`support_terms`: entrada/sentido, motivo).
- `Lesson`: profesora, clase, título, fecha, sentidos[] (la profesora elige
  qué sentido de cada palabra se enseña en esa clase).
- `Review`: alumno, **sentido**, valoración (1–4), acierto, usó pista, fecha.
- `Revision`: entidad, campo, valor anterior, valor nuevo, origen, autor,
  fecha. Historial de correcciones para la base curada.
- `TeacherExample`: propuesta privada de una docente para un sentido; puede
  quedarse privada, enviarse a revisión o promoverse a `Sentence` global.

Cada campo traducible o corregible lleva además: origen, estado de revisión
y revisor.

**Semáforo:** se calcula por **sentido** a partir de los `Review` del grupo
(media de valoraciones + % de aciertos). Los umbrales son configurables. Así
se distingue "dominan 家 = casa" de "no dominan 家 como clasificador".

**Qué sentidos ve el alumno en una tarjeta:**
- El sentido de la lección actual, destacado.
- Los sentidos ya vistos en lecciones anteriores de su clase, como repaso
  breve ("Ya lo viste: casa, hogar").
- Los sentidos aún no vistos, ocultos, para no saturar a un principiante.

El nivel HSK pertenece a la entrada oficial y puede corresponder a un sentido o
lectura. El temario vigente repite formas como `只` (`zhī` en nivel 1 y `zhǐ`
en nivel 3) y `长` (`cháng` en nivel 2 y `zhǎng` en nivel 3). La palabra no
se duplica, pero conserva varias filas `WordLevel` enlazables a sentidos
distintos. El orden pedagógico de esos sentidos lo decide la profesora.

## 4.1 Colecciones, plantillas y aportes de docentes (diseño 2026-10-11)

> Diseño aprobado por Ever el 2026-10-11 (solo admin edita la base común);
> aún no hay migración. Objetivo: que la docente arme
> sus propias lecciones a partir de su libro y que sus correcciones lleguen a
> la base curada sin que nadie pise lo de nadie.

### Organización

```
Colección   "Básico 1" (o un libro, o "HSK 1")
 └─ Lección  "Lección 1", "Lección 2"… (ordenadas)
     └─ Ítem  palabra + el sentido que se enseña ahí (+ frases elegidas)
```

- **Colección** de una docente: la crea desde cero o **copia una plantilla**
  y la adapta. Las copias son independientes: si la plantilla cambia, la
  copia no.
- **Plantillas** (colecciones sin dueño, curadas por administración): "HSK 1",
  "HSK 2"… y colecciones organizadas como los libros que usan las docentes
  ("Básico 1 · Lección 1…"). De los libros se toma **solo la lista de
  palabras** y su orden; las frases y textos del libro no se copian (derechos
  de autor), las frases son las nuestras.
- Una misma palabra puede estar en varias lecciones con **sentidos
  distintos** (家 casa en Básico 1, 家 clasificador más adelante).

### Roles

| Rol | Puede |
|---|---|
| `admin` | Curar la base común (palabras, sentidos, frases, notas), las plantillas y la cola de sugerencias. |
| `teacher` | Sus colecciones y lecciones; usar las frases curadas; crear frases propias; sugerir correcciones y frases para la base. |
| `reviewer` | Revisar contenido en su idioma (chino, español, inglés) sin administrar plantillas. |

### Quién edita qué

- **Base común** (`words`, `senses`, `sentences` sin dueño): solo `admin`
  (y `reviewer` para marcar revisado). **Hoy cualquier usuario autenticado
  puede escribirla: hay que cerrarlo antes de invitar a una segunda docente.**
- **Frases propias:** `sentences.owner_id` = la docente. Solo ella las ve y las
  usa en sus lecciones. Validación de nivel HSK igual que las curadas.
- **Sugerencias:** una docente propone un cambio (corregir un campo, añadir
  una frase a la base, pedir una palabra que falta). Queda en una cola; admin
  acepta (se aplica a la base y queda en `revisions`) o rechaza con motivo.
  Si la docente necesita el cambio ya, crea su frase propia y además sugiere.

### Modelo de datos (cambios sobre §4)

| Tabla | Cambio |
|---|---|
| `profiles` | `role` admite `admin`. |
| `collections` (nueva) | `id`, `owner_id` (null = plantilla), `title`, `description`, `source_note` (de dónde sale la lista, p. ej. "vocabulario del libro X"), `copied_from`, `created_at`. |
| `lessons` | + `collection_id`, + `position` (orden dentro de la colección; único por colección). |
| `lesson_items` | + `sentence_ids uuid[]` opcional: qué frases mostrar (curadas o propias); vacío = las curadas por defecto. |
| `sentences` | + `owner_id` (null = curada y común; docente = propia y privada). |
| `suggestions` (nueva) | `id`, `author_id`, `kind` (`edit` / `new_sentence` / `new_word`), `entity`, `entity_id`, `payload jsonb` (campo, valor actual y propuesto, o la frase nueva), `comment`, `status` (`pending` / `accepted` / `rejected`), `reviewed_by`, `reviewed_at`, `review_note`, `created_at`. |
| `senses` | + columna generada `pinyin_plain` (sin tonos) para buscar "renshi". |

Funciones (security definer, con RLS por dentro):
- `is_admin()`: lo usan las políticas.
- `copy_collection(template_id)`: copia colección, lecciones e ítems a la
  docente que llama.

### Cómo arma una lección la docente

1. **Mis colecciones** → crear una nueva o **copiar una plantilla**.
2. **Colección** → lecciones en orden: crear, renombrar, reordenar.
3. **Lección → añadir palabras**:
   - **Buscar** por hanzi, pinyin (con o sin tonos) o significado, con
     filtro por nivel HSK.
   - Si una forma aparece en varios niveles, agruparla visualmente y mostrar
     una opción por entrada/sentido con pinyin, categoría y etiqueta HSK; por
     ejemplo `只` → `zhī · clasificador · HSK 1` y
     `zhǐ · adverbio · HSK 3`.
   - **Pegar una lista** (los hanzi de la lección del libro, separados por
     espacios o saltos de línea). El sistema la resuelve:
     - palabra en la base → se añade con su primer sentido (cambiable);
     - palabra que no existe → se crea con datos abiertos (pinyin, nivel
       HSK, inglés) marcada "pendiente de contenido" y genera una sugerencia
       `new_word` para que administración cure frases y español.
4. **Por palabra**: elegir el sentido; ver las frases; usar las curadas,
   **añadir una propia** o **sugerir una corrección**.
5. Ordenar las palabras y **empezar clase** (lo que ya existe).

### Nivel de las frases en colecciones de libro

Los libros no siguen el orden HSK: Básico 1 (Nuevo libro de chino práctico)
mete 奶奶 (HSK 3) en la lección 3 y 记者, 语言 (HSK 4) en la 4, y 10 de sus 58
palabras ni están en las listas HSK (他们, 外语, 请问…). Por eso, en una
colección de libro, la regla de nivel de los ejemplos pasa a ser
**"solo vocabulario visto hasta esta lección"** (acumulado de la colección)
en vez de "HSK de la palabra". El validador recibe la lista acumulada.
Ejemplo con la lección 1 (你 好 吗 我 很 呢 也): 你好吗？我很好。你呢？我也很好。

### Administración

- Editor de plantillas (mismas pantallas que la docente, sobre colecciones
  sin dueño).
- Cola de sugerencias: ver propuesta frente a valor actual, aceptar o
  rechazar con motivo.
- Revisión por idioma (lo que ya prevé §3.1).

### Fases propuestas

- **Antes de las plantillas de libro:** poblar la base común con los hanzi
  (fuentes candidatas que dejó Ever en `input-externo/`: 5000 caracteres
  comunes y radicales HSK 1–6). Las listas de libros
  (`contenido/colecciones/`) son solo referencia hasta entonces.
- **1b · Preparación (siguiente):** migración (roles, colecciones, posición
  de lecciones, `owner_id` en frases, sugerencias, RLS cerrada, copia de
  plantillas); pantallas de colecciones, lecciones y añadir palabras (buscar
  y pegar lista); plantilla "Básico 1" con las listas del libro de Ever cuando la base esté poblada.
- **1c · Aportes:** frases propias, sugerencias y cola de curación.
- Después: alumno (repaso) sobre las mismas colecciones.

## 5. Pantallas

**Profesora**
1. Crear lección: escribir palabras o elegirlas de una lista HSK.
2. Revisar ficha: aprobar o editar lo generado, por idioma (la profesora,
   chino e inglés; Ever, español). Muestra el origen de cada dato.
3. Panel: semáforo por palabra, con filtro por alumno.

**Alumno**

4. Práctica: anverso con hanzi y trazos animados, pista con frase con hueco,
   botón de pinyin y audio → reverso con significado, frases y notas →
   4 botones de valoración.
5. Ficha de palabra: detalle de caracteres, lecturas y todas las frases.

**Ayuda dentro de una frase:** una palabra superior al nivel objetivo se marca
como interactiva. Hover o foco en escritorio y toque en móvil abren un
popover con hanzi, pinyin, significado breve y nivel HSK. Debe poder cerrarse,
usarse con teclado y anunciarse a lectores de pantalla; el color es solo apoyo
visual.

## 6. Fases

> **Foco del MVP (decidido 2026-10-10): la enseñanza en clase.** El objetivo
> es mostrarle a la profesora cómo podría enseñar mejor. El autoestudio del
> alumno es secundario. Detalle técnico en
> [DIAGNOSTICO-MODO-CLASE.md](DIAGNOSTICO-MODO-CLASE.md).

**Fase 0: base**
- Andamiaje (Next.js, Tailwind, shadcn/ui, Supabase) y login de la profesora.
- Tablas `Word`, `Sense`, `Sentence`, `Lesson`.
- Una lección real de la profesora con contenido generado en sesión y
  revisado (sin coste de API).

**Fase 1: presentar y valorar (el corazón de la demo)**
- Modo presentación para compartir pantalla en Zoom: anverso con trazos
  animados y radicales en color; reverso con significados, frases con la
  palabra resaltada y traducciones ocultas; atajos de teclado.
- Sesión de clase y valoración manual de la profesora por sentido.
- Semáforo simple a partir de esa valoración.

**Fase 2: votación anónima (tipo Kahoot)**
- URL corta + código grande (QR opcional); el móvil del alumno muestra el
  hanzi actual y los 4 botones y sigue a la profesora. Votos anónimos, polling y
  semáforo combinado.

**Fase 3: histórico**
- Evolución por sesión, Realtime si hace falta, vista de presentadora en dos
  ventanas, funcionamiento sin conexión completo.

**Después**
- Motor de contenido con IA (generar al escribir la palabra) y revisión por
  idioma.
- Autoestudio del alumno: práctica con pista, pinyin revelable frase por
  frase (botón junto al audio), 4 botones;
  enlace personal y `Review` individual ("quién repasó").
- Elegir palabras de listas HSK con selección múltiple.
- Repetición espaciada (intervalos por botón).
- Modo "escribe tú" con Hanzi Writer.
- Habilidades separadas: reconocer, usar, oír, escribir.
- Modo lectura (textos con vocabulario conocido).
- Varias clases, responsive para móvil, TTS de mejor calidad.
- Audio con la voz de la docente, grabado poco a poco desde la app (§3.4).

## 6.1 Capa de interfaz (decidida 2026-10-10)

| Pieza | Propuesta | Por qué |
|---|---|---|
| CSS | **Tailwind CSS v4** | Estándar con Next.js; los tokens de diseño viven en CSS |
| Componentes | **shadcn/ui** (sobre Radix) | Accesibles; el código queda en el repo y se adapta al estilo |
| Iconos | **lucide-react** | Viene con shadcn/ui |
| Tokens de diseño | Variables CSS: colores base, acento, radical / parte fonética, 4 tonos, semáforo; modo claro y oscuro | Una sola fuente de verdad para el estilo |
| Fuentes | **next/font** con Noto Serif SC (hanzi), Noto Sans SC (UI) e Inter (latín y pinyin) | Carga optimizada; las fuentes CJK son pesadas |
| Modo oscuro | **next-themes** | Claro/oscuro sin parpadeo |
| Idiomas de la UI | **next-intl** con prefijo en la URL (`/zh`, `/es`; inglés sin prefijo), detección por el navegador | Ver "Idiomas" en §2; el prefijo mantiene las páginas estáticas con Cache Components |
| Trazos | **Hanzi Writer** | Animación y práctica de escritura |
| Animaciones de UI | CSS / Tailwind; **Motion** solo si hace falta (giro de tarjeta) | Ligero |
| Gráficas del panel | **Charts de shadcn/ui** (Recharts) | Solo si el semáforo necesita gráficas |

## 7. Decisiones abiertas
- **Stack.** Next.js + TypeScript (decidido), desplegado en Vercel.
  **Base de datos y login: Supabase** (decidido 2026-10-10):
  - Login para profesoras desde el MVP; login de alumnos más adelante para
    ver quién repasó. Supabase trae Auth + Postgres + Row Level Security
    (cada profesora solo ve sus clases y alumnos).
  - Plan gratis: se pausa tras 7 días sin peticiones a la base o a la API
    (alumnos o profesora). Se evita con un **keep-alive** en GitHub Actions
    que hace una consulta cada 3 días.
  - Paso intermedio para alumnos sin contraseña: **enlace personal por
    alumno** (token único) que ya permite saber quién repasó.
  - Alternativa descartada por ahora: Neon (no se pausa, pero no trae login;
    habría que sumar Better Auth o similar).
- **Proveedor de IA** y presupuesto por palabra generada.
- **Licencias:** confirmar las de Make Me a Hanzi y los datos de Hanzi Writer
  si algún día deja de ser una demo (Arphic podría limitar el uso comercial).
