# Política de contenido

> Fuente de verdad editorial para la biblioteca compartida. Las decisiones de
> producto y arquitectura siguen viviendo en `AGENTS.md` y `ARQUITECTURA.md`.

## Objetivo

Enseñar chino contemporáneo en contexto. Una etiqueta HSK organiza el catálogo,
pero no convierte automáticamente una traducción o una frase en contenido apto
para clase.

## Jerarquía de fuentes

1. **Temario oficial vigente:** *HSK 3.0 Examination Syllabus*, publicado en
   noviembre de 2025 y efectivo desde julio de 2026. Define el catálogo
   operativo que estudia y evalúa cada nivel.
2. **Norma oficial base:** `GF 0025-2021`, *Chinese Proficiency Grading
   Standards for International Chinese Language Education*. Sustenta el esquema
   de tres etapas y nueve niveles. Se conserva HSK 2.0 como compatibilidad, pero
   no dirige el contenido nuevo.
3. **Uso contemporáneo:** BCC de Beijing Language and Culture University. Se
   consultan por separado los canales de oralidad, noticias y corpus equilibrado;
   una frecuencia global sin dominio no demuestra que una expresión sea útil en
   conversación.
4. **Datos léxicos abiertos:** CC-CEDICT puede proponer tradicional, pinyin y
   glosas inglesas. Sus datos entran como borrador y requieren revisión.
5. **Caracteres y trazos:** Make Me a Hanzi y Hanzi Writer Data, respetando sus
   licencias y atribución.
6. **Contenido humano:** ejemplos, traducciones y notas redactados o corregidos
   por una persona identificada. La profesora puede proponer ejemplos privados;
   solo una persona con rol de curación puede promoverlos a la biblioteca global.

Los Excel de `input-externo/` no son fuentes editoriales. Sirven únicamente para
comparar cobertura o detectar candidatos; no se importan a Supabase.

## Reglas de publicación

- Cada dato importado registra fuente, versión, URL, fecha de consulta y licencia.
- `unreviewed` significa borrador invisible como contenido curado.
- Una traducción no puede marcarse `reviewed` si solo proviene de IA o de una
  glosa automática.
- Los ejemplos publicados son originales o tienen permiso claro de
  redistribución. Un corpus sirve para comprobar naturalidad y colocaciones, no
  para copiar frases sin revisar derechos.
- Los ejemplos deben reflejar situaciones contemporáneas y declarar el registro
  cuando sea relevante: conversación, aula, trabajo, noticias o escritura formal.
- Se evita enseñar equivalencias palabra por palabra cuando el sentido depende
  de aspecto, partícula, clasificador, colocación o contexto cultural.
- Simplificado, tradicional y variantes se almacenan explícitamente; nunca se
  colapsan mediante conversión ciega.
- Un nivel HSK pertenece a una versión y una entrada concreta. El mismo hanzi
  puede reaparecer en otro nivel por otra lectura, categoría o acepción; esas
  filas no se deduplican a ciegas. Cambiar de estándar tampoco elimina la
  clasificación anterior.

## Flujo editorial

1. Importar únicamente identificación y clasificación verificables.
   Para habilitar la selección en colecciones, el importador puede crear un
   primer sentido provisional con el pinyin y la categoría del temario; queda
   `unreviewed`, sin traducciones ni ejemplos, y nunca pisa un sentido existente.
2. Crear sentidos separados cuando cambien pronunciación, categoría o uso.
3. Redactar ejemplos restringidos al nivel o al vocabulario ya conocido.
4. Contrastar uso y colocaciones con corpus contemporáneo.
5. Revisar chino, español e inglés por separado.
6. Publicar solo los campos aprobados; conservar las correcciones en `revisions`.

## Primera entrega: HSK 1-3 moderno

- Catálogo oficial de 300 entradas del nivel 1 del temario HSK 3.0 efectivo
  desde julio de 2026.
- Catálogos incrementales de 200 entradas nuevas en nivel 2 y 500 en nivel 3:
  500 y 1000 entradas acumuladas, respectivamente.
- Mapeo de compatibilidad con HSK 2.0.
- Pinyin y formas tradicional/simplificada verificadas.
- Sentidos prioritarios para principiantes, no todas las acepciones de
  diccionario.
- Ejemplos actuales, cortos y naturales, con traducción española e inglesa.
- Estado de revisión por palabra, sentido y ejemplo.

## Fuentes registradas inicialmente

| Identificador | Fuente | Tipo | Uso permitido en el proyecto |
|---|---|---|---|
| `moe-gf0025-2021` | Ministerio de Educación de China, GF 0025-2021 | Norma oficial | Clasificación y verificación |
| `cti-hsk3-2026` | Chinese Test International, temario HSK 3.0 (2025-11; efectivo 2026-07) | Examen oficial | Catálogo operativo por nivel |
| `blcu-bcc` | Beijing Language and Culture University, BCC | Corpus académico | Frecuencia y validación de uso |
| `cc-cedict` | CC-CEDICT | Diccionario abierto | Borrador léxico con atribución |
| `makemeahanzi` | Make Me a Hanzi | Datos abiertos | Estructura y etimología como borrador |
| `hanzi-writer-data` | Hanzi Writer Data | Datos abiertos | Trazos y animación |
