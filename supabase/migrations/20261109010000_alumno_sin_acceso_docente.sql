-- El alumno no escribe en nada de docente (2026-11-09).
--
-- Hasta ahora las políticas de lecciones, colecciones, sesiones de clase y
-- demás solo pedían ser el dueño de la fila (teacher_id = auth.uid()), no el
-- rol: una cuenta student podía crear lecciones por la API aunque la app no
-- se lo mostrara. En vez de reescribir una a una las políticas existentes
-- (riesgo de romper a las docentes), se añade una política RESTRICTIVE por
-- tabla y comando: Postgres la combina con AND con las permisivas, así que
-- solo bloquea a quien tenga rol student y no toca nada más.
--
-- La lectura queda como estaba: un alumno no es dueño de nada, así que solo
-- ve lo común (plantillas, catálogo).

create function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'student'
  );
$$;
revoke all on function public.is_student() from public;
grant execute on function public.is_student() to authenticated;

do $$
declare
  t text;
  cmd text;
begin
  foreach t in array array[
    'collections', 'lessons', 'lesson_items', 'class_sessions',
    'teacher_ratings', 'evaluations', 'session_sentences',
    'teacher_examples', 'teacher_hidden_sentences', 'teacher_pins'
  ] loop
    foreach cmd in array array['insert', 'update', 'delete'] loop
      execute format(
        'create policy %I on public.%I as restrictive for %s to authenticated %s',
        'sin alumnos: ' || cmd, t, cmd,
        case cmd
          when 'insert' then 'with check (not public.is_student())'
          else 'using (not public.is_student())'
        end
      );
    end loop;
  end loop;
end $$;
