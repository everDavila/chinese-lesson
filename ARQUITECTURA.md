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
| [Hanzi Writer](https://github.com/chanind/hanzi-writer) | Animación de trazos y modo de práctica de escritura en el navegador | Código MIT; datos de trazos bajo Arphic Public License | Anverso de la tarjeta; modo "escribe tú" |
| [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) | Descomposición en componentes, radical y pista etimológica (~9000 caracteres) | Descomposición/etimología LGPL (por confirmar); trazos Arphic | Descomposición 认 → 讠 + 人 |
| [CC-CEDICT](https://cc-cedict.org/wiki/) | Diccionario chino–inglés (~120 000 entradas): simplificado, tradicional, pinyin, varias lecturas | CC BY-SA | Pinyin, lecturas múltiples (的 de/dí/dì). **Solo en inglés** |
| [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) / [ivankra/hsk30](https://github.com/ivankra/hsk30) | Listas HSK 2.0 y 3.0 con nivel por palabra (JSON / CSV) | MIT | Nivel de cada palabra; listas para que la profesora elija |
| [Tatoeba](https://tatoeba.org/es/downloads) | Frases reales chino–español/inglés | CC BY (algunas CC0) | Fuente opcional de frases reales |
| pinyin-pro (npm) | Hanzi → pinyin con cambios de tono de 一 y 不 | Por confirmar | Pinyin de las frases generadas |
| `Intl.Segmenter` (nativo del navegador/Node) | Segmenta frases chinas en palabras | — | Calcular el nivel HSK de una frase |
| Web Speech API (nativo) / TTS en la nube | Audio de palabra y frase | — / de pago | Audio. Nativo para la demo; nube si la calidad no basta |
| LLM (p. ej. Claude API) | Frases actuales del nivel adecuado, traducción al español, nota cultural | De pago por uso | Generar lo que los datos abiertos no tienen |

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

**Hueco importante:** no hay datos abiertos buenos en **español**. CC-CEDICT y
HSK traen inglés (útil para la profesora), pero el español lo genera el LLM.

## 3. Motor de contenido (la "ventaja extra")

Al escribir una palabra (ej. 认识):

1. **Datos fijos** (sin IA): nivel HSK (listas HSK), pinyin, lecturas y
   significado en inglés (CC-CEDICT), caracteres, componentes y radical
   (Make Me a Hanzi), trazos (Hanzi Writer).
2. **Generación con IA:** significado en español, de 2 a 3 frases (una por
   uso) con traducción al español y al inglés, nota de matiz (falsos amigos
   como 认识 / 知道 / 去过) y nota cultural si aporta.
3. **Validación automática:** se segmenta cada frase y se comprueba que todas
   sus palabras sean del nivel de la palabra o inferior (o ya vistas en
   clase). Si no cumple, se regenera.
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

- `User`: id, nombre, rol (profesora / alumno / revisor), idiomas que revisa.
- `Class`: grupo de alumnos de una profesora.
- `Word`: hanzi, nivel HSK, caracteres[], nota cultural.
- `Sense` (**sentido o uso**): palabra, pinyin, significado (es, en),
  categoría (sustantivo, clasificador, verbo…), nota de matiz, orden
  sugerido. Ej. 家 → ① casa/hogar/familia · ② clasificador de empresas y
  tiendas (一家公司). Las lecturas distintas (的 de/dí/dì) también son
  sentidos, cada uno con su pinyin.
- `Sentence`: **sentido**, texto, pinyin, traducción (es, en), nivel
  calculado.
- `Lesson`: profesora, clase, título, fecha, sentidos[] (la profesora elige
  qué sentido de cada palabra se enseña en esa clase).
- `Review`: alumno, **sentido**, valoración (1–4), acierto, usó pista, fecha.
- `Revision`: entidad, campo, valor anterior, valor nuevo, origen, autor,
  fecha. Historial de correcciones para la base curada.

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

El nivel HSK es de la palabra, no del sentido (las listas oficiales no
separan sentidos), así que el orden de los sentidos lo sugiere el sistema y
lo decide la profesora.

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
