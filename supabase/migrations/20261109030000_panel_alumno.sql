-- Panel del alumno (2026-11-09): meta diaria y favoritas. Las dos son del
-- propio alumno; RLS por auth.uid(), igual que el resto de student_*.

-- Ajustes del alumno: hoy solo la meta diaria en minutos activos. Tabla aparte
-- (no columna en profiles) para no tocar los permisos de profiles.
create table student_settings (
  student_id uuid primary key references profiles on delete cascade,
  daily_goal_minutes smallint not null default 10 check (daily_goal_minutes between 1 and 240),
  updated_at timestamptz not null default now()
);

-- Palabras favoritas. Aparte de student_known_flags: allí la clave es
-- (alumno, palabra) y una palabra no podría ser «sabida» y favorita a la vez.
create table student_bookmarks (
  student_id uuid not null references profiles on delete cascade,
  sense_id uuid not null references senses on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, sense_id)
);

alter table student_settings enable row level security;
alter table student_bookmarks enable row level security;

create policy "ajustes propios" on student_settings for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "favoritas propias" on student_bookmarks for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

revoke all on student_settings, student_bookmarks from anon;
revoke all on student_settings, student_bookmarks from authenticated;
grant select, insert, update, delete on student_settings, student_bookmarks to authenticated;
