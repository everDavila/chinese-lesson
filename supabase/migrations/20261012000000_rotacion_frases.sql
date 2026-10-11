-- Rotación de frases entre clases (src/lib/rotation.ts).
-- La docente elige cuántas frases por palabra ve la clase; al abrir una
-- sesión se eligen primero las que esa clase aún no vio y la elección queda
-- guardada: no cambia durante la clase y alimenta la siguiente.

-- 0 = todas. En la colección vale para todas sus lecciones; en una lección,
-- null = lo que diga la colección.
alter table collections add column examples_shown smallint not null default 2
  check (examples_shown between 0 and 9);
alter table lessons add column examples_shown smallint
  check (examples_shown between 0 and 9);

-- Frases que salieron en cada sesión. sentence_key = 's:<id de sentences>'
-- o 't:<id de teacher_examples>' (las frases propias de la docente también
-- rotan). Sin clave foránea a la frase: si se borra, el historial no estorba.
create table session_sentences (
  session_id uuid not null references class_sessions on delete cascade,
  sense_id uuid not null references senses on delete cascade,
  sentence_key text not null check (sentence_key ~ '^[st]:[0-9a-f-]{36}$'),
  position smallint not null,
  shown_at timestamptz not null default now(),
  primary key (session_id, sense_id, sentence_key)
);
create index session_sentences_sense_idx on session_sentences (sense_id, sentence_key);

alter table session_sentences enable row level security;
create policy "frases de mis sesiones" on session_sentences
  for all to authenticated
  using (exists (select 1 from class_sessions s where s.id = session_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from class_sessions s where s.id = session_id and s.teacher_id = auth.uid()));

-- Cuándo vio "esta clase" por última vez cada frase de esos sentidos. La
-- clase = las sesiones de la docente con lecciones de la misma colección
-- (o de la misma lección, si está suelta). security invoker: RLS aplica.
create function sentence_history(lesson uuid, senses uuid[])
returns table (sense_id uuid, sentence_key text, last_shown timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select ss.sense_id, ss.sentence_key, max(ss.shown_at)
  from session_sentences ss
  join class_sessions s on s.id = ss.session_id
  join lessons l on l.id = s.lesson_id
  join lessons me on me.id = sentence_history.lesson
  where ss.sense_id = any (sentence_history.senses)
    and s.teacher_id = auth.uid()
    and (
      (me.collection_id is not null and l.collection_id = me.collection_id)
      or (me.collection_id is null and l.id = me.id)
    )
  group by ss.sense_id, ss.sentence_key;
$$;
