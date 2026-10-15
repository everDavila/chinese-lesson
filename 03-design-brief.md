# Brief de diseño — Renshi

> Estado: dirección visual y de interacción vigente al 2026-10-15. Sustituye como resumen operativo las exploraciones históricas de `BRIEF-DISENO.md`; ese archivo conserva el proceso y las revisiones.

## 1. Encargo

Diseñar y mantener una experiencia web para que una docente enseñe vocabulario chino en contexto durante una videollamada, mientras el alumnado participa desde su teléfono. La interfaz debe hacer visible la riqueza del chino sin convertir la clase en un panel de administración ni en una enciclopedia.

El producto se llama **Renshi (认识)**: conocer, reconocer. La marca no debe presentarse como una app infantil ni como una plataforma escolar corporativa. Es una herramienta sobria, cálida y especializada.

## 2. Audiencias y contextos

### Docente en clase

- Usa laptop o monitor, normalmente compartiendo pantalla por Zoom.
- Necesita controles inequívocos y un ritmo estable.
- Alterna explicación oral, revelación de información y participación.
- La compresión de video reduce contraste y vuelve ruido cualquier decoración fina.

### Docente preparando

- Trabaja en escritorio, con tablas, formularios y listas más densas.
- Necesita entender qué pertenece a su colección, qué viene de la base y qué está listo para clase.
- Hace cambios pequeños y frecuentes; debe ser difícil perderlos o borrar por accidente.

### Alumno votando

- Usa un teléfono, a veces el mismo dispositivo desde el que sigue Zoom.
- Tiene pocos segundos para entrar y responder.
- Puede tener red inestable.
- No debe leer instrucciones largas ni crear una cuenta.

### Administrador curando

- Trabaja en escritorio y compara contenido trilingüe.
- Necesita densidad controlada, trazabilidad, vista previa y prevención de cambios accidentales.

## 3. Objetivos de diseño

1. El hanzi y el contexto dominan la jerarquía de la clase.
2. La docente siempre entiende qué se revelará, qué se guardó y qué controla a los alumnos.
3. El alumno entra y vota con una mano y sin explicación externa.
4. La profundidad lingüística aparece por capas, no toda a la vez.
5. La identidad visual se reconoce en claro y oscuro sin cambiar el significado de los colores.
6. La interfaz sigue siendo legible tras compartir pantalla y comprimir video.

## 4. Principios de experiencia

### Un escenario, no un dashboard

En modo clase la palabra es la protagonista. Navegación, ajustes y resultados acompañan, pero no compiten. La presentación no debe parecer el editor de la docente.

### Revelación progresiva

Secuencia recomendada:

1. reconocer el hanzi y observar trazos;
2. revelar pinyin si hace falta;
3. girar y explicar significado;
4. explorar composición;
5. leer frases;
6. revelar traducción, matiz o cultura;
7. valorar y votar.

No todos los pasos son obligatorios para cada palabra.

### Ausencia honesta

Si falta un enriquecimiento:

- sin trazos: mostrar el hanzi, no un error;
- sin descomposición completa: ocultar el bloque;
- sin frase: proponer «Inventen una frase con…»;
- sin nota cultural: no reservar espacio vacío;
- sin votos: mostrar «Pocos datos» o espera, no un semáforo concluyente.

### Una acción primaria por momento

En el alumno: introducir código o votar. En la clase: girar, revelar o continuar. En el editor: guardar. Las acciones secundarias se agrupan o bajan de énfasis.

## 5. Arquitectura de la interfaz

### 5.1 Preparación docente

La navegación expresa la jerarquía real:

`Colección → Lección → Sentido → Ejemplos`

Patrones:

- migas y título persistente para no perder contexto;
- listas reordenables mediante acciones explícitas, no drag-and-drop obligatorio;
- búsqueda con etiqueta y lupa, distinta visualmente de «Nueva colección»;
- estados vacíos que repiten la acción principal;
- selección múltiple para añadir vocabulario;
- edición de ejemplos separada del contenido global.

Pendiente de rediseño: los formularios de creación visibles por defecto deben pasar a botones «Nueva colección» y «Nueva lección» que abran un formulario con Crear/Cancelar.

### 5.2 Modo clase

Dos caras y una barra de control:

- **Anverso:** hanzi, retícula, trazo animado, pinyin a demanda y controles mínimos.
- **Reverso:** significado, composición, ejemplos, matiz/cultura y valoración.
- **Barra de clase:** progreso, anterior/siguiente, cara actual, código y estado de votación.

La cabecera compacta con hanzi, pinyin y significado aparece cuando el reverso se desplaza, para conservar la referencia. Desde pantallas anchas, composición y ejemplos pueden usar dos columnas; en móvil se apilan.

### 5.3 Votación móvil

El panda funciona como guía de estado, no como decoración permanente:

- neutro al pedir código;
- confundido ante código inválido;
- satisfecho al validar;
- discreto durante la votación.

La palabra actual y cuatro opciones en cuadrícula 2×2 ocupan la mayor parte de la vista. Los estados de espera, envío, confirmación y reconexión deben ser inequívocos y accesibles.

### 5.4 Administración

El área administrativa puede ser más densa, pero conserva los tokens del producto. Prioridades:

- búsqueda y facetas visibles;
- estado editorial como información de trabajo;
- formularios con agrupación por palabra → sentido → frase;
- vista previa en contexto, no solo campos;
- diálogo propio para confirmar operaciones destructivas;
- advertencia de cambios sin guardar al abandonar.

Por alcance actual, la administración se redacta en español; no debe mezclar cadenas sueltas de otros idiomas ni depender del idioma nativo de diálogos del navegador.

## 6. Lenguaje visual

### 6.1 Dirección

La identidad mezcla dos referencias ya aprobadas:

- claro: papel de arroz tenue y tinta;
- oscuro: carbón frío casi negro, texto crema y acentos dorados.

No usar paisajes, pagodas, lunas, sellos decorativos ni texturas protagonistas. En pantalla compartida se vuelven ruido y reducen la legibilidad.

### 6.2 Color semántico

Un color conserva el mismo papel en ambos temas; puede variar luminosidad, no significado.

| Token | Uso exclusivo o principal |
|---|---|
| `keyword` | Palabra objetivo, en el anverso y dentro de frases; rojo suave. |
| `keyword-text` | La misma palabra en texto pequeño con contraste AA. |
| `radical` | Radical o componente semántico fiable; verde. |
| `phonetic` | Componente fonético fiable; azul pizarra. |
| `hanzi-ink` | Trazo general del hanzi. |
| `rating-1` | No la sé / reforzar mucho. |
| `rating-2` | Me costó / repasar. |
| `rating-3` | Bien. |
| `rating-4` | Fácil. |
| `no-data` | Sin evidencia suficiente. |

El rojo fuerte no se usa en audio, sliders, papeleras, iconos decorativos ni trazos animados. Una papelera puede volverse roja dentro del diálogo de confirmación, no antes.

En el anverso, los componentes pueden usar variantes sutiles de tinta para que el carácter siga leyéndose como una unidad; en la explicación del reverso se permiten los colores semántico/fonético completos.

### 6.3 Tipografía

- Hanzi: `Noto Serif SC`, mediante `font-hanzi`.
- Interfaz latina y pinyin: `Inter`, con `Noto Sans SC` como apoyo.
- Encabezados: sans serif de interfaz; evitar una falsa estética caligráfica en controles.
- Pinyin conserva marcas tonales y no se transforma a mayúsculas decorativas.

### 6.4 Forma y superficie

- Radio base de `0.75rem`: amable sin parecer juguete.
- Bordes claros en modo oscuro con dorado transparente.
- Sombras discretas; la separación depende de superficie, borde y espaciado.
- Retícula 米字格 reservada para caracteres y práctica, no como patrón global.

## 7. Jerarquía de la tarjeta

### Anverso

1. Progreso/lección, con bajo contraste.
2. Hanzi, elemento dominante.
3. Pinyin ocultable.
4. Controles de trazo/audio.
5. Acción de girar, visible y compatible con Espacio.

### Reverso

1. Hanzi + pinyin + significado del sentido activo.
2. Dos zonas principales: «Cómo se forma» y «En contexto».
3. Traducciones y pinyin de frases a demanda.
4. Matiz y nota cultural como detalles.
5. Valoración docente y votación, sin quedar enterradas tras contenido expandido.

Los sentidos ya vistos pueden mostrarse como repaso breve en el futuro; los no enseñados no deben adelantarse en la tarjeta actual.

## 8. Contenido y microcopy

Tono:

- directo, sereno y adulto;
- neutral en género;
- sin afirmar certeza editorial donde solo hay borrador;
- sin tecnicismos innecesarios para la docente;
- sin gamificación competitiva en la votación.

Preferir:

- «Cómo se forma» frente a «Etimología» cuando solo se muestran componentes;
- «Inventen una frase con 家» frente a una tarjeta vacía;
- «Pocos datos» frente a un veredicto rojo con dos votos;
- «Sin conexión, reintentando…» frente a «Error 500»;
- «Uso» o «Significado» como alternativa futura a «Sentido», pendiente de validación con Ever.

El estado `unreviewed` es editorial: se ve en administración, no interrumpe la clase con una etiqueta «Sin curar».

## 9. Responsive

### Clase

- Objetivo principal: 1366×768, 1440×900 y 1920×1080.
- Debe seguir funcionando en 390×844, pero la docente no es el caso primario en móvil.
- Evitar scroll anidado cuando sea posible; si el reverso necesita desplazamiento, mantener la referencia superior fija.
- A partir de 1280 px, composición y frases pueden compartir fila.

### Votación

- Objetivo principal: 390×844 y anchos similares.
- Sin scroll horizontal.
- Cuatro opciones en 2×2.
- Campo de código alto, teclado adecuado y avance entre casillas claro.
- El contenido esencial debe caber sin que el alumno busque el botón debajo del pliegue.

### Preparación y administración

- Escritorio primero, pero listas y formularios no deben romperse en tablet.
- Tablas densas pueden cambiar a tarjetas; no reducir texto hasta volverlo ilegible.

## 10. Accesibilidad

Requisitos mínimos:

- contraste WCAG AA para texto y estados de foco;
- indicador `focus-visible` en toda interacción, incluida la hecha a mano;
- objetivo táctil mínimo de 44×44 px en acciones móviles;
- `role="radiogroup"`, `role="radio"` y `aria-checked` en valoraciones;
- `aria-live="polite"` o `role="status"` para espera, voto, guardado y reconexión;
- no depender solo del color: texto, icono y/o número acompañan el semáforo;
- orden lógico de tabulación y atajos que no bloqueen controles del navegador;
- respeto de `prefers-reduced-motion`;
- hanzi/frases con `lang="zh-Hans"` y pinyin con `lang="zh-Latn"`;
- diálogo destructivo con `role="alertdialog"`, foco atrapado y retorno al disparador;
- validación real con NVDA o VoiceOver y zoom 200/400 %, todavía pendiente.

## 11. Estados que deben diseñarse

Cada flujo debe entregar diseños para:

- carga inicial y actualización en segundo plano;
- lista vacía;
- búsqueda sin resultados;
- contenido parcial;
- error de validación;
- error de permisos;
- sin conexión y reconexión;
- guardando, guardado y error de guardado;
- confirmación destructiva;
- sesión/votación activa, esperando y terminada;
- datos insuficientes para un veredicto.

## 12. Componentes clave

- Shell de docente/admin con navegación contextual.
- Tarjeta de palabra: anverso, reverso y cabecera fija.
- Arte de trazos y retícula.
- Explicación de componentes.
- Frase con palabra resaltada, pinyin, traducción y audio.
- Control de revelación de traducciones.
- Escala de valoración 1–4.
- Estado de votación y distribución de respuestas.
- Entrada de código con panda.
- Buscador de palabras con selección múltiple.
- Editor de ejemplos globales/privados.
- Diálogo de confirmación reutilizable.
- Aviso de cambios sin guardar.
- Estados vacío, error y reconexión.

## 13. No hacer

- No añadir imágenes genéricas para ilustrar significados: fijan un solo uso y compiten con las frases.
- No generar glifos históricos con IA. Las formas antiguas requieren fuente y licencia.
- No mezclar rojo pedagógico con error, audio y decoración.
- No mostrar toda la profundidad de una palabra al mismo tiempo.
- No usar una bandera para representar idioma.
- No convertir la clase en un ranking ni exponer votos individuales.
- No inventar logotipos, nombres secundarios o motivos «chinos» ornamentales.
- No ocultar fallos de red detrás de un spinner infinito.

## 14. Validación y entregables

Para un cambio visible relevante:

1. estados principales y de error;
2. claro y oscuro;
3. escritorio y móvil pertinentes;
4. teclado y foco;
5. contraste automatizado cuando aplique;
6. recorrido Playwright y captura tomada al probar el hito;
7. revisión con la docente cuando cambie el flujo de clase.

La validación final no es «se parece al mockup», sino «la docente puede enseñar sin explicar la interfaz».

## 15. Preguntas abiertas de diseño

- ¿«Sentido», «Uso» o «Significado» se entiende mejor al elegir una acepción?
- ¿Qué información del resultado grupal ayuda sin sobreinterpretar pocos votos?
- ¿La docente necesita fijar una frase favorita además de la rotación?
- ¿Cómo se elige el idioma pedagógico de una clase sin duplicar controles?
- ¿Cómo entran las palabras de apoyo de nivel superior por toque, foco y hover?
- ¿Qué parte de la experiencia de escritura experimental merece integrarse, si la prueba real con dedo resulta útil?
