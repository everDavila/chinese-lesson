# Diagnóstico: modo clase y evaluación grupal

> 2026-10-10. Respuesta al documento "Evaluación arquitectónica: Modo clase y
> evaluación grupal". Sin implementación: solo diagnóstico y decisiones
> recomendadas. Base: [IDEA.md](IDEA.md) y [ARQUITECTURA.md](ARQUITECTURA.md).

## A. Estado actual

**No hay código.** El repo solo contiene documentación (README, AGENTS,
IDEA, ARQUITECTURA, BRIEF-DISENO, LECCIONES). Ninguna tecnología del stack
está instalada: ni Next.js, ni Tailwind, ni shadcn/ui, ni Supabase, ni
Hanzi Writer. No hay `package.json`.

Lo reutilizable es el **diseño ya decidido**:
- Modelo de datos de ARQUITECTURA.md §4: `User`, `Class`, `Word`, `Sense`,
  `Sentence`, `Lesson`, `Review`, `Revision`.
- Reglas de color y las dos propuestas visuales (BRIEF-DISENO.md).
- Decisiones de stack y despliegue (AGENTS.md, bitácora).

## Conflictos con lo ya decidido

1. **Cambia el foco del MVP.** Antes: práctica del alumno con enlace
   personal y semáforo por alumno. Ahora: enseñanza en clase, autoestudio
   secundario y **sin seguimiento individual**. Consecuencia: el enlace
   personal por alumno y `Review` individual salen del MVP (se mantienen en
   el modelo para el futuro). Choca con el deseo previo de "ver quién ha
   repasado": queda aplazado, no descartado.
2. **Se evalúa por palabra; debe ser por sentido.** Ya se decidió que 家
   (casa) y 家 (clasificador) se miden por separado. Todas las tablas nuevas
   apuntan a `Sense`, no a `Word`.
3. **Etiquetas inconsistentes.** El ejemplo "认识 → Difícil" usa una
   etiqueta que no existe en la escala (No la sé · Me costó · Bien · Fácil).
   La historia guarda la valoración y el color del semáforo, no adjetivos
   sueltos.
4. **Al semáforo le falta un estado.** Con pocas respuestas no hay señal: se
   añade ⚪ **"Sin datos suficientes"**.
5. **Excepción a "desktop-first":** la página de votación del alumno es
   **mobile-first**, porque el alumno vota desde el móvil que usa para Zoom.

## C. Modelo de datos

Se añaden 4 tablas; ninguna duplica entidades existentes.

```
lesson ──< class_session ──< evaluation >── sense
                 │                │
                 │                └──< vote (anónimo)
                 └──< teacher_rating >── sense
```

| Tabla | Campos | Notas |
|---|---|---|
| `class_session` | id, lesson_id, teacher_id, join_code, status (`active` / `ended`), started_at, ended_at, expected_students (opcional) | Una por clase dada. `join_code` corto (6 caracteres sin ambiguos: sin 0/O, 1/I) |
| `teacher_rating` | session_id, sense_id, rating (1–4), updated_at | **Única por (sesión, sentido)**: se hace upsert, así que se puede corregir durante la clase. Origen implícito: profesora |
| `evaluation` | id, session_id, sense_id, status (`open` / `closed`), opened_at, closed_at | Una "ronda" de votación. Permite reabrir la misma palabra sin mezclar rondas |
| `vote` | evaluation_id, voter_hash, rating (1–4), created_at, updated_at | **Única por (evaluación, voter_hash)**: el alumno puede cambiar su voto, pero no duplicarlo |

**Resultados agregados:** una **vista SQL**, no una tabla. Conteo por
valoración, total y participación por `(session_id, sense_id)`. Se
materializa solo si algún día va lento, cosa que no ocurrirá con clases de
10 a 30 alumnos.

**Valoración de la profesora y votos se separan por tabla**, no por un campo
`origen`: tienen cardinalidad distinta (1 frente a N) y restricciones
distintas. La vista los devuelve juntos pero etiquetados.

`Review` (individual) no se toca. Queda para el autoestudio futuro.

## D. Tiempo real

**No hace falta Supabase Realtime en el MVP.** Con 10–30 alumnos, el
**polling cada 2–3 segundos** (SWR o TanStack Query con `refetchInterval`)
es suficiente:
- Alumno: pregunta "¿hay evaluación abierta y de qué sentido?".
- Profesora: pide el agregado de la evaluación abierta.

Ventajas: todo pasa por rutas de servidor de Next.js, así que **los anónimos
no necesitan permisos de lectura en la base**. Con Realtime (Postgres
Changes) habría que abrir RLS a usuarios anónimos o montar canales Broadcast.

Se encapsula en un hook (`useActiveEvaluation`, `useEvaluationResults`)
para cambiar a **Realtime Broadcast** sin tocar la interfaz si la latencia
molesta. El plan gratis de Supabase incluye Realtime, así que el cambio no
cuesta dinero, solo complejidad.

## E. Seguridad

**Enlaces de sesión**
- URL `hanzi.davila.uno/v/K7M2QX` + el código visible en grande. Sirve sin
  QR: se pega en el chat de Zoom o se teclea.
- **Un solo código por sesión**, no por palabra. Caduca al terminar la
  sesión (`status = ended`) y como red de seguridad a las 4 horas.
- 6 caracteres de un alfabeto de ~30 dan ~700 millones de combinaciones. Es
  más que suficiente para algo que vive una hora; con límite de peticiones,
  adivinarlo por fuerza bruta no es realista.

**Acceso anónimo y votos duplicados**
- Al entrar, el servidor genera un token aleatorio y lo guarda en una
  **cookie httpOnly** de la sesión. En la base se guarda solo su hash
  (`voter_hash`): no hay nombre, IP ni dato personal.
- Restricción única `(evaluation_id, voter_hash)`: votar otra vez actualiza
  el voto en vez de sumarlo.

**Limitaciones honestas de lo anónimo:**
- Modo incógnito, otro navegador o borrar cookies = un voto nuevo.
- Bloquear por IP es peor que no bloquear: alumnos en la misma casa o
  detrás del mismo NAT quedarían fuera.
- **Mitigación realista:** mostrar a la profesora "8 votos / 7 alumnos
  esperados". Si los votos superan a los asistentes, se ve. Es una señal de
  comprensión, no un examen, y el diseño lo asume.

**Permisos de la profesora**
- Supabase Auth + RLS: cada profesora solo ve y modifica sus lecciones,
  sesiones, valoraciones y resultados.
- Los votos se escriben desde una ruta de servidor con la clave de servicio,
  después de validar que la sesión está activa y la evaluación abierta. Los
  anónimos nunca hablan directamente con la base.
- Límite de peticiones por cookie y por IP en el endpoint de voto.
- 2FA en la cuenta de administración (ver LECCIONES.md).

## Semáforo: reglas iniciales

Puntuación por voto: No la sé = 0 · Me costó = 1 · Bien = 2 · Fácil = 3.

**Votos de los alumnos** (por sentido y sesión):

| Estado | Regla |
|---|---|
| ⚪ Sin datos | Menos de 3 votos, o participación < 40 % de `expected_students` si se indicó |
| 🔴 Requiere refuerzo | ≥ 30 % "No la sé", **o** media < 1,2 |
| 🟢 Dominio aparente | ≥ 70 % "Bien" + "Fácil" **y** ≤ 10 % "No la sé" |
| 🟡 Necesita repaso | Todo lo demás |

**Valoración de la profesora:** No la sé → 🔴 · Me costó → 🟡 · Bien o
Fácil → 🟢.

**Si hay ambas:** se muestran las dos por separado y el color combinado es
**el peor de los dos**. Nunca se promedian. La razón: la facilidad percibida
no equivale a dominio, y sobreestimar es más caro que repasar de más.

**Histórico (fase 3):** se usa la sesión más reciente con datos y se muestra
la tendencia (🔴 → 🟡 → 🟢). Un 🟢 que lleva varias sesiones sin evaluarse
pasa a 🟡 "sin comprobar recientemente".

**Transparencia:** al pasar el ratón por un color se ve la regla aplicada y
los números ("5 de 8 votos: Bien o Fácil"). La etiqueta dice "dominio
**aparente**".

## F. Arquitectura de interfaz

**Rutas (App Router)**
```
app/
  (teacher)/                  layout con navegación
    lessons/[lessonId]/       vista normal: vocabulario, tarjetas, resultados
  (present)/                  layout sin navegación
    present/[sessionId]/      modo presentación
  v/[code]/                   votación del alumno (mobile-first, sin login)
```

**Componentes**
```
FlashCard            contenido puro, compartido por vista normal y presentación
  CardFront          hanzi + retícula + StrokeAnimator
  CardBack           referencia, pinyin, significados, SentenceList
StrokeAnimator       envoltorio cliente de Hanzi Writer
PresentationShell    pantalla completa, atajos, controles que se ocultan solos
TeacherControls      barra flotante: navegación, giro, traducciones
GroupAssessmentBar   pie del reverso: 4 botones + "Abrir votación" + mini resultados
VotePanel            página del alumno
```

**Respuestas a las consideraciones técnicas**

1. **Layout propio para presentación:** sí, con el grupo de rutas
   `(present)`. Así no carga navegación ni barras laterales.
2. **Estado compartido entre vista normal y presentación:** la posición
   (palabra actual y cara) va en la URL (`?w=3&side=back`), así sobrevive a
   recargas y se puede enlazar. El estado efímero (traducciones reveladas,
   animación) va en un store ligero de cliente (Zustand o `useReducer`).
3. **Fullscreen API:** sí, opcional, con la tecla F. El layout debe verse
   bien también sin ella, porque Zoom puede compartir una ventana normal.
4. **Estado al girar la tarjeta:** las dos caras permanecen montadas (giro
   por CSS) para no destruir Hanzi Writer ni perder lo revelado. La animación
   se pausa al girar.
5. **Hanzi Writer:** componente solo de cliente (`next/dynamic` con
   `ssr: false`), se crea en `useEffect` y se limpia al desmontar. Los datos
   de trazos se **autoalojan** (no CDN) y se precargan con la lección.
   Respeta `prefers-reduced-motion`.
6. **Hidratación:** todo lo que use `window`, pantalla completa,
   localStorage o Hanzi Writer, solo en cliente. El tema con `next-themes`
   (`suppressHydrationWarning` en `<html>`). Nada de fechas ni aleatorios
   calculados en el render del servidor.
7. **Evaluación sin sobrecargar la tarjeta:** una barra compacta y plegable
   al pie del reverso. Por defecto solo los 4 botones de la profesora; la
   votación y los resultados se despliegan si se abren.
8. **Separar controles de profesora del contenido:** en el MVP, controles
   discretos que se ocultan solos y se manejan con teclado. Una **vista de
   presentadora en dos ventanas** (una compartida, otra con controles,
   sincronizadas por `BroadcastChannel`) queda para la fase 3: es útil pero
   no imprescindible.
9. **Pérdida de conexión:** la lección completa (sentidos, frases, trazos)
   se precarga al iniciar la presentación, así que la presentación sigue
   funcionando sin red. Las valoraciones de la profesora se encolan en
   localStorage y se envían al reconectar. La votación online sí se detiene;
   un indicador lo avisa.
10. **Teclado y accesibilidad:** ← → palabra · Espacio girar · P reproducir
    o pausar · R repetir · T traducciones · 1–4 valoración · V votación ·
    F pantalla completa · Esc salir. Foco visible, `aria-live` para el
    conteo de votos, contraste AA en claro y oscuro.

**Resoluciones:** tamaño del hanzi con `clamp()` y unidades de viewport, y
tests de Playwright a 1366×768, 1440×900 y 1920×1080, en claro y oscuro
(como en Nimbus).

## G. Complejidad

| Funcionalidad | Complejidad | Riesgo principal |
|---|---|---|
| Andamiaje (Next, Tailwind, shadcn, Supabase, auth) | Baja | Ninguno serio |
| Modelo base + contenido de una lección real | **Media** | **Sin contenido no hay nada que presentar**: es la dependencia real del resto |
| Tarjeta con Hanzi Writer y radicales en color | Media | Colorear componentes requiere cruzar datos de Hanzi Writer con Make Me a Hanzi |
| Modo presentación + atajos | Media | Legibilidad tras la compresión de Zoom |
| Valoración manual de la profesora | Baja | — |
| Sesiones y código de acceso | Baja | — |
| Votación anónima con polling | Media | Duplicados: aceptado y mitigado |
| Realtime | Media | Solo si el polling no basta |
| Semáforo e histórico | Media | Reglas mal calibradas; se ajustan con datos reales |
| Funcionamiento sin conexión | Media | Sincronizar la cola sin duplicar |
| Vista de presentadora en dos ventanas | Alta | Sincronización entre ventanas |

## H. Plan de implementación (ajustado)

**Fase 0, base (nueva y necesaria).** Andamiaje, login de la profesora,
tablas `Word`, `Sense`, `Sentence`, `Lesson` y **una lección real con
contenido generado en sesión y revisado** (sin coste de API).

**Fase 1, presentar y valorar.** Modo presentación, tarjeta completa,
atajos, `class_session` (necesaria ya: la valoración manual se asocia a una
sesión) y `teacher_rating`. Semáforo simple con la valoración de la
profesora.

**Fase 2, votación.** `join_code`, página `/v/[code]`, `evaluation`,
`vote`, cookie anónima, polling y combinación de votos y valoración en el
semáforo.

**Fase 3, histórico y extras.** Evolución por sesión, caducidad del 🟢,
Realtime si hace falta, vista de presentadora en dos ventanas y modo sin
conexión completo.

**Después:** motor de contenido con IA, autoestudio del alumno y `Review`
individual.

## I. Recomendación final

- **Un solo Next.js** con tres grupos de rutas: profesora, presentación y
  votación. Sin microservicios ni backend aparte.
- **Supabase** para auth y Postgres; **sin Realtime** al empezar.
- **Polling** encapsulado en hooks; se cambia a Realtime solo si hace falta.
- **Votos anónimos** con cookie httpOnly + hash y restricción única,
  aceptando sus límites.
- **Agregados como vista SQL**, no como tabla.
- **Todo por sentido**, no por palabra.
- **Lo primero no es el modo presentación, es tener una lección real que
  presentar.**
