// Filtros con listas largas (.in("sense_id", [...])): PostgREST los manda en
// la URL y por encima de ~12 000 caracteres la petición falla (pasó al
// presentar HSK 7–9 completo: 5600 sentidos). Se piden en tandas y se juntan.
const CHUNK = 150;

export async function inChunks<T>(
  values: string[],
  run: (part: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < values.length; i += CHUNK) {
    const { data, error } = await run(values.slice(i, i + CHUNK));
    if (error) throw error;
    out.push(...(data ?? []));
  }
  return out;
}

// PostgREST devuelve como mucho 1000 filas por consulta (también en las
// relaciones anidadas y en las funciones que devuelven tablas). Una clase de
// un nivel completo pasa de eso (HSK 7–9: 5600 ítems): se pide página a página.
const PAGE = 1000;

export async function allPages<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await run(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}
