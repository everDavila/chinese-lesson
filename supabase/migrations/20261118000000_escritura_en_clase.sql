-- Escritura en clase (2026-11-18). Diseño: docs/DISENO-ESCRITURA-EN-CLASE.md.
-- En la clase en vivo, cada alumno escribe en su dispositivo y la profesora ve
-- el resultado. Los alumnos hablan con la base solo a través de funciones que
-- validan clase activa y ronda abierta (como la votación, 20261012010000).

-- La clase elige si la siguiente ronda es de votar o de escribir; la ronda
-- guarda una COPIA de los límites con que se abrió (no cambian a mitad de ella).
alter table class_sessions
  add column live_mode text not null default 'vote' check (live_mode in ('vote', 'write')),
  add column write_config jsonb check (write_config is null or (jsonb_typeof(write_config) = 'object' and length(write_config::text) <= 2000));
alter table evaluations
  add column kind text not null default 'vote' check (kind in ('vote', 'write')),
  add column write_config jsonb check (write_config is null or (jsonb_typeof(write_config) = 'object' and length(write_config::text) <= 2000));

-- Quién entró a la clase y con qué nombre: su cuenta o un apodo, a su elección.
-- El nombre es único dentro de la clase (sin distinguir mayúsculas).
create table session_participants (
  session_id uuid not null references class_sessions on delete cascade,
  voter_hash text not null check (voter_hash ~ '^[0-9a-f]{64}$'),
  display_name text not null check (char_length(display_name) between 1 and 30),
  student_id uuid references profiles on delete set null,
  joined_at timestamptz not null default now(),
  primary key (session_id, voter_hash)
);
create unique index session_participants_name_idx on session_participants (session_id, lower(display_name));

-- Un intento por alumno y ronda (el primero gana). El intento va tal cual, en
-- jsonb; las estadísticas se calculan al leer (src/lib/write-stats.ts).
create table evaluation_writes (
  evaluation_id uuid not null references evaluations on delete cascade,
  voter_hash text not null check (voter_hash ~ '^[0-9a-f]{64}$'),
  attempt jsonb not null check (jsonb_typeof(attempt) = 'object' and length(attempt::text) <= 20000),
  created_at timestamptz not null default now(),
  primary key (evaluation_id, voter_hash)
);

alter table session_participants enable row level security;
alter table evaluation_writes enable row level security;

-- La profesora lee lo de sus sesiones; nadie escribe desde el cliente (sin
-- política de insert: solo las funciones de abajo).
create policy "leer participantes de mis sesiones" on session_participants
  for select to authenticated
  using (exists (select 1 from class_sessions s where s.id = session_id and s.teacher_id = auth.uid()));
create policy "leer escrituras de mis sesiones" on evaluation_writes
  for select to authenticated
  using (exists (
    select 1 from evaluations e join class_sessions s on s.id = e.session_id
    where e.id = evaluation_id and s.teacher_id = auth.uid()
  ));

revoke all on session_participants, evaluation_writes from anon, authenticated;
grant select on session_participants, evaluation_writes to authenticated;

-- Qué ve el alumno ahora: igual que antes, más el tipo de ronda y, si es de
-- escribir, sus límites. Sigue sin traer el significado.
create or replace function public.student_vote_state(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s record;
  e record;
begin
  select id into s from public.class_sessions
  where join_code = upper(trim(code)) and status = 'active'
    and started_at > now() - interval '4 hours';
  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  select ev.id, ev.kind, ev.write_config, w.hanzi, se.pinyin into e
  from public.evaluations ev
  join public.senses se on se.id = ev.sense_id
  join public.words w on w.id = se.word_id
  where ev.session_id = s.id and ev.status = 'open';
  if not found then
    return jsonb_build_object('status', 'waiting');
  end if;

  return jsonb_build_object(
    'status', 'open', 'evaluation', e.id, 'hanzi', e.hanzi, 'pinyin', e.pinyin,
    'kind', e.kind, 'config', e.write_config
  );
end;
$$;

-- Entrar a la clase con un nombre. `voter` = hash de la cookie del alumno.
-- Con `use_account` y sesión iniciada, el nombre es el de su cuenta; si no,
-- el apodo. Si el nombre ya lo usa otro alumno de la clase, se le añade un
-- número («Ana 2»). Volver a entrar cambia el nombre, no suma otro alumno.
create function public.join_class(code text, voter text, nickname text, use_account boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  s record;
  uid uuid := auth.uid();
  base text;
  final text;
  n int := 1;
begin
  if voter is null or voter !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid');
  end if;
  select id into s from public.class_sessions
  where join_code = upper(trim(code)) and status = 'active'
    and started_at > now() - interval '4 hours';
  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if use_account and uid is not null then
    select nullif(trim(display_name), '') into base from public.profiles where id = uid;
    base := coalesce(base, 'Alumno');
  else
    uid := null;
    base := trim(coalesce(nickname, ''));
    if base = '' then
      return jsonb_build_object('status', 'name_required');
    end if;
  end if;
  base := left(regexp_replace(base, '\s+', ' ', 'g'), 24);
  final := base;

  loop
    begin
      insert into public.session_participants (session_id, voter_hash, display_name, student_id)
      values (s.id, voter, final, uid)
      on conflict (session_id, voter_hash)
      do update set display_name = excluded.display_name, student_id = excluded.student_id;
      exit;
    exception when unique_violation then
      n := n + 1;
      if n > 200 then
        return jsonb_build_object('status', 'invalid');
      end if;
      final := base || ' ' || n;
    end;
  end loop;

  return jsonb_build_object('status', 'ok', 'name', final);
end;
$$;

-- Entrega del intento. Solo cuenta el primero de cada alumno por ronda.
-- Se acepta hasta 60 s después de cerrarse la ronda, para que quien termina
-- justo cuando la profesora pasa de palabra no pierda su intento.
-- Devuelve: ok | duplicate | closed | not_joined | invalid.
create function public.submit_student_write(code text, evaluation uuid, voter text, attempt jsonb)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  s record;
  e record;
begin
  if voter is null or voter !~ '^[0-9a-f]{64}$'
     or attempt is null or jsonb_typeof(attempt) <> 'object' or length(attempt::text) > 20000 then
    return 'invalid';
  end if;
  select id into s from public.class_sessions
  where join_code = upper(trim(code)) and status = 'active'
    and started_at > now() - interval '4 hours';
  if not found then
    return 'invalid';
  end if;

  select ev.id, ev.kind, ev.status, ev.closed_at into e
  from public.evaluations ev
  where ev.id = submit_student_write.evaluation and ev.session_id = s.id;
  if not found or e.kind <> 'write' then
    return 'invalid';
  end if;
  if e.status <> 'open' and (e.closed_at is null or e.closed_at < now() - interval '60 seconds') then
    return 'closed';
  end if;
  if not exists (
    select 1 from public.session_participants p where p.session_id = s.id and p.voter_hash = voter
  ) then
    return 'not_joined';
  end if;

  insert into public.evaluation_writes (evaluation_id, voter_hash, attempt)
  values (submit_student_write.evaluation, voter, attempt)
  on conflict (evaluation_id, voter_hash) do nothing;
  if found then
    return 'ok';
  end if;
  return 'duplicate';
end;
$$;

revoke all on function public.join_class(text, text, text, boolean) from public;
revoke all on function public.submit_student_write(text, uuid, text, jsonb) from public;
grant execute on function public.join_class(text, text, text, boolean) to anon, authenticated;
grant execute on function public.submit_student_write(text, uuid, text, jsonb) to anon, authenticated;
