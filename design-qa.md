# QA de diseño — inicio docente

Fecha: 2026-10-17
Estado: **bloqueado para la revisión del nuevo Inicio**

## Referencias

- Mockup compartido en la conversación: panel oscuro dorado para preparar clases.
- Prototipo funcional: `C:\Users\ever\Downloads\renshi_flujo_hsk.html`.
- Producto actual: rutas, auth, componentes y datos reales de Supabase.

## Comparación final

- La jerarquía coincide: navegación lateral, cabecera compacta, saludo, acciones principales, continuidad y biblioteca.
- El encabezado usa **Renshi**, sin panda. No existe el bloque redundante de accesos rápidos.
- “Continuar” abre el editor real; presentar queda como acción secundaria.
- La biblioteca muestra solo HSK 1–3 y temas que existen en la base. No se inventaron fechas, imágenes ni estado de “próxima clase”.
- En móvil la navegación pasa a una fila desplazable y no produce desbordamiento horizontal de la página.

## Verificación

- Playwright, tema oscuro: 1440 × 900 y 390 × 844.
- Inicio, biblioteca y apertura directa del formulario de nueva colección: 2/2 recorridos aprobados.
- Capturas: `tests/screens/desktop-dark/inicio-docente.png` y `tests/screens/phone-dark/inicio-docente.png` (ignoradas por Git).

## Refactor de fijados y recientes

- Fuente visual: captura compartida en la conversación (Inicio con Acceso rápido y Lecciones recientes), 739 × 547 px.
- Implementación: `src/components/manage/teacher-dashboard.tsx`, escritorio oscuro previsto a 1440 × 900 y móvil a 390 × 844.
- Estado: migración verificada en `hanzi-dev`, build correcto.
- Comparación visual: bloqueada. La sesión guardada de `laoshi` venció y el navegador mostró la demo pública, no el Inicio autenticado; por eso no existe una captura comparable válida.
- Tipografía, espaciado, colores, iconos y contenido: revisados en código, pero no aprobados visualmente sin render autenticado.
- Interacciones pendientes de captura: fijar/desfijar, abrir colección, presentar y editar lección.
- Consola: sin errores de la nueva interfaz; el recorrido se detuvo antes de renderizarla por falta de autenticación.

final result: blocked
