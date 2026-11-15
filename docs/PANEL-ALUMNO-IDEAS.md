# Panel del alumno: ideas de otras apps y qué se hizo con ellas

> Estado a 2026-11-12. Ever pasó capturas de tres apps de estudio de chino y
> se decidió qué implementar, qué guardar y qué descartar. Lo ya construido
> está en producción; lo demás espera. Diseño de fondo:
> [DISENO-AVANCE-ESTUDIANTE.md](DISENO-AVANCE-ESTUDIANTE.md).

## Hecho (en `master` y en producción desde 2026-11-12)

- Rastreador por nivel HSK (`/estudiante/progreso`), vista de palabras y de puntos.
- Progreso por nivel HSK 1–7 en el inicio (7 = banda 7–9).
- Racha (actual, mejor, 7 días) cortando el día en hora de Lima (`APP_TIME_ZONE`).
- Meta diaria en minutos activos (`student_settings`).
- Favoritas (`student_bookmarks`) y modo `?repaso=favoritas`.
- Palabras difíciles como modo de repaso (`?repaso=dificiles`) y estrellas de dominio 0–3.
- Curvas de tono bajo el pinyin; mostrar significado y pinyin mientras escribe.
- Exportar el avance en JSON (`/estudiante/exportar`).
- Valoración de 4 botones (ya existía: columna `rating`).
- **Practicar con el material del sistema** (2026-11-12): `/estudiante` elige
  ejercicio, cantidad (10, 20 o 40) y fuente (nivel HSK o tema; los temas se
  agrupan por la nota de origen y las plantillas «Temario oficial» no salen,
  porque duplican los niveles).
- **Ejercicio «Estudiar» (tarjeta):** el hanzi se dibuja trazo a trazo, el alumno
  lo reconoce, muestra la respuesta (lecturas con frases) y se valora. Es la
  habilidad `recognize` (ejercicio `card`); «Escribir» (trazos) es la habilidad
  `write`. Cada una lleva su estado y su cola de repaso. «No me la preguntes
  más» saca la palabra de las dos.

## Guardado, para después

Orden propuesto: 1 es lo primero porque lo demás practica sobre ello.

1. **Colecciones de estudio del alumno** y lectura del catálogo (hoy difíciles,
   favoritas y repaso solo practican la lección de ejemplo). Tablas propias con
   RLS por `auth.uid()`; origen: catálogo HSK, lecciones públicas y compartidas.
   El alumno ya puede leer `words`, `senses` y `word_levels` (verificado en dev).
2. **Lista de hoy con cupo de nuevas** («40 nuevas, 0 a repasar»), conjunto del día fijo.
3. **Ficha de palabra:** radical en color, etiquetas (nivel, común, trazos), estado
   por habilidad, frases y palabras compuestas, notas propias.
4. **Ejercicios:** reconocimiento (significado o pinyin → hanzi), pinyin con
   distractores por tono, usar y oír. Ampliar la restricción `skill` de
   `student_events` y `student_word_state` (hoy solo `recognize` y `write`).
5. **Frases como tarjeta** (estado propio, tabla nueva) con filtros de largo y
   dificultad; **frases y palabras bloqueadas** hasta aprender las palabras que
   contienen. Falta comprobar si existe el índice frase→palabra.
6. **Escuchar y responder.** Falta comprobar el audio por frase.
7. Etimología (Make Me a Hanzi la trae; no sé si está cargada), curso en
   unidades de ~20 palabras, insignias por nivel (80 % dominadas), proyección
   «HSK 4 en X meses» (solo con ≥ 2 semanas de datos, como rango), días de
   gracia de la racha, caracteres parecidos (pares revisados a mano).
8. **Borrar cuenta y restablecer progreso.** Vercel no lleva la clave secreta:
   borrar el usuario de Auth pide una función de base de datos con permisos
   especiales.
9. Tutor de IA (costo por uso, clave en el servidor, privacidad) y vista de la
   docente sobre el avance (rompe el límite clase/autoestudio de 2026-10-25).
10. **Gramática ligada a las frases** (reabierta 2026-11-14, a pedido de Ever tras
    ver Hanzio): fichas de puntos como 了, 过, 的, enlazadas a las frases
    maestras, no un curso aparte. Parte del piloto `/lab/gramatica`.
11. **«Cómo funciona el chino»** (idea de Ever, 2026-11-14, tras ver ZXHanzi):
    apartado de capítulos de 3–5 min dentro de `/estudiante`. No es chat ni
    preguntas y respuestas: página de scroll con figura (forma antigua → actual),
    ejemplos tocables del catálogo y botón final «Practicar estos caracteres»
    que mete los caracteres en la cola de repaso. **El texto es el contenido
    principal** (no todos aprenden igual: hay quien lee mejor que ve video).
    Ever puede grabar un video corto por capítulo como **comentario
    complementario**, nunca como sustituto del texto. Escribir este contenido
    **no es problema** (esto lo separa del podcast descartado). **También lo ve
    la docente:** es una sección de contenido, no de avance, así que no rompe
    el límite clase/autoestudio; sirve para que explique desde ahí y diga a sus
    alumnos dónde encontrarlo. Falta decidir dónde vive (¿ruta pública o
    dentro de cada espacio?) y si la docente lo enlaza desde una lección. Orden: qué es un carácter, pictogramas,
    indicativos y compuestos, fonético-semánticos (el más útil), radicales,
    derivados y préstamos, cambio de forma. Piloto: fonético-semánticos.
    Datos: `data/characters.json` trae `etymology.type` de 3088 caracteres
    (1937 fonético-semánticos, 822 compuestos, 134 pictográficos, 195 sin dato),
    con pistas en inglés y sin revisar a mano. Faltan los tipos 指事, 转注 y 假借,
    y no se sabe si hay fuente para las formas antiguas.
12. **Colecciones por tipo de formación**, empezando por «Pictogramas»: los
    pictográficos revisados a mano que estén en HSK 1–3 (unos 40–50). La lista
    automática trae falsos pictogramas (了, 能, 再, 平, 世) y rarezas fuera de
    HSK (鼎, 豚, 卤, 丐). Va enlazada al capítulo de pictogramas.

## Descartado

Premium, límite de palabras y restaurar compras; XP total (los minutos activos
ya responden esa pregunta); comunidad (rompe el límite clase/autoestudio);
podcast (es producir contenido); «objetivo de aprendizaje: 6 veces» (lo
reemplaza la repetición espaciada); HSK 2.0 (solo 3.0); lectura con historias
(es producir contenido; ver Hanzio abajo; la etimología sí, ver «Guardado» 11). La biblioteca de gramática se
reabrió el 2026-11-14: ver «Guardado» 10.

## Ventaja a cuidar

Ninguna de las tres apps dice **por qué** falla una palabra. Renshi guarda qué
trazo falla, cuánto duda y cuánto cuesta cada palabra. No diluirlo.

## Límites conocidos del panel

- La zona horaria de la racha es una constante; si entra alguien fuera de
  Latinoamérica, pasa a ser un ajuste.
- Al estrenar las opciones de pinyin y significado, los ajustes de tarjeta
  guardados en el dispositivo vuelven a los valores por defecto una vez.
- Sin probar en navegador: contraste, el rastreador del nivel 7 (~5600 casillas)
  y el cableado de meta, corazón y exportar desde la interfaz.
- Las cuentas de alumno de dev (`xuesheng`) no existen en producción: se crean
  con `npm run db:crear-usuario -- --rol student` apuntando a producción.

## Cuarta app: Hanzio (2026-11-14)

Ever pasó capturas de Hanzio (perfil, audio, preferencias, plan, diccionario,
social, sesión, inicio). Contrastado con lo que ya hay en `master`. Esfuerzo y
beneficio de 1 a 5; ordenado de más fácil a más difícil. Esfuerzo estimado sin
leer el código de cada pantalla.

**Ya lo tenemos (no hacer nada):** cuenta del alumno, repetición espaciada
(`src/lib/srs.ts`), valoración de 4 botones, racha, meta diaria en minutos,
favoritas, palabras difíciles, curvas de tono, exportar avance, progreso por
nivel HSK, práctica por nivel o tema con 10/20/40 palabras.

| # | Qué | Esfuerzo | Beneficio | Nota |
|---|---|:-:|:-:|---|
| 1 | Velocidad del audio (0.6x, 0.8x, 1x) | 1 | 4 | `speakChinese` ya recibe `rate` (0.8 fijo); falta el ajuste del alumno en `student_settings`. |
| 2 | Colores por tono en el pinyin | 2 | 5 | Hay curvas de tono, no colores. Falta verificar cómo se combinan con las curvas. |
| 3 | Sonido y vibración (interruptores) | 1 | 2 | Solo si se agregan efectos. |
| 4 | «Mantener aciertos al reintentar» | 2 | 3 | Filtro sobre la cola de reintento. |
| 5 | Ordenar y filtrar (frecuencia, alfabético, precisión) | 2 | 3 | Útil con el rastreador de niveles grandes. |
| 6 | Insignia de frecuencia en la tarjeta | 2 | 3 | Datos de nivel HSK ya cargados. |
| 7 | Días de descanso que no rompen la racha | 3 | 4 | Equivale a los «días de gracia» ya guardados abajo. |
| 8 | Precisión por habilidad en el perfil | 3 | 4 | Hoy solo hay `recognize` y `write`; con más habilidades gana valor. |
| 9 | «Aprenderás ~N palabras/semana» según la meta | 3 | 3 | Aritmética sobre la meta diaria. |
| 10 | Pausar palabras nuevas (solo repaso) | 3 | 3 | Depende de la «lista de hoy con cupo» (guardado 2). |
| 11 | Sesión por minutos con nivel de esfuerzo | 3 | 4 | La meta ya está en minutos activos; falta armar la cola por tiempo. |
| 12 | Pinyin con botones de tono y repaso «solo tonos» | 3 | 4 | Encaja con el ejercicio de pinyin con distractores (guardado 4). |
| 13 | Gráfico de progreso con proyección | 4 | 3 | Ya guardado (7): solo con ≥ 2 semanas de datos. Hanzio lo muestra confuso. |
| 14 | Búsqueda por cámara o por trazo | 5 | 3 | OCR o reconocimiento de escritura. |

**Descartado de Hanzio:** XP y niveles (ya descartado), amigos y clasificación
(rompe el límite clase/autoestudio), planes de pago, HSK 2.0, tradicional.

**Qué copiar de su perfil:** un buen estado vacío. Su pantalla muestra «--» en
precisión y un gráfico ilegible cuando hay pocos datos.

### Funciones premium de Hanzio (dicho por Ever; no salen en las capturas)

Gramática, historias y funciones de IA. No las verifiqué en la app.

| Función | Estado en Renshi | Esfuerzo | Beneficio | Decisión |
|---|---|:-:|:-:|---|
| Gramática | Piloto `/lab/gramatica` (12 puntos HSK 1) | 4 | 4 | Reabierta: fichas ligadas a frases, no curso (Guardado 10). |
| Historias (lectura) | No hay | 4 | 3 | Descartada: es producir contenido. Alternativa barata: mini lecturas con frases maestras. |
| IA (tutor, corrección) | Guardada (Guardado 9) | 5 | 4 | Para después. Primer paso acotado: «explícame por qué falla esta frase». |
