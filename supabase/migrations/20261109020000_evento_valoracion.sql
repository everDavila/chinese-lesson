-- La autovaloración del alumno (1 = «No la sé» … 4 = «Fácil») se guarda en el
-- mismo evento que el intento. Es nula cuando practicó sin valorar.
alter table student_events
  add column rating smallint check (rating between 1 and 4);
