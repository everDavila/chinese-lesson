-- Inicio docente: actividad real y accesos fijados por cada profesora.
-- Las referencias apuntan al material existente; no se copia contenido.

alter table collections add column updated_at timestamptz not null default now();
alter table lessons add column updated_at timestamptz not null default now();

create function touch_teacher_material()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_table_name = 'lesson_items' then
    update lessons set updated_at = now() where id = coalesce(new.lesson_id, old.lesson_id);
  elsif tg_table_name = 'lessons' and tg_op = 'UPDATE' then
    new.updated_at = now();
  elsif tg_table_name = 'collections' and tg_op = 'UPDATE' then
    new.updated_at = now();
  end if;
  return coalesce(new, old);
end;
$$;

create trigger lessons_touch_updated_at
before update on lessons
for each row execute function touch_teacher_material();

create trigger collections_touch_updated_at
before update on collections
for each row execute function touch_teacher_material();

create trigger lesson_items_touch_lesson
after insert or update or delete on lesson_items
for each row execute function touch_teacher_material();

create table teacher_pins (
  teacher_id uuid not null references profiles on delete cascade,
  lesson_id uuid references lessons on delete cascade,
  collection_id uuid references collections on delete cascade,
  created_at timestamptz not null default now(),
  check ((lesson_id is not null)::int + (collection_id is not null)::int = 1)
);
create unique index teacher_pins_lesson_unique
  on teacher_pins (teacher_id, lesson_id) where lesson_id is not null;
create unique index teacher_pins_collection_unique
  on teacher_pins (teacher_id, collection_id) where collection_id is not null;
create index teacher_pins_teacher_created_idx on teacher_pins (teacher_id, created_at);

alter table teacher_pins enable row level security;
create policy "leer mis fijados" on teacher_pins
  for select to authenticated using (teacher_id = auth.uid());
create policy "fijar mi material" on teacher_pins
  for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and (
      (lesson_id is not null and exists (
        select 1 from lessons where id = lesson_id and teacher_id = auth.uid()
      ))
      or
      (collection_id is not null and exists (
        select 1 from collections where id = collection_id and owner_id = auth.uid()
      ))
    )
  );
create policy "desfijar mi material" on teacher_pins
  for delete to authenticated using (teacher_id = auth.uid());

