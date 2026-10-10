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
