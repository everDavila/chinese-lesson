# Idea: vocabulario chino en contexto

> Resumen de las conversaciones del 2026-10-10. Es el punto de partida del
> proyecto; actualízalo a medida que la idea evolucione.

## Origen
Ever está aprendiendo chino en **clases online**. Su profesora usa **Quizlet**
con tarjetas de palabras sueltas:

- Delante: el hanzi (房子)
- Detrás: pinyin + significado (fángzi — casa)

Ever le propuso que las palabras se aprendan **en contexto**, no aisladas.

### Cómo son hoy sus tarjetas (ejemplo real: 认识)
- **Delante:** solo 认识, botón de audio y botón "Mostrar ejemplo".
- **Detrás:** "conocer (rènshi)" + foto de un apretón de manos + audio.

Lo bueno: tiene audio e imagen. Lo que falta:
- **"conocer" en español engaña.** 认识 es conocer a una persona
  (我认识他) o reconocer algo, como caracteres (我认识这个字). Pero "conocer
  un lugar" no es 认识, sino 去过 (我去过北京). Y 知道 es saber un dato
  (我知道他的名字). La tarjeta no permite distinguirlos.
- **La imagen fija un solo uso.** El apretón de manos solo sugiere "conocer
  a alguien" y oculta "reconocer caracteres", un uso muy común en clase.
- **El botón "Mostrar ejemplo" (bombilla) no da contexto:** solo es una
  pista con la primera letra de la respuesta ("c_____" → conocer). Refuerza
  la idea de traducir palabra por palabra, no la de usarla. Hoy las tarjetas
  no tienen ningún contexto.

## Argumentos de la propuesta
1. **El contexto distingue sinónimos aparentes.** 房子 y 家 aparecen las dos
   como "casa", pero:
   - **房子** = casa como edificio/propiedad → 我想租一间房子。(Quiero alquilar una casa.)
   - **家** = hogar/familia → 我回家。(Vuelvo a casa.)
2. **El contexto refuerza hanzi ya aprendidos.** Cada frase repasa caracteres
   de lecciones anteriores (我, 想, 回…) sin tarjetas extra.
3. **Una palabra puede tener varios usos.** 家 también es clasificador:
   一家公司 (una empresa), 一家餐厅 (un restaurante).
4. **El significado no siempre se deduce de los caracteres.**
   东西 = 东 (este) + 西 (oeste), pero significa "cosa".
5. **Los tonos cambian según el uso y el contexto.**
   - dōngxi (tono neutro) = cosa
   - dōngxī = este y oeste
   - 一 se pronuncia yī / yí / yì según la palabra siguiente.

   Una tarjeta suelta no muestra esto; una frase con audio, sí.

## Referencias: apps que ya lo hacen
Ever mostró capturas de una app con pantalla "Word Inspector". Por cada palabra
muestra:
- La palabra con pinyin, significado, nivel HSK y trazos.
- **Descomposición por carácter**, con etimología de cada uno
  (东: el sol 日 detrás de un árbol 木; 西: pájaro en su nido al atardecer).
- **Frase de ejemplo** con pinyin y traducción.
- **Dominio por habilidad**: Recognition, Usage, Hearing, Writing.
- Enlaces: "Sentences with this word", "Words with 东", "Words with 西",
  caracteres con el mismo radical (p. ej. 学 → 字, 存, 孙).

Fallos observados en esa app, que una herramienta revisable por la profesora
evitaría:
- Pinyin "dōngxī" para el significado "thing" (debería ser dōngxi).
- Traducción floja: 别问我这是什么东西！ aparece como "Don't ask me what it
  was" (mejor: "¡No me preguntes qué es esto!").

Dato práctico: **Quizlet admite texto libre en la definición**, así que la
profesora podría añadir frases sin cambiar de herramienta.

## Principios didácticos que encajan
1. Vocabulario en frases (la unidad es la frase, no la palabra).
2. Descomposición palabra → caracteres → radicales.
3. Habilidades medidas por separado (reconocer, usar, oír, escribir).
4. Repetición espaciada.
5. Input comprensible: frases con casi todo conocido y 1–2 palabras nuevas.
6. Tonos en contexto (sandhi, tono neutro).

## Propuesta de demo
- **Formato:** plataforma web (las clases son online: se comparte un enlace o
  la pantalla, sin instalar nada). No es una app nativa ni un negocio; es algo
  **demostrativo**.
- **Idea central:** la profesora introduce su lista de palabras y, para cada
  una, la plataforma muestra:
  1. La palabra completa con pinyin correcto y audio.
  2. Su descomposición en caracteres, enlazada con palabras ya vistas en clase.
  3. Varias frases de ejemplo (una por uso) con la palabra resaltada.
  4. Una nota de matiz cuando haga falta: falsos sinónimos, tonos que
     cambian, significados no deducibles.
- Las tarjetas tipo Quizlet serían solo un modo de práctica más.

## Requisitos propuestos (2026-10-10)

### Para el alumno (tarjetas)
1. **Pista = frase de ejemplo ya escrita**, no la primera letra de la
   traducción. Ej.: 我 ___ 他。我们是朋友。
2. **Mostrar / ocultar pinyin** a voluntad, en la palabra y en las frases.
3. **Frases incluidas de serie**: la profesora no tiene que escribirlas.
4. **Frases del mismo nivel que la palabra**: si la palabra es HSK 1, la
   frase solo usa vocabulario HSK 1 (o ya visto en clase); si es más
   avanzada, la frase puede serlo también.
5. **Valoración de dificultad graduada** por palabra al practicar (escala de 4: No la sé · Me costó · Bien · Fácil), además de registrar si acertó.

### Para la profesora (feedback)
6. **Panel de resultados** con semáforo por palabra (verde: ya la saben · amarillo: repasar · rojo: reforzar mucho), por grupo y por alumno. Muestra qué palabras le cuestan más al grupo y a cada
   alumno, para centrar la próxima clase en reforzarlas.

### Principios del producto
- **Sencillo.** Pocas funciones bien hechas; no competir con Quizlet en
  cantidad de opciones.
- **La profesora solo escribe la palabra.** Pinyin, significado, nivel,
  descomposición, frases y nota cultural se generan solos; ella solo revisa.
- **Ejemplos actuales.** Los libros traen ejemplos anticuados; las frases
  deben reflejar la China de hoy (WeChat, 外卖, 高铁, 扫码支付…).
- **Escritorio primero.** Se usa en clase online desde el ordenador; diseño
  pensado para pantalla grande y responsive (móvil) más adelante.
- **Toque cultural.** Una nota breve por palabra cuando aporte (costumbres,
  origen del carácter, uso real).

### Esbozo de arquitectura (sin stack decidido)
- **Roles:** profesora y alumno.
- **Datos:**
  - `Word`: hanzi, pinyin, significado, nivel HSK, caracteres que la forman.
  - `Sentence`: texto, pinyin, traducción, nivel (= nivel máximo de sus
    palabras), palabras que contiene.
  - `Deck` / lección: lista de palabras que asigna la profesora.
  - `Review`: alumno + palabra + valoración (fácil/difícil) + acierto + fecha.
- **Flujo:** profesora crea lección → alumnos practican y valoran → panel
  agrega los `Review` → profesora ve las palabras que más cuestan.
- **Origen de las frases (por decidir):** corpus existente con nivel HSK
  (p. ej. Tatoeba filtrado) o generadas por IA con revisión de la profesora.

## Preguntas abiertas
- ~~¿Para quién es la demo?~~ → Para la profesora de Ever: mostrarle la propuesta (Ever se pone en su lugar; él ha enseñado español a no hispanohablantes).
- Stack técnico: sin definir.
