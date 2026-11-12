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

## Descartado

Premium, límite de palabras y restaurar compras; XP total (los minutos activos
ya responden esa pregunta); comunidad (rompe el límite clase/autoestudio);
podcast (es producir contenido); «objetivo de aprendizaje: 6 veces» (lo
reemplaza la repetición espaciada); HSK 2.0 (solo 3.0); biblioteca de gramática
y lectura (Renshi es vocabulario en contexto; se reabre si Ever lo pide).

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
