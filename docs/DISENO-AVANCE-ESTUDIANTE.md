# Diseño: cuenta y avance del estudiante

> Estado: **diseño acordado con Ever (2026-11-09), sin implementar**. No hay
> migración, ni código, ni rama. Decisiones en [DECISIONES.md](../DECISIONES.md).
> Antecedente: tarjeta del alumno en la rama `estudiante-tarjeta`
> (`/lab/estudiante`), cuyo `PracticeRecord` vive hoy en `localStorage`.

## Objetivo

Que el alumno vea **qué le cuesta y qué hacer para mejorarlo**, y que la app
decida qué repasar hoy. No es un panel de gráficas: es diagnóstico con acción.

## Cuenta

- **Opcional.** Sin cuenta todo sigue igual (avance en el dispositivo). Con
  cuenta, el avance se guarda y se sigue en cualquier dispositivo.
- Al crearla, lo que ya había en `localStorage` se **sube una sola vez**.
- Acceso por **enlace mágico** al correo (sin contraseña).
- Rol nuevo `student` en `profiles.role` (hoy: `teacher`, `reviewer`, `admin`).
  Sin acceso a nada del docente; RLS por `auth.uid()`, solo sus filas.
- Primeros usuarios: Ever con un **segundo correo** (cuenta limpia, no la de
  admin) y una persona cercana. Alumnos actuales, todos adultos.
- La votación y el quiz en vivo siguen **anónimos**. No se cruzan con la cuenta.

## Principio: guardar eventos, no resúmenes

Un promedio no se reconstruye; un evento sí. Los eventos son **append-only**
y se conservan **para siempre** (por ahora). Todo lo demás se deriva y se puede
recalcular si cambia una fórmula.

## Esquema propuesto

**`student_events`** (solo inserciones):

| Campo | Contenido |
|---|---|
| `id`, `student_id`, `session_id`, `at` | identidad y momento |
| `sense_id` | la palabra (siempre por sentido) |
| `skill` | `recognize` o `write`: se siguen **por separado** |
| `exercise` | tipo de ejercicio |
| `outcome` | acierto, error, se rindió, «ya la sé» |
| `chosen`, `correct` | lo elegido y la respuesta; da el mapa de confusiones |
| `mistakes`, `strokes_total`, `failed_strokes int[]` | detalle de escritura; sin coordenadas |
| `used_help` | si usó guía o ayuda |
| `ms_to_first_action`, `ms_total` | cuánto duda y cuánto cuesta |

**`student_sessions`:** `started_at`, `ended_at`, `active_ms`.

**`student_word_state`** (derivado, reconstruible desde eventos): por alumno,
palabra y habilidad: `stage`, `due_at`, `interval`, `last_outcome`. Es lo que
lee la cola diaria.

**`student_known_flags`:** «ya la sé» o «no me la preguntes más», con fecha.

## Tiempo

- **Conexión:** de apertura a cierre. Engañosa (pestañas olvidadas).
- **Activo (el útil):** cuenta solo con interacción. **Corte de inactividad:
  3 minutos.** Pasados, la sesión de tiempo activo se cierra en el último
  evento y esa espera no se suma.
- Por palabra: tiempo hasta la primera acción («cuánto duda») y hasta terminar
  («cuánto cuesta»).
- Como los eventos llevan marca de tiempo, `active_ms` se recalcula con otro
  umbral sin perder datos.

## Etapas y repetición espaciada

- Etapas: **vista**, **frágil**, **dominada**; más **descartada** («no me la
  preguntes»). Una palabra acertada una vez no está dominada.
- **«Ya la sé»** la saca de la cola diaria, pero hay **chequeo esporádico**: de
  vez en cuando, con intervalos cada vez más largos, aparece una sola vez como
  comprobación. Acertarla alarga el intervalo; fallarla la devuelve a la cola
  y se lo dice sin drama.
- «No me la preguntes más» la excluye del todo.
- Reconocer y escribir llevan etapa e intervalo cada uno.

## Diagnóstico y acción

| Señal | Qué hacer |
|---|---|
| Falla escribiendo, acierta reconociendo | Practicar los trazos de esa palabra |
| Confunde dos caracteres parecidos | Ejercicio de contraste entre ambos |
| Falla el tono | Ejercicio de pinyin con distractores por tono |
| Falla un componente repetido (p. ej. 辶) | Repasar ese radical |
| Responde lento | Más repeticiones cortas |

También: nº de trazos contra errores, trazo que más falla, constancia y hora en
que rinde mejor, tiempo hasta olvidar una palabra.

## Ejercicios (en este orden)

1. Práctica de trazos (ya existe en el piloto).
2. Reconocimiento: significado o pinyin → elegir hanzi.
3. Pinyin con distractores por tono.
4. **Caracteres parecidos** (no es prioridad; puede ir después). Con `chosen` y
   `correct` ya en los eventos, se añade **sin migrar**. `characters` tiene
   `radical`, `decomposition` y `components` para un borrador de pares por
   componentes compartidos; no existe una tabla de pares confundibles y la
   lista automática se revisa a mano, porque un par malo enseña mal.
5. Escuchar y elegir; completar el componente; frase con hueco.

## Fuera de alcance por ahora

- Vista de la docente sobre el avance de los alumnos: rompe el límite
  clase/autoestudio (2026-10-25). Decidir aparte.
- Privacidad con más usuarios: **borrar cuenta y eventos** queda pendiente.
- Coordenadas de trazos.

## Orden de trabajo

1. Esquema y migración (este diseño), probado en `hanzi-dev`.
2. Tarjeta con `/l/<código>` y lección real, usando `localStorage`.
3. Capa de cuenta: auth por enlace mágico, subida única, escritura de eventos.
4. Cola diaria y diagnóstico.
5. Ejercicios nuevos.

## Riesgos

- Es el primer dato de personas en la base: auth, RLS y borrado importan.
- Medir mucho cuesta código y pruebas: no añadir campos sin una pregunta que
  respondan.
- El tiempo sin contexto engaña: comparar contra uno mismo, no contra otros.
- Sin verificar: configuración del auth de Supabase en `hanzi-dev` y producción.
