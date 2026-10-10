-- Esquema inicial (fases 0–2). Ver ARQUITECTURA.md §4 y DIAGNOSTICO-MODO-CLASE.md §C.
-- Contenido compartido (palabras, sentidos, frases, caracteres): lo lee y
-- cura cualquier profesora. Lecciones, sesiones y resultados: solo su dueña.
-- Los votos anónimos nunca tocan la base desde el cliente: entran por una
-- ruta de servidor con la clave de servicio.

-- ── Tipos ───────────────────────────────────────────────────────────────
create type content_origin as enum ('open_data', 'ai', 'person');
create type review_status as enum ('unreviewed', 'reviewed', 'corrected');
create type session_status as enum ('active', 'ended');
create type evaluation_status as enum ('open', 'closed');

-- ── Personas ────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  role text not null default 'teacher' check (role in ('teacher', 'reviewer')),
  -- Idiomas que revisa: 'zh', 'es', 'en'
  reviews_languages text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Contenido compartido (base curada) ──────────────────────────────────
create table characters (
  char text primary key check (char_length(char) = 1),
  pinyin text[] not null,
  radical text,
  decomposition text,
  components jsonb not null default '[]',   -- [{ char, role }]
  etymology jsonb,                           -- { type, semantic, phonetic, hint }
  stroke_roles text[] not null default '{}', -- 'semantic' | 'phonetic' | 'other' por trazo
  origin content_origin not null default 'open_data'
);

create table words (
  id uuid primary key default gen_random_uuid(),
  hanzi text not null unique,
  hsk_level smallint check (hsk_level between 1 and 9),
  hsk_version text not null default '2.0',
  cultural_note_es text,
  cultural_note_en text,
  origin content_origin not null default 'ai',
  status review_status not null default 'unreviewed',
  reviewed_by uuid references profiles,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table senses (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references words on delete cascade,
  position smallint not null,               -- orden sugerido de enseñanza
  pinyin text not null,
  category text,                             -- noun, verb, measure word…
  meaning_es text,
  meaning_en text,
  nuance_es text,
  nuance_en text,
  origin content_origin not null default 'ai',
  status review_status not null default 'unreviewed',
  reviewed_by uuid references profiles,
  reviewed_at timestamptz,
  unique (word_id, position)
);

create table sentences (
  id uuid primary key default gen_random_uuid(),
  sense_id uuid not null references senses on delete cascade,
  position smallint not null,
  zh text not null,
  pinyin text not null,
  translation_es text,
  translation_en text,
  computed_level smallint,                   -- nivel HSK máximo de sus palabras
  origin content_origin not null default 'ai',
  status review_status not null default 'unreviewed',
  reviewed_by uuid references profiles,
  reviewed_at timestamptz,
  unique (sense_id, position)
);

-- Historial de correcciones de la base curada.
create table revisions (
  id bigint generated always as identity primary key,
  entity text not null,                      -- 'words' | 'senses' | 'sentences'
  entity_id uuid not null,
  field text not null,
  old_value text,
  new_value text,
  author uuid references profiles,
  created_at timestamptz not null default now()
);

-- ── Lecciones (de cada profesora) ───────────────────────────────────────
create table lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

-- La profesora elige qué sentido de cada palabra enseña en la lección.
create table lesson_items (
  lesson_id uuid not null references lessons on delete cascade,
  sense_id uuid not null references senses,
  position smallint not null,
  primary key (lesson_id, sense_id),
  unique (lesson_id, position)
);

-- ── Clase en vivo ───────────────────────────────────────────────────────
create table class_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  teacher_id uuid not null references profiles on delete cascade,
  -- 6 caracteres sin ambiguos (sin 0/O, 1/I/L); único entre sesiones activas.
  join_code text not null check (join_code ~ '^[A-HJ-KM-NP-Z2-9]{6}$'),
  status session_status not null default 'active',
  expected_students smallint check (expected_students > 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index class_sessions_active_code
  on class_sessions (join_code) where status = 'active';

-- Valoración general de la profesora: una por sentido y sesión (upsert).
create table teacher_ratings (
  session_id uuid not null references class_sessions on delete cascade,
  sense_id uuid not null references senses,
  rating smallint not null check (rating between 1 and 4),
  updated_at timestamptz not null default now(),
  primary key (session_id, sense_id)
);

-- Ronda de votación de los alumnos sobre un sentido.
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions on delete cascade,
  sense_id uuid not null references senses,
  status evaluation_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);
create unique index evaluations_one_open_per_session
  on evaluations (session_id) where status = 'open';

-- Voto anónimo: voter_hash = hash del token de la cookie, sin datos personales.
create table votes (
  evaluation_id uuid not null references evaluations on delete cascade,
  voter_hash text not null,
  rating smallint not null check (rating between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (evaluation_id, voter_hash)
);

-- Resultados agregados por sesión y sentido (vista, no tabla). Junta la
-- valoración de la profesora y los votos, cada uno con su origen; si un
-- sentido se votó en varias rondas de la misma sesión, se suman.
create view session_results
with (security_invoker = true) as
with keys as (
  select session_id, sense_id from teacher_ratings
  union
  select session_id, sense_id from evaluations
),
vote_counts as (
  select
    e.session_id,
    e.sense_id,
    count(*) as total,
    count(*) filter (where v.rating = 1) as r1,
    count(*) filter (where v.rating = 2) as r2,
    count(*) filter (where v.rating = 3) as r3,
    count(*) filter (where v.rating = 4) as r4
  from evaluations e
  join votes v on v.evaluation_id = e.id
  group by e.session_id, e.sense_id
)
select
  k.session_id,
  k.sense_id,
  s.lesson_id,
  s.started_at,
  s.expected_students,
  tr.rating as teacher_rating,
  coalesce(vc.total, 0) as votes_total,
  coalesce(vc.r1, 0) as votes_1,
  coalesce(vc.r2, 0) as votes_2,
  coalesce(vc.r3, 0) as votes_3,
  coalesce(vc.r4, 0) as votes_4
from keys k
join class_sessions s on s.id = k.session_id
left join teacher_ratings tr on tr.session_id = k.session_id and tr.sense_id = k.sense_id
left join vote_counts vc on vc.session_id = k.session_id and vc.sense_id = k.sense_id;

-- ── Seguridad (RLS) ─────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table characters enable row level security;
alter table words enable row level security;
alter table senses enable row level security;
alter table sentences enable row level security;
alter table revisions enable row level security;
alter table lessons enable row level security;
alter table lesson_items enable row level security;
alter table class_sessions enable row level security;
alter table teacher_ratings enable row level security;
alter table evaluations enable row level security;
alter table votes enable row level security;

create policy "perfil propio" on profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Contenido compartido: lectura y curación para profesoras autenticadas.
create policy "leer caracteres" on characters for select to authenticated using (true);
create policy "leer palabras" on words for select to authenticated using (true);
create policy "curar palabras" on words for insert to authenticated with check (true);
create policy "editar palabras" on words for update to authenticated using (true);
create policy "leer sentidos" on senses for select to authenticated using (true);
create policy "curar sentidos" on senses for insert to authenticated with check (true);
create policy "editar sentidos" on senses for update to authenticated using (true);
create policy "leer frases" on sentences for select to authenticated using (true);
create policy "curar frases" on sentences for insert to authenticated with check (true);
create policy "editar frases" on sentences for update to authenticated using (true);
create policy "leer historial" on revisions for select to authenticated using (true);
create policy "registrar cambio" on revisions
  for insert to authenticated with check (author = auth.uid());

-- Lo de cada profesora.
create policy "mis lecciones" on lessons
  for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "items de mis lecciones" on lesson_items
  for all to authenticated
  using (exists (select 1 from lessons l where l.id = lesson_id and l.teacher_id = auth.uid()))
  with check (exists (select 1 from lessons l where l.id = lesson_id and l.teacher_id = auth.uid()));

create policy "mis sesiones" on class_sessions
  for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "valoraciones de mis sesiones" on teacher_ratings
  for all to authenticated
  using (exists (select 1 from class_sessions s where s.id = session_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from class_sessions s where s.id = session_id and s.teacher_id = auth.uid()));

create policy "evaluaciones de mis sesiones" on evaluations
  for all to authenticated
  using (exists (select 1 from class_sessions s where s.id = session_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from class_sessions s where s.id = session_id and s.teacher_id = auth.uid()));

-- La profesora lee los votos de sus sesiones; nadie los escribe desde el
-- cliente (sin política de insert: solo la clave de servicio).
create policy "leer votos de mis sesiones" on votes
  for select to authenticated
  using (exists (
    select 1 from evaluations e join class_sessions s on s.id = e.session_id
    where e.id = evaluation_id and s.teacher_id = auth.uid()
  ));
