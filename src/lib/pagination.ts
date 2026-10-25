/** Páginas a mostrar: 1 … actual−1 actual actual+1 … última ("gap" = puntos suspensivos). */
export function pageList(current: number, last: number): (number | "gap")[] {
  const keep = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : "gap");
    out.push(p);
  });
  return out;
}
