# Supabase

- `migrations/20261010000000_init.sql`: esquema de las fases 0–2 (contenido
  curado, lecciones, sesiones, valoraciones, votos anónimos y la vista
  `session_results`) con RLS.
- `seed.sql`: contenido de la lección de demo. Se genera con
  `npm run build:seed`; no editar a mano.

## Aplicar en un proyecto nuevo

1. Supabase → **SQL Editor** → pegar y ejecutar la migración.
2. Después, pegar y ejecutar `seed.sql`.

(Con la CLI de Supabase: `supabase link` + `supabase db push`, y el seed con
`psql`.)

Comprobado solo con el parser de Postgres (`libpg-query`): la sintaxis es
válida, pero la semántica se verifica al aplicarlo por primera vez.
