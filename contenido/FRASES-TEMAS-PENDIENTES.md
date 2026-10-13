# Frases pendientes de las plantillas por tema

> Orden de trabajo para curación. 85 palabras de las 10 plantillas de
> vocabulario por contexto siguen sin frases y en clase salen con la consigna
> *"Inventen una frase con X"*.

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
npm run validate:content                                   # nivel del vocabulario
npm run db:sync-hsk-examples contenido/temas-frases-hsk4.json   # simulación
```

El importador resuelve cada sentido por `sourceId` + `sourceOrder`, solo actúa
sobre sentidos `unreviewed`, no repite frases que ya existan y no pasa de tres
por palabra. Solo para esta tarea se prepara una frase por palabra; el máximo del
importador no cambia. Con `--apply` inserta.

```bash
npm run db:sync-hsk-examples contenido/temas-frases-hsk4.json --apply
```

Probar en `hanzi-dev` antes de producción, con respaldo (`npm run db:backup`).
