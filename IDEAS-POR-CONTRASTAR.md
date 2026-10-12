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
| **Atribución de las frases** (Tatoeba CC BY 2.0 FR, Gushi CC BY-SA 4.0) | 1211 frases vienen de ahí; ambas licencias exigen atribución y BY-SA pide compartir igual. | Guardar fuente e id por frase en la base (hoy `sentences` no tiene esa columna) y mostrar créditos (página o pie). |
| **Frases de HSK 3** | Codex va por HSK 3: 5 de 492 sentidos con frases; trabajo sin commit en su carpeta. | Que termine y se revise con el mismo validador de nivel. |
| **Colección "Básico 1"** | La lista del libro de la profesora (lecciones 1–4) como colección de demo. | Esperar a que la base esté poblada (Ever avisa: "ya está poblado HSK 3"). |
| **Pictogramas de origen** (oracular, bronce, sello) | Forma antigua de cada carácter en el reverso. | Fuente de imágenes y licencia (Wikimedia, falta OK de Ever). |

## Interfaz

| Idea | Por qué | Qué contrastar antes |
|---|---|---|
| **La mascota de RenShi sigue con la mirada el ingreso del código del alumno** | Al pedir el código de acceso, sus ojos acompañan la casilla o el dígito activo. Da presencia al personaje y hace que el acceso se sienta parte de la experiencia, no un formulario pegado encima. | Probar que la mirada se entienda en móvil y escritorio, que no distraiga ni revele el código, y ofrecer una versión estática cuando el dispositivo solicite movimiento reducido. |
| **Crear colección / lección: botón, no campo suelto** (mala UX, señalada por Ever) | El campo de nombre arriba de la lista parece un buscador ("demo" + Crear confunde). Igual en "Añadir lección" y en plantillas del admin. | Buenas prácticas (Material, Apple HIG, Nielsen): botón principal "+ Nueva colección" que abre el campo con etiqueta visible, Crear y Cancelar; el estado vacío repite el botón; un buscador, si lo hay, con lupa y "Buscar…". Hacerlo en `NewTitleForm` (`src/components/manage/shell.tsx`). |
| **Pinyin y significado de la cabecera un punto más chicos en celular** | Los hanzi ya bajaron; "zhīdào" (32 px) y el significado (24 px) siguen grandes. | Ver capturas en 390 px con palabras de significado largo. |
| **Renombrar "Sentido"** a "Uso" o "Significado" | "Sentido" no se entiende a la primera. | Decisión de Ever; cambia textos zh/es/en. |
| **Fijar una frase preferida** para que salga siempre | Complemento de la rotación de frases. | Si la docente lo necesita de verdad tras probar la rotación. |
| **Pedir palabras al admin** desde "Pegar lista" | Hoy una palabra fuera del catálogo solo sale tachada. | Tabla de peticiones y bandeja en `/admin`. |

## Técnico

| Idea | Por qué | Qué contrastar antes |
|---|---|---|
| **Límite de peticiones en la votación** | Las funciones de voto son públicas; alguien podría inundar una clase. | Con 10–30 alumnos el riesgo es bajo; un límite por IP en la acción del servidor o en Vercel. |
| **Pasar la votación a Realtime** | El sondeo cada 2,5 s basta para 30 alumnos. | Solo si la latencia molesta en clase real. |
