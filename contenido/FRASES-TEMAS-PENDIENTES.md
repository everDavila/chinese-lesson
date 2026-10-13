# Frases pendientes de las plantillas por tema

> Cobertura inicial de las frases pendientes de las plantillas por tema.
> Esta rama completa una frase por cada uno de los 85 sentidos pendientes.
> Ya se cargaron en `hanzi-dev`; todavía no se aplicaron en producción.
> Todo sigue como `unreviewed`, pendiente de revisión humana.

## Resultado (2026-10-13)

- **85 frases originales:** HSK 4: 43 · HSK 5: 37 · HSK 6: 5.
- La cantidad de una frase por palabra es solo para esta tarea. No se reduce
  el contenido existente ni se cambia el máximo de tres del importador.
- Son 85 sentidos distintos y 86 apariciones en las plantillas: `政府` está
  tanto en Medio ambiente como en Sociedad y cultura.
- Chino, pinyin y traducciones al español e inglés completos; `origin: ai`,
  `source: codex-editorial`, `license: null`. La procedencia detallada permanece
  en los JSON; la tabla `sentences` guarda `origin`, sin columna `source`.
- Validadas con el temario oficial completo. Identificadores y campos léxicos
  originales conservados. La validación automática no resuelve acepciones.
- En `hanzi-dev`: 2654 → 2739 frases. Las 85 nuevas se verificaron campo por
  campo; cero frases anteriores modificadas o eliminadas. Repetir los tres
  lotes en simulación propone cero inserciones.
- Respaldo previo, en la carpeta principal y fuera de Git:
  `backups/supabase-2026-10-13T2101.json`.
- **Pendiente:** aplicación en producción, contraste sistemático con BCC,
  revisión humana nativa y prueba en clase. La glosa provisional de `成` no
  describe su categoría `量`: el ejemplo usa `三成` (30 %); se dejó una nota
  editorial en el JSON sin alterar el catálogo. Referencia de ese uso:
  [漢典: 成](https://www.zdic.net/hans/成).

## De dónde sale la lista

Las 10 plantillas (`20261012040000_temas_contexto_seed.sql`) se armaron sobre
"el temario HSK 3.0 1–3", pero el seed eligió algunas palabras por su sentido
temático y resultaron ser de nivel 4+. No es contenido perdido: la curación de
HSK 1–3 está completa, y de los 317 ítems de tema **231 ya tienen frases**
(3 por palabra). Estas 85 son las que quedaron fuera por nivel.

Consulta con la que se generó, por si hay que rehacerla:

```sql
select w.hanzi, se.pinyin, se.meaning_es, w.hsk_level, se.category,
       se.catalog_source_id, se.catalog_source_order, se.id
from senses se
join words w on w.id = se.word_id
where not exists (select 1 from sentences s where s.sense_id = se.id)
  and exists (
    select 1 from collections c
    join lessons l on l.collection_id = c.id
    join lesson_items li on li.lesson_id = l.id
    where li.sense_id = se.id and c.owner_id is null
      and c.title not like 'HSK %')
order by w.hsk_level, w.hanzi;
```

## Orden de trabajo sugerido

| Archivo | Nivel | Palabras | Por qué este orden |
|---|---|---|---|
| `temas-frases-hsk4.json` | 4 | 43 | Es lo más cercano a lo ya curado y lo que sirve hoy en clase |
| `temas-frases-hsk5.json` | 5 | 37 | Tecnología y Sociedad y cultura concentran el trabajo |
| `temas-frases-hsk6.json` | 6 | 5 | Queda para el final; dos son palabras sueltas polisémicas |

**Un archivo por nivel, no uno junto.** El importador lee un solo
`metadata.level` y lo escribe en `sentences.computed_level`; mezclar niveles
falsearía el nivel calculado de cada frase.

Distribución por tema, para repartir: Medio ambiente 23 · Tecnología 20 ·
Trabajo 19 · Sociedad y cultura 19 · Salud y cuerpo 2 · Viajes 2 · Transporte 1.

## Qué rellenar

La cantidad es específica de esta tarea para completar la cobertura inicial;
no cambia la política general ni las frases ya curadas de otras colecciones.

Cada ítem trae ya `hanzi`, `targetPinyin`, `meaningEs`, `category`,
`inThemes`, `senseId` y `sourceOrder`. Solo hay que completar `sentences`
(una por palabra: **85 frases en total**) con esta forma, la misma de la
curación HSK 1–3:

```json
{
  "zh": "我想保护环境。",
  "pinyin": "Wǒ xiǎng bǎohù huánjìng.",
  "es": "Quiero proteger el medio ambiente.",
  "en": "I want to protect the environment.",
  "origin": "ai",
  "source": "codex-editorial",
  "license": null
}
```

- `origin`: `open_data` si la frase viene de Tatoeba o Gushi (entonces `source`
  y `license` son obligatorios, más `sourceSentenceId` si es de Tatoeba);
  `ai` si la redacta el agente (`source: "codex-editorial"`, `license: null`).
- Entra todo como `unreviewed`. Nadie marca `reviewed`: eso es revisión humana.
- Seguir `POLITICA-DE-CONTENIDO.md`: vocabulario del nivel de la palabra o
  inferior; si una frase natural exige una palabra superior, se admite como
  apoyo marcada con pinyin, glosa y nivel. Frases cortas y contemporáneas.

## Cómo comprobarlo antes de tocar la base

```bash
npm run validate:content -- contenido/temas-frases-hsk4.json
npm run validate:content -- contenido/temas-frases-hsk5.json
npm run validate:content -- contenido/temas-frases-hsk6.json
node --env-file=.env.dev.local scripts/sync-hsk-examples.mjs contenido/temas-frases-hsk4.json # simulación en dev
```

El importador resuelve cada sentido por `sourceId` + `sourceOrder` y comprueba
hanzi y pinyin. Consulta solo los órdenes del lote en grupos de 100 para evitar
el límite de respuestas de Supabase. Los UUID de dev y producción pueden ser
distintos; no se usa `senseId` como identificador entre entornos. Solo actúa
sobre sentidos `unreviewed`, no repite frases que ya existan y no pasa de tres
por palabra. Solo para esta tarea se prepara una frase por palabra; el máximo del
importador no cambia. Con `--apply` inserta.

```bash
node --env-file=.env.dev.local scripts/sync-hsk-examples.mjs contenido/temas-frases-hsk4.json --apply
```

Repetir para HSK 5 y 6. Probar en `hanzi-dev` antes de producción, con respaldo
previo de la base correspondiente. Para dev:
`node --env-file=.env.dev.local scripts/backup-db.mjs`.
`npm run db:backup` usa `.env.local` (producción).
