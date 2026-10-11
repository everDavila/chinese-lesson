-- Votación anónima de los alumnos (DIAGNOSTICO-MODO-CLASE.md §E, fase 2).
-- Los alumnos no tienen cuenta y la app no guarda la clave de servicio en
-- Vercel, así que no escriben en las tablas: llaman a estas dos funciones,
-- que comprueban todo por dentro. RLS sigue cerrada para anon.
--
-- Una clase vale para votar si está activa y empezó hace menos de 4 horas
-- (red de seguridad por si nadie la termina).

create function public.student_vote_state(code text)
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

  select ev.id, w.hanzi, se.pinyin into e
  from public.evaluations ev
  join public.senses se on se.id = ev.sense_id
  join public.words w on w.id = se.word_id
  where ev.session_id = s.id and ev.status = 'open';
  if not found then
    return jsonb_build_object('status', 'waiting');
  end if;

  -- Solo lo necesario para votar: sin significado (no regalar la respuesta).
  return jsonb_build_object('status', 'open', 'evaluation', e.id, 'hanzi', e.hanzi, 'pinyin', e.pinyin);
end;
$$;

-- voter = hash (hex, 64) del token de la cookie del alumno, calculado en el
-- servidor. Votar otra vez cambia el voto, no lo suma.
create function public.cast_student_vote(code text, evaluation uuid, voter text, rating smallint)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if rating not between 1 and 4 or voter !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  if not exists (
    select 1 from public.evaluations ev
    join public.class_sessions s on s.id = ev.session_id
    where ev.id = cast_student_vote.evaluation and ev.status = 'open'
      and s.join_code = upper(trim(code)) and s.status = 'active'
      and s.started_at > now() - interval '4 hours'
  ) then
    return false;
  end if;

  insert into public.votes (evaluation_id, voter_hash, rating)
  values (cast_student_vote.evaluation, voter, cast_student_vote.rating)
  on conflict (evaluation_id, voter_hash)
  do update set rating = excluded.rating, updated_at = now();
  return true;
end;
$$;

revoke all on function public.student_vote_state(text) from public;
revoke all on function public.cast_student_vote(text, uuid, text, smallint) from public;
grant execute on function public.student_vote_state(text) to anon, authenticated;
grant execute on function public.cast_student_vote(text, uuid, text, smallint) to anon, authenticated;
