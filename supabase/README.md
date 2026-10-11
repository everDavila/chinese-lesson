# Supabase

- `migrations/20261010000000_init.sql`: esquema de las fases 0–2 (contenido
  curado, lecciones, sesiones, valoraciones, votos anónimos y la vista
  `session_results`) con RLS.
- `migrations/20261010010000_profiles_trigger.sql`: crea la fila de `profiles`
  al crear un usuario en Auth y rellena la de los existentes.
- `seed.sql`: contenido de la lección de demo. Se genera con
  `npm run build:seed`; no editar a mano.

## Aplicar migraciones

Con `SUPABASE_DB_URL` en `.env.local` (URI del **Session pooler**, ver
`.env.example`):

```
npm run db -- migration list   # qué está aplicado
npm run db:migrate             # aplica las pendientes (supabase db push)
```

`scripts/db.mjs` ejecuta la CLI de Supabase y oculta la URL y la contraseña
en la salida. La conexión directa (`db.<ref>.supabase.co`) es solo IPv6 y
no resuelve en redes IPv4; el Session pooler sí.

El seed no lo aplica `db push`: se ejecuta una vez a mano en el SQL Editor.

**Estado del proyecto `hanzi` (2026-10-10):** las dos migraciones aplicadas y
registradas en el historial; seed aplicado (10 palabras, 15 sentidos, 30
frases, 19 caracteres); usuario de Ever con su perfil de profesora.

(Con la CLI de Supabase: `supabase link` + `supabase db push`, y el seed con
`psql`.)

Comprobado solo con el parser de Postgres (`libpg-query`): la sintaxis es
válida, pero la semántica se verifica al aplicarlo por primera vez.
