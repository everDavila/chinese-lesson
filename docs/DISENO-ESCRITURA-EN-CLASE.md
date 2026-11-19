# Diseño: Escritura en clase

> Estado: **diseño acordado con Ever (2026-11-18); fase 1 en construcción** en la
> rama `escritura-en-clase`. Decisiones en [DECISIONES.md](../DECISIONES.md).
> Antecedentes: votación de la clase ([DIAGNOSTICO-MODO-CLASE.md](../DIAGNOSTICO-MODO-CLASE.md)),
> escritura del alumno (`StrokeCells`) y [DISENO-AVANCE-ESTUDIANTE.md](DISENO-AVANCE-ESTUDIANTE.md).

## Para qué

Hoy, para que un alumno escriba un carácter en clase, la profesora le cede el
control de su PC y el ejercicio se pone lento: un alumno a la vez, con retraso.
Con **Escritura en clase** cada alumno escribe **en su propio dispositivo**
(celular o PC) y **todos a la vez**, y la profesora recibe el resultado en vivo
sin esperar turnos. El dedo ya se probó y funciona bien.

El nombre en pantalla es **«Escritura en clase»**.

## Cómo se usa

1. La profesora abre la clase como siempre y activa la clase en vivo (barra de
   arriba, tecla V). Los alumnos entran en `/v` con el código.
2. En la barra elige **Votar** o **Escritura en clase**. El cambio vale **desde la
   siguiente palabra**: la ronda abierta conserva su tipo.
3. Cada palabra que muestra abre una ronda. En modo escritura, el celular del
   alumno muestra el pinyin y las casillas de la palabra (un carácter por casilla).
   El alumno escribe; al terminar ve cómo le fue.
4. Bajo la tarjeta, la profesora ve en vivo quiénes terminaron y cómo les fue.

**Un ejercicio es una palabra completa** (todos sus caracteres). Cada ronda
guarda **una copia de los límites** con los que se abrió.

## Quién es cada alumno

Antes de su primera ronda de escritura el alumno elige cómo lo ve la profesora:

- **Con mi cuenta:** su nombre de la cuenta (solo si ya inició sesión).
- **Con un apodo:** el que escriba. Si dos alumnos eligen el mismo, el segundo
  queda como «Ana 2».

Lo recuerda el dispositivo. La profesora **solo ve a quienes entraron a su clase**.
Los resultados de clase **no se mezclan con el avance personal** del alumno
(`student_events`). Esto sustituye, para la escritura en clase, la decisión de
mantener todo lo en vivo anónimo (2025-10-25 y 2026-11-09).

La **votación** de 1 a 4 sigue anónima y no cambia.

## Qué se mide

Se guarda **el intento tal cual**; todo lo demás se calcula al leer (así una
fórmula puede cambiar sin perder datos).

Por carácter de la palabra:

- cuántos trazos tiene, cuántos completó bien, y **errores por trazo**;
- si se le mostró el carácter porque llegó al límite («se rindió» ese carácter).

Por intento: instantes de cada acción de trazo (para el tiempo activo), cuánto
tardó en el primer trazo, tiempo total, **dedo o ratón**, con guía o de memoria,
y si terminó. **Solo cuenta el primer intento de cada alumno por palabra** para la
clase; si repite para practicar, no suma.

### Precisión

**% de trazos acertados a la primera**: de los trazos de la palabra, cuántos no
tuvieron ningún error y se completaron. Va de 0 a 100. Un trazo cuenta como fallado
**una sola vez**, aunque falle varias; los trazos de un carácter que se mostró
cuentan como no acertados. Así 我 (7 trazos) y 认识 (9) se comparan sin cuentas y un
garabato no puede hundir la cifra más allá de 0 %.

### Tiempo

- **Duda:** hasta el primer trazo.
- **Tiempo activo:** suma de las pausas entre acciones, y **una pausa de más de
  20 s no se suma** (el alumno se distrajo). El tiempo de reloj se guarda aparte.

## Límites (configurables, se fijan al iniciar la palabra)

Son **por carácter** (hanzi), según sus trazos. La profesora los cambia antes de
abrir una palabra; no se cambian a mitad de ella. Valores iniciales:

| Trazos del carácter | Errores permitidos antes de mostrarlo |
|---|---|
| 1 a 2 | 3 |
| 3 a 4 | 5 |
| 5 a 6 | 7 |
| 7 a 8 | 9 |
| 9 a 10 | 10 |
| 11 a 12 | 11 |
| 13 a 16 | 13 |
| 17 a 20 | 15 |
| 21 o más | 18 |

Además:

- **Tope por trazo: 3 errores.** Al tercero el trazo se da por bueno y se
  dibuja (Hanzi Writer, `markStrokeCorrectAfterMisses`), y cuenta como fallado.
- **Umbral de «lo lograron»: 80 %** de trazos acertados a la primera.
- **Con guía** (calcar) o **de memoria**: lo elige la profesora.

Cuando un carácter llega a su límite se le **muestra** y el alumno sigue con el
siguiente. Los valores iniciales son una suposición razonable, no un dato:
revisarlos tras las primeras clases. La profesora guarda sus valores por defecto
en su navegador y se copian a cada palabra al abrirla. Validación: cada valor entre
1 y 60 y aviso si un tramo largo permite menos que uno corto.

## Estadísticas que ve la profesora

Según cuántos alumnos terminaron la palabra:

| Alumnos | Qué se muestra |
|---|---|
| **10 o más** | **«X de N lo lograron»** (los de 80 % o más), mediana de precisión y de tiempo activo, y el rango (menor a mayor) |
| **5 a 9** | Lo mismo y, además, **cada alumno** con su barra |
| **Menos de 5** | Solo **cada alumno**; sin mediana ni cifras de grupo |

Siempre el **n** («12 de 15») y, si la clase tiene alumnos esperados, «terminaron X
de Y esperados». La **mediana** es la cifra principal porque un alumno que juega no
la mueve; el promedio simple sí se deja arrastrar. Por alumno: precisión, tiempo
activo, duda, dispositivo y si se le mostró algún carácter.

## Datos (migración `20261118000000_escritura_en_clase.sql`)

- `class_sessions.live_mode` (`vote` | `write`) y `class_sessions.write_config`
  (los límites vigentes, editables por la profesora).
- `evaluations.kind` y `evaluations.write_config` (la copia al abrir la ronda).
- `session_participants`: quién entró (nombre, y su cuenta si eligió cuenta).
- `evaluation_writes`: un intento por alumno y ronda (el primero gana).
- Funciones para el alumno, sin sesión: `join_class`, `submit_student_write`, y
  `student_vote_state` ampliada con el tipo de ronda y sus límites. Validan que la
  clase esté activa y la ronda abierta, como `cast_student_vote`.
- RLS: la profesora lee solo lo de sus sesiones; nadie escribe desde el cliente.

## Fases

1. **Fase 1 (esta rama):** entrar con cuenta o apodo, ronda de escritura por
   palabra, precisión y tiempos, límites configurables, panel de la profesora.
2. **Fase 2:** **qué trazo falla el grupo**, marcado sobre el carácter que ya se
   anima en la pantalla de la profesora (sobre quienes llegaron a ese trazo);
   «necesita ayuda» (por debajo del grupo en 2 o más palabras seguidas); resumen
   al terminar la clase.
3. **Fase 3:** ejercicio **a su ritmo** (un conjunto de palabras, cada alumno
   avanza solo).

Fuera de alcance por ahora: coordenadas de los trazos (ver exactamente lo que
dibujó un alumno), la media recortada, que las rondas de escritura alimenten el
semáforo de la clase.

## Riesgos y pruebas

- **Sin probar con una clase real** ni con muchos dispositivos a la vez: se prueba
  con navegadores simulados y las funciones de la base con PGlite. La prueba con
  alumnos reales es de Ever.
- **El ratón falla más que el dedo:** se guarda el dispositivo y no se mezclan sin
  verlo.
- **La migración se aplica en producción antes de subir el código** (respaldo,
  `db push`, push): la corre Ever.
