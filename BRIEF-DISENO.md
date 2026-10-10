# Brief del proyecto: plataforma para aprender vocabulario chino en contexto

> Brief autocontenido para quien trabaje el diseño visual (persona u otro
> modelo de IA). Detalle completo en [IDEA.md](IDEA.md) y
> [ARQUITECTURA.md](ARQUITECTURA.md).

## Qué es
Una plataforma web para clases **online** de chino. La profesora escribe las
palabras de su lección y la plataforma genera sola la ficha de cada palabra:
- pinyin;
- significado;
- nivel HSK;
- descomposición en caracteres y radicales;
- animación del orden de los trazos;
- frases de ejemplo actuales del mismo nivel;
- una nota cultural.

Los alumnos practican con tarjetas, y la profesora ve un panel con las
palabras que más le cuestan al grupo, para reforzarlas en la próxima clase.

**El problema que resuelve:** hoy la profesora usa Quizlet. Sus tarjetas
tienen solo la palabra suelta (认识 → "conocer") y una imagen, sin contexto.
Así no se distinguen sinónimos aparentes (房子 frente a 家, "casa"), no se ven
usos distintos (家 también es clasificador: 一家公司) y no se entienden
partículas como 了 o 过. La propuesta es aprender **cada palabra dentro de
frases**, con una herramienta pensada específicamente para el chino y no
genérica.

## Usuarios
- **La profesora:** nativa china, habla inglés y algo de español. Su interfaz
  está en inglés o en chino. Comparte pantalla durante la clase.
- **Los alumnos:** hispanohablantes, de nivel principiante a intermedio
  (HSK 1 a 3). Su interfaz está en español.
- **Contenido trilingüe:** chino, español e inglés.

## Plataforma
- **Web, escritorio primero** (se usa compartiendo pantalla en clase).
  Responsive para móvil más adelante, y posiblemente PWA.
- **Stack:** Next.js, Tailwind CSS v4 y shadcn/ui (sobre Radix), iconos
  lucide. Supabase para datos y login.
- **Para que el diseño se pueda implementar:** definir la paleta como
  **tokens** (fondo, texto, acento, radical, parte fonética, 4 tonos,
  semáforo), cada uno en modo claro y oscuro, y partir de componentes tipo
  shadcn/ui (botones, tarjetas, diálogos, pestañas, tablas).

## Pantallas del MVP
**Profesora (con login)**
1. **Crear lección:** escribe las palabras, o en el futuro las elige de una
   lista HSK con selección múltiple.
2. **Revisar ficha:** ve lo que se generó automáticamente y lo aprueba o lo
   edita. Cada dato indica su origen: diccionario, IA o revisado por una
   persona.
3. **Panel de resultados:** un semáforo por palabra.
   - 🟢 ya la saben;
   - 🟡 repasar;
   - 🔴 reforzar mucho.

   Se puede filtrar por alumno.

**Alumno (entra con un enlace personal, sin contraseña)**

4. **Práctica con tarjetas.**
   - **Anverso:** la palabra en hanzi grande, separada en sus caracteres, con
     el **orden de trazos animado** mientras el alumno piensa. El **radical
     va en otro color** y se puede distinguir la parte de significado de la
     parte de sonido (认 = 讠 "hablar" + 人 rén "sonido"). Tiene botones para
     mostrar u ocultar el pinyin, para escuchar el audio y para pedir una
     pista, que es una frase con hueco (我 ___ 他。我们是朋友。).
   - **Reverso:** significado, pinyin, 2 o 3 frases de ejemplo con la palabra
     resaltada y su traducción, y una nota de matiz (认识 / 知道 / 去过).
   - **Valoración con 4 botones:** No la sé · Me costó · Bien · Fácil.
5. **Ficha ampliable de la palabra:** profundidad opcional para el alumno
   curioso. Incluye qué significa cada radical y en qué otros caracteres
   aparece, el origen e historia del carácter y una **nota cultural**, que es
   prioritaria. Por ejemplo, 东西 ("cosa") viene de "este + oeste", por los
   mercados del este y del oeste de la antigua Chang'an.

## Elementos visuales clave
- **Hanzi grandes** sobre una retícula de caligrafía (米字格 o 田字格).
- **Animación de trazos** con la librería Hanzi Writer.
- **Pinyin con marcas de tono** (ā á ǎ à). Los colores por tono son una
  opción.
- **Colores por componente:** radical y parte de sonido.
- **Semáforo** verde, amarillo y rojo en el panel.
- **Palabra resaltada** dentro de cada frase.
- **Contenido trilingüe** en una misma vista.

## Restricciones de diseño
- **Legible al compartir pantalla:** nada de decoración que compita con el
  carácter.
- **Colores que no choquen entre sí:** los del radical, los tonos y el
  semáforo tienen que distinguirse unos de otros y funcionar en modo claro y
  oscuro.
- **Clases cortas:** la tarjeta debe ser breve y la profundidad va en la
  ficha opcional.
- **Sencillo:** no competir con Quizlet en número de funciones.

## Dirección de estilo (abierta, por explorar)
Hay dos caminos y aún no se ha elegido:
- **A. Minimalista con acentos chinos.** Fondo color papel de arroz, texto en
  tinta casi negra, un único acento rojo de sello (印章) y la retícula de
  caligrafía detrás de los caracteres.
- **B. Más temático y "muy chino",** inspirado en apps de chino de estética
  oscura con dorado y crema, tipografía con serifa y texturas sutiles.

**Fuentes candidatas:**
- Noto Serif SC para los hanzi;
- Noto Sans SC para la interfaz;
- Inter o similar para el latín y el pinyin.

## Referencias que gustaron
- **Una app con "Word Inspector":** cada carácter con su etimología en una
  tarjeta, frase de ejemplo, dominio separado por habilidad (Recognition,
  Usage, Hearing, Writing) y enlaces a "Words with 东". Estilo oscuro, dorado
  y crema, con serifa.
- **Otra app (Learn, Practice, Cards, Reader):** listas HSK por frecuencia
  con selección múltiple y repaso con 4 botones que muestran el próximo
  intervalo (Forgot 1d · Shaky 1d · Good 3d · Easy 11d).
- **Hanzi University:** radicales en color durante la práctica.

## Qué se necesita
Propuestas visuales para las pantallas anteriores, empezando por la
**tarjeta de práctica** (anverso y reverso) y el **panel de la profesora**.
Explorar las dos direcciones de estilo, A y B, con paleta, tipografía y
componentes.

## Revisión de la primera propuesta (2026-10-10, tarjeta de 家)

Dirección A (papel de arroz, tinta, acento rojo). Se queda la base:
retícula 米字格, trazo actual en rojo y el siguiente en gris fantasma,
controles Pausar / velocidad / Repetir, significado en español e inglés,
palabra resaltada en las frases, audio por frase, "Más detalles" plegable.

**Idea nueva que se adopta:** traducciones de las frases ocultas por defecto;
se revelan cuando la profesora quiere.

**Hallazgo:** el diseño es en realidad un **modo clase** (la profesora
presenta). Hacen falta dos modos:
- **Modo clase:** la profesora controla los trazos, el giro y las
  traducciones. Sin valoración.
- **Modo práctica:** el alumno solo, con pista, pinyin ocultable y los 4
  botones de valoración.

**Para la siguiente iteración:**
1. **El rojo está sobrecargado:** trazo actual, palabra resaltada, iconos de
   audio y slider. Además chocará con el radical y con el rojo del semáforo.
   Reservar el rojo para una sola función; audio y slider en neutro;
   resaltado con otro token.
2. **Faltan:** radical en color y descomposición (家 = 宀 techo + 豕 cerdo),
   nivel HSK, mostrar/ocultar pinyin y audio en el anverso, botón de pista.
3. **Botones "Mostrar traducción" demasiado pesados:** dos bloques grises que
   ocupan media tarjeta. Mejor un enlace discreto por frase o un único
   interruptor "Traducciones".
4. **Contenido de ejemplo:** 我有一个幸福的家 usa 幸福 (no es HSK 1) y rompe
   la regla de nivel. Y las dos frases muestran el mismo uso; falta el de
   clasificador (一家公司), que era el argumento original del proyecto.
5. **Fondo de paisaje a tinta:** dejarlo muy sutil o quitarlo; al compartir
   pantalla comprimida se vuelve ruido.
6. **Corazón de favorito:** no está en los requisitos. Decidir si se queda
   (¿para quién: alumno o profesora?) o se quita.

## Revisión de la segunda propuesta (认识, botones, modo oscuro)

Se queda: radical y componente fonético separados con leyenda debajo
(讠 habla/lenguaje · 人 rén), etiqueta HSK, migas "HSK 1 · Lección 3 ·
Conociendo personas", 4 botones de valoración con **atajos de teclado
1–4** (muy bien para escritorio) y nota "sonido aproximado" en 只.

**Para la siguiente iteración:**
1. **Colores inconsistentes entre modos.** Claro: radical rojo, fonético
   gris. Oscuro: radical dorado, fonético verde. Un token = un significado
   en los dos modos (cambia el tono, no el papel).
2. **Coloreado incompleto:** en claro, 人 de 认 no tiene color de fonético y
   en 识 solo se colorea un trazo de 只. Colorear el componente entero,
   siempre.
3. **El rojo vuelve a chocar:** radical rojo y botón "No la sé" rojo. El
   radical necesita un color sin carga semántica de error (p. ej. azul tinta
   u ocre); el rojo/ámbar/verde queda para valoración y semáforo, con el
   mismo mapeo en ambos.
4. **Fondo del modo oscuro** (pagoda, luna, montañas): demasiado protagonista
   para compartir pantalla. Mismo criterio que el paisaje del modo claro.
5. **"Camino al Chino" y el logo 中** son inventados. El nombre está por
   decidir (dominio: `hanzi.davila.uno`).

## Decisiones de estilo (2026-10-10)
- **Base:** la del modo claro (papel de arroz, tinta) y la estructura del modo
  oscuro (migas de lección, cabecera). Ambos modos se mantienen.
- **Un color, un significado,** idéntico en claro y oscuro (solo cambia el
  tono):
  - **Radical: verde** suave.
  - **Palabra en contexto (resaltada en la frase): rojo / color fuerte.** Es
    el único uso del acento fuerte.
  - Componente fonético: color propio, por definir (ni verde ni rojo).
  - Valoración y semáforo: rojo / ámbar / verde / azul con el mismo mapeo.
    Ojo: el verde del radical y el verde de "Bien" no deben confundirse
    (tono distinto o usar el azul/otro para uno de los dos).
- **Sentidos múltiples** (ver IDEA.md, requisito 10): la tarjeta muestra el
  sentido de la lección destacado, los ya vistos como repaso breve y oculta
  los no vistos. Diseñar ese bloque.
- **Nombre:** se mantiene "hanzi" (`hanzi.davila.uno`); "Camino al Chino"
  queda descartado.

## Revisión de la tercera propuesta: modo profesora completo (6 paneles)

**Se adopta casi todo:** preparación con pasos (Palabras → Revisar contenido →
Lista final), anverso a pantalla completa con "Voltear tarjeta (Espacio)",
reverso con interruptores globales de pinyin y traducciones + nota cultural,
"Comprensión del grupo" al pie del reverso con 4 botones + "Abrir
votación", pantalla de QR + enlace, resultados con barras y porcentajes, y
barra de navegación inferior con selector de palabra y Anverso/Reverso.

**Para la siguiente iteración:**
1. **Preparación: falta elegir el sentido.** Cada fila necesita un selector
   de sentido (家 ① casa / ② clasificador), el nivel HSK y el estado del
   contenido (generado sin revisar / revisado). Es la pantalla donde se
   decide qué se enseña.
2. **El rojo sigue fuera de su sitio:** trazo actual en la animación, iconos
   de audio, papeleras, sello 家 decorativo y slider. Solo la palabra en
   contexto va en rojo. Papeleras en neutro (rojo solo al confirmar).
3. **Radical verde ausente** en el anverso (家 → 宀) y el verde de "Fácil"
   compite con él.
4. **Traducciones duplicadas:** interruptor global + botón por frase. Basta
   el interruptor global y clic en la frase para revelar una sola.
5. **Resultados:** añadir "12 respuestas / N alumnos esperados", el color del
   semáforo resultante con la regla aplicada y la etiqueta "dominio
   aparente".
6. **Votación:** mostrar el **código grande** además del QR (el alumno puede
   estar en Zoom desde su único móvil). Dominio real: `hanzi.davila.uno/v/…`.
   Falta diseñar la **pantalla del alumno** (móvil).
7. **Fondo de paisaje y sello:** siguen siendo ruido al compartir pantalla.
8. **Barra de navegación:** que se oculte sola en modo presentación y
   reaparezca al mover el ratón.

**Bien visto en el contenido:** 我家有三口人 es HSK 1 y de paso enseña 口
como clasificador de miembros de la familia.
