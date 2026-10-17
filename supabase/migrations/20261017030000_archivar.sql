-- Archivar lecciones y colecciones propias (decisión de Ever, 2026-10-17).
-- Al quitar algo, la docente elige: archivar (desaparece de sus listas pero
-- conserva sus clases, votos e historial de frases, y se puede restaurar) o
-- borrar definitivamente (borra también ese historial: class_sessions cuelga
-- de la lección con on delete cascade). Archivar una colección oculta también
-- sus lecciones. Todo lo existente queda sin archivar (null).

alter table lessons add column archived_at timestamptz;
alter table collections add column archived_at timestamptz;

comment on column lessons.archived_at is 'Archivada por la docente: oculta en sus listas, con su historial intacto.';
comment on column collections.archived_at is 'Archivada por la docente: oculta con sus lecciones, con su historial intacto.';
