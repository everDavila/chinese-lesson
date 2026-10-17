# Ideas por contrastar

Ideas y hallazgos que todavía no son decisión. Cada una dice qué habría que
comprobar antes de hacerla. Cuando se decida, pasa a la bitácora de
`AGENTS.md` (y sale de aquí). Última revisión: 2026-10-11.

## Contenido

| Idea / hallazgo | Por qué | Qué contrastar antes |
|---|---|---|
| **Significado en español de los sentidos** | Solo 15 de 1005 lo tienen; en clase la línea grande del significado sale vacía y solo se ve el inglés. La carga de Codex hace frases, no significados. | Si lo hace Codex (borrador IA, `unreviewed`) o Ever desde `/admin`; empezar por HSK 1. |
| **Datos de los 655 caracteres** (componentes, radical, trazos) | Solo 19 tienen datos: fuera de la lección de demo no hay "Cómo se forma" ni animación de trazos. | Importar de Make Me a Hanzi (LGPL) y hanzi-writer-data (Arphic) como ya se hizo con la demo; peso de los trazos (≈1–2 KB por carácter, ~1 MB en total) y licencias en `data/README.md`. |
| **Nombre tradicional del radical** (讠 = 言字旁, 氵 = 三点水, 口 = 口字旁) | Desde el 2026-10-11 la fórmula muestra solo piezas y su pinyin, sin glosas (decisión de Ever); el nombre es como lo dice una profesora china. | Fuente de los nombres para los 214 radicales y sus variantes; si se muestra siempre o al pasar el cursor. `contenido/componentes.json` (13 significados) queda sin uso en la tarjeta. |
| **Significado del carácter suelto** (知 = "saber") en "Cómo se forma" | Idea de Ever: ver qué aporta cada carácter de la palabra. | La base no guarda significado por carácter; saber de dónde sacarlo (Make Me a Hanzi trae `definition` en inglés) y si recarga la tarjeta. |
| **Atribución de las frases y nota por colección HSK** (Tatoeba CC BY 2.0 FR, Gushi CC BY-SA 4.0) | 1211 frases vienen de esas fuentes; ambas licencias exigen atribución y BY-SA pide compartir igual. Hoy cada fila solo dice `open_data`, así que no se puede asegurar cuál de las dos aportó una frase concreta. | Guardar fuente e id por frase en la base (hoy `sentences` no tiene esas columnas). Mientras se completa, mostrar en cada colección HSK una nota enlazada: temario oficial `cti-hsk3-2026`; ejemplos adaptados de Gushi y Tatoeba, con sus licencias. Definir si la nota va en la cabecera, el pie o una página común de créditos, sin atribuir individualmente lo que la base no demuestra. |
| **Frases de HSK 3** | Codex va por HSK 3: 5 de 492 sentidos con frases; trabajo sin commit en su carpeta. | Que termine y se revise con el mismo validador de nivel. |
| **Colección "Básico 1"** | La lista del libro de la profesora (lecciones 1–4) como colección de demo. | Esperar a que la base esté poblada (Ever avisa: "ya está poblado HSK 3"). |
| **Pictogramas de origen** (oracular, bronce, sello) | Forma antigua de cada carácter en el reverso. | Fuente de imágenes y licencia (Wikimedia, falta OK de Ever). |

## Interfaz

| Idea | Por qué | Qué contrastar antes |
|---|---|---|
| **Crear colección / lección: botón, no campo suelto** (mala UX, señalada por Ever) | El campo de nombre arriba de la lista parece un buscador ("demo" + Crear confunde). Igual en "Añadir lección" y en plantillas del admin. | Buenas prácticas (Material, Apple HIG, Nielsen): botón principal "+ Nueva colección" que abre el campo con etiqueta visible, Crear y Cancelar; el estado vacío repite el botón; un buscador, si lo hay, con lupa y "Buscar…". Hacerlo en `NewTitleForm` (`src/components/manage/shell.tsx`). |
| **Pinyin y significado de la cabecera un punto más chicos en celular** | Los hanzi ya bajaron; "zhīdào" (32 px) y el significado (24 px) siguen grandes. | Ver capturas en 390 px con palabras de significado largo. |
| **Renombrar "Sentido"** a "Uso" o "Significado" | "Sentido" no se entiende a la primera. | Decisión de Ever; cambia textos zh/es/en. |
| **Fijar una frase preferida** para que salga siempre | Complemento de la rotación de frases. | Si la docente lo necesita de verdad tras probar la rotación. |
| **Pedir palabras al admin** desde "Pegar lista" | Hoy una palabra fuera del catálogo solo sale tachada. | Tabla de peticiones y bandeja en `/admin`. |

## Autoestudio del alumno (propuestas de Ever, 2026-10-13)

Ambas propuestas están **pendientes de evaluación y diseño**, no aprobadas
para el MVP. Pertenecen al módulo de autoestudio del alumno, separado del modo
clase de la profesora. Su integración con repetición espaciada se estudiará
posteriormente. Esta entrada conserva las ideas; no inicia su implementación.

### Evaluación de escritura de hanzi en dos modalidades

El modelo conceptual distingue:

- **Escritura guiada:** el alumno ve el hanzi como plantilla de fondo y
  reproduce sus trazos con el dedo sobre la pantalla, en el orden correcto.
- **Escritura libre:** el alumno escribe el carácter desde cero, sin plantilla
  visual, para comprobar si lo recuerda.

**Objetivo pedagógico:** diferenciar la capacidad de reproducir los trazos con
ayuda de la capacidad de recordar y escribir el carácter de memoria. Los
resultados de cada modalidad podrían servir para evaluar el dominio de
escritura y alimentar posteriormente un algoritmo de repetición espaciada,
como FSRS.

**Antecedente registrado:** la rama experimental `prueba-escritura`, anotada
en `TRABAJO-EN-CURSO.md`, explora calcar o escribir de memoria con Hanzi Writer.
La evaluación del dominio y su integración con autoestudio siguen siendo
propuestas por diseñar.

**Qué contrastar antes:** qué se considera un resultado correcto en cada
modalidad (trazos, orden, forma, ayudas y reintentos), cómo mantener separados
ambos resultados y qué señales serían apropiadas para repetición espaciada.
También queda pendiente comprobar el uso real con el dedo y la tolerancia de
la evaluación, como indica el registro del experimento.

### Producción de frases en chino a partir del español o inglés

El alumno recibe una frase en español o inglés y escribe su equivalente en
chino, mediante teclado chino o escritura manual.

Ejemplo:

- Frase presentada: «Hoy estoy muy ocupado».
- Una respuesta válida: 我今天很忙。
- Pinyin de referencia: Wǒ jīntiān hěn máng.

**Objetivo pedagógico:** evaluar la recuperación de vocabulario, la
construcción de oraciones y el uso correcto de expresiones en contexto,
además del reconocimiento. Debe decidirse cuándo mostrar el pinyin de
referencia para que la práctica permita evaluar la recuperación del alumno.

**Qué contrastar antes:** una frase puede tener varias traducciones correctas.
Hay que definir una validación que admita alternativas y no dependa solo de
coincidencias exactas, así como el tratamiento de respuestas parcialmente
correctas y la devolución al alumno. Si se permite escritura manual, también
hay que estudiar cómo interpretar lo escrito y distinguir los errores de
reconocimiento de los errores de idioma. Su posible conexión con repetición
espaciada queda pendiente de evaluación.

## Técnico

| Idea | Por qué | Qué contrastar antes |
|---|---|---|
| **Límite de peticiones en la votación** | Las funciones de voto son públicas; alguien podría inundar una clase. | Con 10–30 alumnos el riesgo es bajo; un límite por IP en la acción del servidor o en Vercel. |
| **Pasar la votación a Realtime** | El sondeo cada 2,5 s basta para 30 alumnos. | Solo si la latencia molesta en clase real. |
