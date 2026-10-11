-- Gobierno de contenido: procedencia verificable, niveles versionados y
-- propuestas privadas de docentes. Mantiene words.hsk_* temporalmente para no
-- romper la demo actual; el catálogo nuevo usa word_levels.

create type content_source_kind as enum (
  'official_standard',
  'official_exam',
  'academic_corpus',
  'open_dictionary',
  'open_data',
  'person'
);

create type teacher_example_status as enum (
  'draft',
  'submitted',
  'accepted',
  'rejected'
);

create table content_sources (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  name text not null,
  publisher text not null,
  kind content_source_kind not null,
  source_url text not null,
  version_label text,
  license_name text,
  license_url text,
  redistribution_allowed boolean not null default false,
  retrieved_at date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table word_levels (
  id bigint generated always as identity primary key,
  word_id uuid not null references words on delete cascade,
  sense_id uuid references senses on delete set null,
  standard text not null check (standard in ('hsk-2.0', 'hsk-3.0')),
  level smallint not null check (level between 1 and 9),
  source_id text not null references content_sources,
  source_order integer check (source_order > 0),
  source_label text,
  source_level_label text,
  pinyin text,
  part_of_speech text,
  created_at timestamptz not null default now(),
  unique (standard, source_order)
);

create index word_levels_word_idx on word_levels (word_id, standard, level);

-- Campo de búsqueda para que la vista de colecciones encuentre palabras sin
-- exigir marcas de tono. Se puebla desde la fuente junto al sentido borrador.
alter table senses add column pinyin_plain text;
alter table senses add column catalog_source_id text references content_sources;
alter table senses add column catalog_source_order integer check (catalog_source_order > 0);
create index senses_pinyin_plain_idx on senses (pinyin_plain);
create unique index senses_catalog_entry_idx
  on senses (catalog_source_id, catalog_source_order)
  where catalog_source_id is not null and catalog_source_order is not null;

comment on column words.hsk_level is
  'Compatibilidad temporal con la demo. El catálogo versionado vive en word_levels.';
comment on column words.hsk_version is
  'Compatibilidad temporal con la demo. No usar para nuevas importaciones.';

insert into content_sources (
  id, name, publisher, kind, source_url, version_label, license_name,
  redistribution_allowed, retrieved_at, notes
) values
  (
    'legacy-repo-seed',
    'Clasificación heredada del seed inicial',
    'chinese-lesson',
    'open_data',
    'https://github.com/everDavila/chinese-lesson',
    '2026-10-10',
    'Datos internos; procedencia original por verificar',
    false,
    date '2026-10-11',
    'Solo preserva la clasificación existente durante la migración.'
  ),
  (
    'moe-gf0025-2021',
    '国际中文教育中文水平等级标准 GF 0025-2021',
    'Ministry of Education of the People''s Republic of China',
    'official_standard',
    'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/t20210329_523304.html',
    'GF 0025-2021',
    'Official standard; redistribution terms must be checked per artifact',
    false,
    date '2026-10-11',
    'Fuente normativa para el esquema moderno de tres etapas y nueve niveles.'
  ),
  (
    'cti-hsk3-2026',
    'HSK 3.0 examination syllabus',
    'Chinese Test International',
    'official_exam',
    'https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf',
    'publicado 2025-11; efectivo 2026-07',
    'Official exam material; redistribution terms must be checked per artifact',
    false,
    date '2026-10-11',
    'Catálogo operativo: niveles 1-3 introducen 300, 200 y 500 entradas.'
  ),
  (
    'blcu-bcc',
    'BCC语料库',
    'Beijing Language and Culture University',
    'academic_corpus',
    'https://bcc.blcu.edu.cn/',
    'consulta 2026-10-11',
    'Consulta y estadísticas; citar la publicación de BCC',
    false,
    date '2026-10-11',
    'Validación de frecuencia, registro y colocaciones; no copiar ejemplos automáticamente.'
  );

insert into word_levels (word_id, standard, level, source_id)
select
  id,
  case when hsk_version in ('3', '3.0') then 'hsk-3.0' else 'hsk-2.0' end,
  hsk_level,
  'legacy-repo-seed'
from words
where hsk_level is not null
on conflict do nothing;

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('teacher', 'reviewer', 'admin'));

-- La política inicial permitía actualizar cualquier columna del perfil propio,
-- incluido role. RLS decide qué filas; los privilegios de columna evitan que un
-- docente se convierta a sí mismo en administrador de contenido.
drop policy if exists "perfil propio" on profiles;
create policy "leer perfil propio" on profiles for select to authenticated
  using (id = auth.uid());
create policy "editar perfil propio" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, delete, update on profiles from authenticated;
grant update (display_name, reviews_languages) on profiles to authenticated;

create table teacher_examples (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles on delete cascade,
  sense_id uuid not null references senses on delete cascade,
  zh text not null,
  pinyin text,
  translation_es text,
  translation_en text,
  note text,
  status teacher_example_status not null default 'draft',
  promoted_sentence_id uuid references sentences on delete set null,
  reviewed_by uuid references profiles,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'accepted' or promoted_sentence_id is not null),
  check (reviewed_at is null or reviewed_by is not null)
);

create index teacher_examples_teacher_idx on teacher_examples (teacher_id, status);
create index teacher_examples_review_idx on teacher_examples (status)
  where status = 'submitted';

alter table content_sources enable row level security;
alter table word_levels enable row level security;
alter table teacher_examples enable row level security;

-- La biblioteca global se lee por docentes, pero solo revisores y
-- administradores de contenido pueden modificarla.
drop policy if exists "curar palabras" on words;
drop policy if exists "editar palabras" on words;
drop policy if exists "curar sentidos" on senses;
drop policy if exists "editar sentidos" on senses;
drop policy if exists "curar frases" on sentences;
drop policy if exists "editar frases" on sentences;

create policy "curadores crean palabras" on words for insert to authenticated
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "curadores editan palabras" on words for update to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "curadores crean sentidos" on senses for insert to authenticated
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "curadores editan sentidos" on senses for update to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "curadores crean frases" on sentences for insert to authenticated
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "curadores editan frases" on sentences for update to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "leer fuentes" on content_sources for select to authenticated using (true);
create policy "curadores gestionan fuentes" on content_sources for all to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "leer niveles" on word_levels for select to authenticated using (true);
create policy "curadores gestionan niveles" on word_levels for all to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "docentes leen sus ejemplos" on teacher_examples
  for select to authenticated
  using (teacher_id = auth.uid());
create policy "docentes crean borradores" on teacher_examples
  for insert to authenticated
  with check (teacher_id = auth.uid() and status = 'draft');
create policy "docentes editan borradores" on teacher_examples
  for update to authenticated
  using (teacher_id = auth.uid() and status = 'draft')
  with check (teacher_id = auth.uid() and status in ('draft', 'submitted'));
create policy "docentes eliminan borradores" on teacher_examples
  for delete to authenticated
  using (teacher_id = auth.uid() and status = 'draft');

create policy "curadores revisan ejemplos" on teacher_examples
  for select to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "curadores deciden ejemplos" on teacher_examples
  for update to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "curadores crean caracteres" on characters for insert to authenticated
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "curadores editan caracteres" on characters for update to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists "registrar cambio" on revisions;
create policy "curadores registran cambios" on revisions
  for insert to authenticated
  with check (
    author = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
