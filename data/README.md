# Datos abiertos importados

| Archivo | Origen | Licencia | Contenido |
|---|---|---|---|
| `hsk-levels.json` | [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (`complete.min.json`) | MIT, © 2026 Yanis Zafirópulos | Nivel mínimo por palabra: `o` = HSK 2.0, `n` = HSK 3.0 (7 = niveles 7–9) |

Los archivos se generan una vez a partir de la fuente y no se editan a mano.
Lo curado (frases, español, notas) vive en `contenido/` y, más adelante, en
la base de datos.

| Archivo | Origen | Licencia | Contenido |
|---|---|---|---|
| `hsk-catalogo-1-3.json` | Temario oficial HSK 3.0 niveles 1–3 (`contenido/hsk3-level*.json`) + glosa inglesa de complete-hsk-vocabulary (MIT) | Lista: temario oficial; glosas: MIT | Catálogo del prototipo: 988 palabras, un sentido por entrada del temario (点, 只… tienen dos). Se genera con `node scripts/build-catalogo.mjs <complete.min.json>`; la glosa se empareja por hanzi y pinyin (吗 ma, no má) |
| `../contenido/hsk3-level{4,5,6,7-9}.json` | Temario oficial HSK 3.0 2025/2026 + glosas españolas de [Gushi](https://gushichinese.com/es/hsk-3.0/downloads) | Lista oficial; glosas CC BY-SA 4.0 | 10.000 entradas nuevas con pinyin, categoría y significado básico; sin ejemplos, matices ni notas culturales |
| `characters.json` | [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) (`dictionary.txt`) | LGPL v3 o posterior | Descomposición, radical, etimología y papel de cada trazo de los 3088 caracteres usados por HSK 1–9 |
| `../public/hanzi-writer/*.json` | [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) (derivado de Make Me a Hanzi y fuentes Arphic) | Arphic Public License (`ARPHICPL.txt` en la misma carpeta) | Trazos para la animación de los caracteres HSK disponibles |

Regenerar el catálogo completo de caracteres:

```
npm run content:build-characters -- <ruta/a/dictionary.txt>
```

`dictionary.txt` se descarga de
`https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt`
(no se guarda en el repo: ~10 MB). Los trazos salen del paquete de
desarrollo `hanzi-writer-data`.

Si la etimología no marca parte semántica, se colorea el radical en su
lugar. Los datos tienen rarezas (化 da como radical 匕, no 亻); se curarán en
la base propia.
