-- Colecciones de lecciones (ARQUITECTURA.md §4.1, aprobado 2026-10-11).
-- Depende de la migración de gobernanza de contenido (20261011000000), que
-- define los roles 'reviewer' y 'admin' y cierra la base común.
--
-- Colección → lección (ordenada) → ítem (sentido).
-- owner_id null = plantilla curada; la edita admin y la leen todos.
-- owner_id = docente = colección propia, privada.

create table collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text,
  -- De dónde sale la lista (p. ej. "vocabulario del libro X"); solo la lista.
  source_note text,
  copied_from uuid references collections on delete set null,
  created_at timestamptz not null default now()
);
create index collections_owner_idx on collections (owner_id);

-- Las lecciones existentes quedan sin colección hasta que la docente las mueva.
alter table lessons add column collection_id uuid references collections on delete cascade;
alter table lessons add column position smallint;
create unique index lessons_collection_position
  on lessons (collection_id, position) where collection_id is not null;

-- Las plantillas no tienen dueño: teacher_id pasa a ser opcional solo para ellas.
alter table lessons alter column teacher_id drop not null;
alter table lessons add constraint lessons_owner_check
  check (teacher_id is not null or collection_id is not null);

-- La búsqueda por pinyin sin tonos usa senses.pinyin_plain, que crea la
-- migración de gobernanza (no se duplica aquí).

-- ── Seguridad ───────────────────────────────────────────────────────────
create function is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table collections enable row level security;

create policy "leer mis colecciones y plantillas" on collections
  for select to authenticated
  using (owner_id = auth.uid() or owner_id is null);
create policy "crear mis colecciones" on collections
  for insert to authenticated
  with check (owner_id = auth.uid() or (owner_id is null and is_admin()));
create policy "editar mis colecciones" on collections
  for update to authenticated
  using (owner_id = auth.uid() or (owner_id is null and is_admin()))
  with check (owner_id = auth.uid() or (owner_id is null and is_admin()));
create policy "borrar mis colecciones" on collections
  for delete to authenticated
  using (owner_id = auth.uid() or (owner_id is null and is_admin()));

-- Lecciones: además de las propias, se leen las de plantillas; las de
-- plantillas solo las toca admin.
drop policy if exists "mis lecciones" on lessons;
create policy "leer mis lecciones y las de plantillas" on lessons
  for select to authenticated
  using (
    teacher_id = auth.uid()
    or exists (select 1 from collections c where c.id = collection_id and c.owner_id is null)
  );
create policy "gestionar mis lecciones" on lessons
  for all to authenticated
  using (
    teacher_id = auth.uid()
    or (teacher_id is null and is_admin()
        and exists (select 1 from collections c where c.id = collection_id and c.owner_id is null))
  )
  with check (
    (teacher_id = auth.uid()
      and (collection_id is null
           or exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid())))
    or (teacher_id is null and is_admin()
        and exists (select 1 from collections c where c.id = collection_id and c.owner_id is null))
  );

drop policy if exists "items de mis lecciones" on lesson_items;
create policy "leer items de mis lecciones y plantillas" on lesson_items
  for select to authenticated
  using (exists (
    select 1 from lessons l
    left join collections c on c.id = l.collection_id
    where l.id = lesson_id and (l.teacher_id = auth.uid() or c.owner_id is null and l.collection_id is not null)
  ));
create policy "gestionar items de mis lecciones" on lesson_items
  for all to authenticated
  using (exists (
    select 1 from lessons l
    where l.id = lesson_id
      and (l.teacher_id = auth.uid() or (l.teacher_id is null and is_admin()))
  ))
  with check (exists (
    select 1 from lessons l
    where l.id = lesson_id
      and (l.teacher_id = auth.uid() or (l.teacher_id is null and is_admin()))
  ));

-- ── Copiar una plantilla ────────────────────────────────────────────────
-- Crea, para la docente que llama, una copia independiente de la colección
-- (lecciones e ítems). Devuelve el id de la colección nueva.
create function copy_collection(template_id uuid)
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
    select id, title, position from public.lessons
    where collection_id = template_id order by position
  loop
    insert into public.lessons (teacher_id, collection_id, title, position)
    values (auth.uid(), new_collection, src.title, src.position)
    returning id into new_lesson;

    insert into public.lesson_items (lesson_id, sense_id, position)
    select new_lesson, sense_id, position from public.lesson_items where lesson_id = src.id;
  end loop;

  return new_collection;
end;
$$;
