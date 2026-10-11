# Auditoría UX y contenido 2026 10 10

## Contexto

- Proyecto: Chinese Lesson.
- Rama auditada: `fase-1-supabase`.
- Commit auditado: `30dff39`.
- Fecha: 2026-10-10.
- Alcance: contenido pedagógico de la lección de demo y experiencia de usuario en móvil y escritorio.
- Entregable ampliado: `reports/AUDITORIA-UX-CONTENIDO-2026-10-10.docx`.

Esta auditoría no implementó cambios en la aplicación. Su propósito es dejar una referencia compartida para futuras decisiones y para otros agentes o PCs.

## Veredicto

La demo comunica bien su propuesta: enseñar vocabulario chino en contexto y permitir que la profesora conduzca la explicación. La experiencia de escritorio ya sirve para una demostración real. La experiencia móvil conserva el contenido, pero todavía tiene problemas de interacción importantes.

El contenido tiene una base sólida, pero no debe presentarse aún como lingüísticamente validado. Hay formulaciones absolutas, ejemplos poco naturales, generalizaciones culturales y falta de fuente y estado de revisión por dato.

| Área | Estado | Resumen |
|---|---|---|
| UX escritorio | Bien | Adecuada para presentar una clase; debe controlar mejor el contenido extenso. |
| UX móvil | Mal | El anverso funciona, pero el reverso y la valoración no están resueltos. |
| Contenido | Regular | Buena selección y cobertura; requiere revisión nativa y trazabilidad. |
| Accesibilidad | Regular | Hay semántica y reducción de movimiento, pero faltan tamaños táctiles y pruebas asistivas. |

## Auditoría del contenido

### Cobertura

- 10 palabras.
- 15 sentidos.
- 30 frases de ejemplo.
- 7 notas culturales.
- 10 matices de uso.
- Distribución HSK: 3 palabras de nivel 1, 3 de nivel 2 y 4 de nivel 3.
- `npm run validate:content` pasa: las frases no superan el nivel HSK asignado según el vocabulario local.

La validación automática solo comprueba nivel léxico. No valida naturalidad, gramática, registro, exactitud cultural, pinyin ni calidad de traducción.

### Lo bueno

- Cada sentido tiene dos frases y traducción al español e inglés.
- La selección permite enseñar contrastes útiles como `认识`, `知道` y `了解`.
- Los distintos usos de `家`, `意思` y `习惯` justifican enseñar vocabulario en contexto.
- El pinyin mantiene marcas tonales y distingue tonos neutros relevantes como `东西` y `认识`.
- Las notas de uso conectan significado, contexto y cultura, que es la ventaja principal del producto frente a una lista de palabras.

### Hallazgos por palabra

| Palabra | Estado | Hallazgo | Recomendación |
|---|---|---|---|
| 家 | Regular | La explicación del cerdo bajo techo se presenta como hecho histórico. | Introducirla como interpretación tradicional y añadir fuente o estado de revisión. |
| 认识 | Regular | La regla “solo para personas o cosas que reconoces” es demasiado absoluta. `认识你很高兴` se entiende, pero `很高兴认识你` resulta más natural. | Eliminar “solo” y usar la formulación idiomática en el ejemplo. |
| 东西 | Bien | La diferencia entre `dōngxi` y `dōngxī` está bien explicada. El segundo ejemplo es demasiado genérico. | Cambiar `这个东西很好` por una frase con contexto, por ejemplo `这个东西很好用`. |
| 知道 | Regular | Decir que “saber” se divide en tres excluye `懂` y otros usos. | Limitar la afirmación a los contrastes de esta lección. |
| 意思 | Bien | Es la tarjeta más rica. `你是什么意思？` puede sonar desafiante según tono y situación. | Añadir una nota breve de registro. |
| 觉得 | Bien | Los ejemplos son naturales; “Siento que hoy hace un poco de frío” suena literal en español. | Usar “Me parece que hoy hace un poco de frío”. |
| 了解 | Regular | El texto español mezcla caracteres con el sufijo en `了解lo`. | Escribir “Puedes conocer a alguien sin conocerlo a fondo”. |
| 关心 | Regular | La nota sobre `吃饭了吗？` como saludo generaliza una práctica dependiente de edad, región y contexto. | Presentarla como uso posible y contextual. |
| 习惯 | Mal | “Cada país tiene sus propias costumbres” mezcla hábito personal con costumbre social y compite con `风俗` o `习俗`. | Usar `每个人都有自己的习惯` para hábito o enseñar `风俗习惯` si el objetivo es cultura. |
| 文化 | Mal | La nota presenta una interpretación gráfica e histórica como etimología literal segura. | Citar la fuente, marcarla como interpretación y evitar “literalmente” hasta validarla. |

### Problemas estructurales

- La demo funciona como vitrina, pero la lección no declara un objetivo de aprendizaje ni un resultado observable.
- `认识`, `知道` y `了解` están separados; conviene enseñarlos de forma consecutiva.
- La valoración mide una impresión general. Falta una pregunta de comprobación por palabra.
- Las notas culturales no muestran fuente, autor, fecha ni estado de revisión.
- El repositorio solo declara una revisión pendiente global del español y del chino.
- El contenido para alumnos existe en español e inglés. La interfaz puede estar en chino, pero la tarjeta no ofrece chino como idioma explicativo.

## Auditoría UX de escritorio

### Lo bueno

- El hanzi y el significado dominan la jerarquía.
- El tema oscuro carbón y dorado tiene identidad propia y conserva los colores pedagógicos.
- La secuencia significado, composición, ejemplos, detalles y valoración es clara.
- Los controles persistentes y atajos funcionan bien para compartir pantalla durante una clase.
- No se detectó scroll horizontal de página en los tamaños probados.

### Lo mejorable

- La pantalla inicial parece un selector interno y no explica la dinámica de la clase.
- Al abrir detalles o traducciones, el contenido supera la altura disponible en laptop.
- La palabra y el significado desaparecen durante el scroll interno.
- La valoración queda debajo del contenido expandido.
- El tema claro tiene menos contraste de jerarquía y menos personalidad que el oscuro.

### Lo malo

La tarjeta intenta contener significado, composición, ejemplos, traducciones, matices, cultura y valoración en una sola superficie. En laptop, esto convierte la presentación en una ventana con scroll interno y corta el ritmo de la explicación.

## Auditoría UX móvil

### Lo bueno

- El anverso conserva el impacto del hanzi y la cuadrícula de trazos.
- La tipografía china mantiene buena legibilidad.
- La identidad visual y el código de colores sobreviven al cambio de tamaño.
- No aparece scroll horizontal general de página.

### Lo mejorable

- La cabecera junta título, idioma y acceso docente en un ancho demasiado pequeño.
- La acción para empezar aparece después de las diez palabras; debería repetirse al principio.
- Audio, navegación, idioma, login y controles de presentación tienen áreas táctiles menores a 44 px.
- Español e inglés aparecen juntos y consumen altura; el segundo idioma debería poder plegarse.
- Los detalles deberían abrirse como acordeón breve o panel inferior.

### Lo malo

- El reverso usa un scroll interno largo dentro de una tarjeta fija y hace perder la referencia superior.
- Las cuatro valoraciones permanecen en una sola fila: “Bien” queda cortada y “Fácil” sale del área visible.
- El desbordamiento queda oculto, por lo que una acción deja de ser visible y prácticamente accesible.

## Recorrido auditado

| Paso | Pantalla o acción | Escritorio | Móvil |
|---:|---|---|---|
| 1 | Inicio y selección de lección | Bien | Regular |
| 2 | Acceso docente | Bien | Regular |
| 3 | Validación del login | Regular | Regular |
| 4 | Anverso y trazos | Bien | Bien |
| 5 | Revelar pinyin | Bien | Bien |
| 6 | Reverso y significado | Bien | Regular |
| 7 | Composición de caracteres | Bien | Regular |
| 8 | Ejemplos y detalles | Regular | Mal |
| 9 | Valoración docente | Bien | Crítico |
| 10 | Navegación entre palabras | Bien | Regular |

## Riesgos de accesibilidad

- Los controles móviles menores a 44 px aumentan los errores de pulsación.
- El scroll anidado dificulta mantener contexto con ampliación y navegación táctil.
- La validación nativa del formulario puede aparecer en el idioma del navegador y no en el idioma de la interfaz.
- Las valoraciones usan color, emoji, texto y número; no dependen solo del color.
- La aplicación respeta `prefers-reduced-motion` y utiliza etiquetas accesibles en varios controles.

No se verificaron lector de pantalla, orden completo de foco, zoom al 200 % y 400 %, ni pronunciación del sintetizador en todos los navegadores. La auditoría identifica riesgos; no certifica cumplimiento WCAG.

## Prioridades acordadas por la auditoría

### P0

1. Cambiar la valoración móvil a una cuadrícula 2 por 2 con objetivos táctiles de al menos 44 px.
2. Corregir `认识`, `习惯`, `文化` y las generalizaciones culturales; validar el resultado con la profesora.

### P1

1. Mantener fija una cabecera compacta con palabra, pinyin y significado dentro del reverso.
2. Guardar fuente, autor, fecha e idioma revisado por cada dato curado.
3. Plegar el segundo idioma en móvil y mover los detalles a un acordeón breve o panel inferior.
4. Añadir una pregunta de comprobación por palabra antes de valorar.

### P2

1. Explicar la dinámica de la demo y repetir “Empezar clase” antes de la lista.
2. Usar dos columnas para composición y ejemplos cuando haya ancho suficiente.
3. Probar teclado, lector de pantalla, zoom y mensajes de error localizados.

## Evidencia y límites

- Viewports revisados: 390 × 844, 1366 × 768, 1440 × 900 y 1920 × 1080.
- Temas revisados: claro y oscuro.
- Pruebas visuales existentes: 8 de 8 aprobadas.
- No se modificó el código del producto durante esta auditoría.
- Las correcciones lingüísticas propuestas deben confirmarse con la profesora antes de marcar el contenido como revisado.


## Seguimiento (2026-10-11)

Correcciones de contenido aplicadas en `contenido/leccion-demo.json` y
sincronizadas con Supabase (`npm run db:sync-content`):

| Palabra | Aplicado |
|---|---|
| 家 | La nota del cerdo bajo techo pasa a "interpretación tradicional" y menciona la lectura de 豕 como pista fonética. |
| 认识 | Sin "solo" en el matiz; `认识你很高兴` → `很高兴认识你` (frase y nota cultural). |
| 东西 | `这个东西很好` → `这个东西多少钱？`. Se descartó `很好用`: `用` es HSK 3 y la palabra es HSK 1. |
| 知道 | Afirmación limitada a "en esta lección"; menciona `懂`. |
| 意思 | Nota de registro: `你是什么意思？` puede sonar a reclamo; alternativa `这是什么意思？`. |
| 觉得 | "Me parece que hoy hace un poco de frío." |
| 了解 | "Puedes conocer a alguien (认识) sin conocerlo a fondo (了解)." |
| 关心 | `吃饭了吗？` presentado como uso posible según región, edad y relación. |
| 习惯 | Sentido "hábito (de una persona)"; matiz con `风俗`/`风俗习惯`; `每个人都有自己的习惯`. |
| 文化 | Interpretación tradicional con fuente (《周易》: 观乎人文，以化成天下), sin "literalmente". |

Estructural: el trío 认识 / 知道 / 了解 va seguido en la lección (también en la
lección ya creada en Supabase).

**Pendiente:** validación nativa con la profesora; fuente, autor y estado de
revisión visibles por dato (P1); pregunta de comprobación por palabra (P1);
chino como idioma explicativo de la tarjeta; objetivo de aprendizaje
declarado de la lección.
