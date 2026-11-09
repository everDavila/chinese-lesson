-- Cuenta y avance del estudiante (2026-11-09). Diseño:
-- docs/DISENO-AVANCE-ESTUDIANTE.md. Eventos append-only conservados; el estado
-- por palabra es derivado (se puede recalcular desde los eventos).

-- 1. Rol student. Un usuario nuevo ya NO nace docente: hasta hoy el rol por
--    defecto era 'teacher', y con registro por enlace mágico cualquier alumno
--    habría entrado como docente. Las docentes se crean con
--    scripts/crear-docente.mjs, que fija el rol explícitamente.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('student', 'teacher', 'reviewer', 'admin'));
alter table profiles alter column role set default 'student';

-- 2. Sesiones de práctica (tiempo activo: corte de inactividad de 3 minutos,
--    lo calcula el cliente; aquí solo se guarda).
create table student_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active_ms integer not null default 0 check (active_ms >= 0)
);
create index student_sessions_student_idx on student_sessions (student_id, started_at desc);

-- 3. Eventos: una fila por intento. Solo se insertan. El id lo puede generar el
--    cliente, para subir el avance guardado en el dispositivo sin duplicarlo.
create table student_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  session_id uuid references student_sessions on delete set null,
  sense_id uuid not null references senses on delete cascade,
  skill text not null check (skill in ('recognize', 'write')),
  exercise text not null,
  outcome text not null check (outcome in ('correct', 'wrong', 'gave_up', 'known')),
  chosen text,
  correct text,
  mistakes smallint not null default 0 check (mistakes >= 0),
  strokes_total smallint check (strokes_total >= 0),
  failed_strokes smallint[] not null default '{}',
  used_help boolean not null default false,
  ms_to_first_action integer check (ms_to_first_action >= 0),
  ms_total integer check (ms_total >= 0),
  at timestamptz not null default now()
);
create index student_events_student_at_idx on student_events (student_id, at desc);
create index student_events_word_idx on student_events (student_id, sense_id, skill, at desc);

-- 4. Estado derivado por palabra y habilidad: lo que lee la cola diaria.
create table student_word_state (
  student_id uuid not null references profiles on delete cascade,
  sense_id uuid not null references senses on delete cascade,
  skill text not null check (skill in ('recognize', 'write')),
  stage text not null default 'seen' check (stage in ('seen', 'fragile', 'mastered', 'dismissed')),
  due_at timestamptz,
  interval_days numeric not null default 0 check (interval_days >= 0),
  last_outcome text check (last_outcome in ('correct', 'wrong', 'gave_up', 'known')),
  updated_at timestamptz not null default now(),
  primary key (student_id, sense_id, skill)
);
create index student_word_state_due_idx on student_word_state (student_id, due_at);

-- 5. «Ya la sé» (sale de la cola pero vuelve en chequeo esporádico) y «no me la
--    preguntes más» (la excluye del todo).
create table student_known_flags (
  student_id uuid not null references profiles on delete cascade,
  sense_id uuid not null references senses on delete cascade,
  kind text not null check (kind in ('known', 'dismissed')),
  created_at timestamptz not null default now(),
  primary key (student_id, sense_id)
);

-- RLS: cada alumno solo ve y escribe lo suyo. Los eventos no se actualizan ni
-- se borran desde la app (borrar la cuenta los borra en cascada).
alter table student_sessions enable row level security;
alter table student_events enable row level security;
alter table student_word_state enable row level security;
alter table student_known_flags enable row level security;

create policy "sesiones propias" on student_sessions for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "leer eventos propios" on student_events for select to authenticated
  using (student_id = auth.uid());
create policy "crear eventos propios" on student_events for insert to authenticated
  with check (
    student_id = auth.uid()
    and (session_id is null or exists (
      select 1 from student_sessions s where s.id = session_id and s.student_id = auth.uid()
    ))
  );

create policy "estado propio" on student_word_state for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "marcas propias" on student_known_flags for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Privilegios: nada para anon. Eventos: leer e insertar, sin update ni delete.
revoke all on student_sessions, student_events, student_word_state, student_known_flags from anon;
revoke all on student_sessions, student_events, student_word_state, student_known_flags from authenticated;
grant select, insert, update, delete on student_sessions, student_word_state, student_known_flags to authenticated;
grant select, insert on student_events to authenticated;

-- 6. La lección de ejemplo se da cuando alguien pasa a ser docente. Antes el
--    perfil nacía docente y bastaba el trigger de inserción; ahora nace
--    student y la docente se asciende después (give_example_lesson es
--    idempotente: una sola copia por docente).
create trigger profiles_give_example_lesson_on_role
  after update of role on profiles
  for each row
  when (old.role is distinct from new.role)
  execute function public.give_example_lesson_on_profile();
