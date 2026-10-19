-- Cerrar las funciones internas a anon y authenticated (2026-10-19).
--
-- Supabase concede EXECUTE a anon y authenticated sobre toda función nueva
-- del esquema public (privilegios por defecto); `revoke ... from public` no
-- quita esas concesiones explícitas. Así, lesson_payload(uuid) — que arma
-- cualquier lección por su id — quedó llamable sin sesión en producción, y
-- give_example_lesson(uuid) también. Solo deben llamarlas las funciones
-- públicas (security definer) y el disparador, que corren como dueñas.
-- La base de pruebas (PGlite) no tiene esos privilegios por defecto: por eso
-- no se vio en test:db; tests/db/permisos.mjs ahora los simula.

revoke execute on function public.lesson_payload(uuid) from anon, authenticated;
revoke execute on function public.give_example_lesson(uuid) from anon, authenticated;
revoke execute on function public.give_example_lesson_on_profile() from anon, authenticated;
