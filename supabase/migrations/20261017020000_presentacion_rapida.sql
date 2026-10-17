-- Presentación rápida desde el catálogo HSK (hoja de ruta, prioridad 3).
-- Toda clase cuelga de una lección (class_sessions.lesson_id es obligatorio),
-- así que presentar una selección o un nivel crea una lección suelta marcada
-- como `quick`: no aparece en Mis lecciones, pero la clase, los votos y la
-- rotación funcionan igual. "Guardar como lección" (prioridad 4) será quitar
-- la marca. Las lecciones existentes quedan como estaban (false).

alter table lessons add column quick boolean not null default false;

comment on column lessons.quick is
  'Lección creada al presentar desde el catálogo; oculta en Mis lecciones hasta guardarla.';

-- Solo una lección suelta de la docente puede ser rápida (nunca una de
-- colección ni de plantilla).
alter table lessons add constraint lessons_quick_loose_check
  check (not quick or (collection_id is null and teacher_id is not null));
