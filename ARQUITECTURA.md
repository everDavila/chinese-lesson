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

**Idiomas:** la profesora es china y habla inglés (y algo de español); los
alumnos son hispanohablantes. Todo el contenido es **trilingüe: chino,
español e inglés**. Interfaz de la profesora en inglés (o chino); la del
alumno, en español.

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

## 4. Modelo de datos

- `User`: id, nombre, rol (profesora / alumno / revisor), idiomas que revisa.
- `Class`: grupo de alumnos de una profesora.
- `Word`: hanzi, pinyin, significado (es, en), nivel HSK, caracteres[],
  nota de matiz, nota cultural.
- `Reading`: palabra, pinyin, significado (es, en). Para palabras con varias
  lecturas.
- `Sentence`: palabra, texto, pinyin, traducción (es, en), nivel calculado.
- `Lesson`: profesora, clase, título, fecha, palabras[].
- `Review`: alumno, palabra, valoración (1–4), acierto, usó pista, fecha.
- `Revision`: entidad, campo, valor anterior, valor nuevo, origen, autor,
  fecha. Historial de correcciones para la base curada.

Cada campo traducible o corregible lleva además: origen, estado de revisión
y revisor.

**Semáforo:** se calcula por palabra a partir de los `Review` del grupo (media
de valoraciones + % de aciertos). Los umbrales son configurables.

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

**MVP (demo para la profesora)**
- Crear lección escribiendo palabras.
- Motor de contenido (datos fijos + IA + validación de nivel) con revisión.
- Práctica con trazos animados, pista con frase, mostrar/ocultar pinyin,
  audio nativo y 4 botones.
- Panel con semáforo.
- Login para la profesora. Alumnos: enlace personal por alumno (sin
  contraseña), que ya registra quién repasó.

**Después**
- Elegir palabras de listas HSK con selección múltiple.
- Repetición espaciada (intervalos por botón).
- Modo "escribe tú" con Hanzi Writer.
- Habilidades separadas: reconocer, usar, oír, escribir.
- Modo lectura (textos con vocabulario conocido).
- Cuentas reales, varias clases, responsive para móvil.
- TTS de mejor calidad.

## 7. Decisiones abiertas
- **Stack.** Next.js + TypeScript (decidido), desplegado en Vercel.
  **Base de datos y login: Supabase** (propuesta, por confirmar):
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
