-- Descripción opcional para lecciones (y ya existente para colecciones).
-- owner_id null = plantilla curada; la edita admin y la leen todos.
-- owner_id = docente = colección propia, privada.

alter table lessons add column description text;

comment on column lessons.description is 'Descripción opcional de la lección, visible en su detalle y editable por la docente.';

-- copy_collection (definida en 20261011010000_collections.sql) pasa a copiar
-- también la descripción de cada lección; la de la colección ya se copiaba.
-- Así la copia hereda el contexto y se puede editar sin tocar el original.
create or replace function copy_collection(template_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_collection uuid;
  src record;
  new_lesson uuid;
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  if not exists (
    select 1 from public.collections
    where id = template_id and (owner_id is null or owner_id = auth.uid())
  ) then
    raise exception 'Colección no encontrada';
  end if;

  insert into public.collections (owner_id, title, description, source_note, copied_from)
  select auth.uid(), title, description, source_note, id
  from public.collections where id = template_id
  returning id into new_collection;

  for src in
    select id, title, description, position from public.lessons
    where collection_id = template_id order by position
  loop
    insert into public.lessons (teacher_id, collection_id, title, description, position)
    values (auth.uid(), new_collection, src.title, src.description, src.position)
    returning id into new_lesson;

    insert into public.lesson_items (lesson_id, sense_id, position)
    select new_lesson, sense_id, position from public.lesson_items where lesson_id = src.id;
  end loop;

  return new_collection;
end;
$$;