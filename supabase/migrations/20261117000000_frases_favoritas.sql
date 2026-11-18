-- Frases favoritas del alumno. Igual que student_bookmarks (palabras): cada
-- alumno ve y toca solo las suyas. Solo frases de la base común (sentences);
-- las frases propias de la docente tienen otra clave y no entran por ahora.
-- Si se borra la frase, se borra el favorito (on delete cascade).
create table student_sentence_bookmarks (
  student_id uuid not null references profiles on delete cascade,
  sentence_id uuid not null references sentences on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, sentence_id)
);

alter table student_sentence_bookmarks enable row level security;

create policy "frases favoritas propias" on student_sentence_bookmarks for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

revoke all on student_sentence_bookmarks from anon;
revoke all on student_sentence_bookmarks from authenticated;
grant select, insert, update, delete on student_sentence_bookmarks to authenticated;
