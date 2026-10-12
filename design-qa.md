# Design QA — votación del alumno

Estado: **aprobado**.

Referencia visual: composición adjunta por Ever en la conversación del 2026-10-12. Se tomó como intención visual, manteniendo los tokens, controles y estructura existentes de Renshi.

## Comparación

- Se conserva el fondo carbón, el texto crema, los bordes dorados discretos y la composición minimalista de la referencia.
- El hanzi pasa a ser el foco principal y escala por cantidad de caracteres y espacio disponible.
- Se eliminó el pinyin de esta pantalla.
- La pregunta, el aviso con candado y la cuadrícula 2 × 2 siguen la jerarquía de la referencia.
- El estado elegido usa borde dorado, fondo tenue y una marca de verificación; la confirmación permanece debajo sin reemplazar el contenido.
- El encabezado conserva identidad, código de sesión y selector de idioma del producto real.

## Verificación visual y funcional

- Móvil oscuro, 360 × 640: sin desplazamiento vertical; cuatro objetivos táctiles visibles; voto inicial, guardado y cambio de voto comprobados.
- Escritorio oscuro, 1366 × 768: cuadrícula estable, sin desbordamiento horizontal y texto chino de cuatro caracteres adaptado.
- Nueva ronda simulada con otro identificador: aparece sin selección previa.
- Regreso a una ronda anterior: la selección se conserva por UUID de evaluación en la sesión del navegador.
- Capturas: `reports/design-qa-voto/mobile-saved.png` y `reports/design-qa-voto/desktop-empty.png`.

## Diferencias intencionales

- No se añadieron las etiquetas “En vivo” ni “Palabra 2 de 3” de la maqueta porque la arquitectura actual no expone esos datos al alumno y agregarlos habría alterado el flujo docente fuera del alcance.
- La prueba local sustituyó temporalmente las fuentes remotas por fuentes del sistema debido a un fallo local de `next/font`; el código entregado conserva las fuentes oficiales del producto.
- El botón circular con “N” visible en las capturas pertenece al indicador de desarrollo de Next y no aparece en producción.
