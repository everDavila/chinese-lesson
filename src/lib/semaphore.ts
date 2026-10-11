// Semáforo de comprensión (DIAGNOSTICO-MODO-CLASE.md, "Semáforo: reglas
// iniciales"). Sin dependencias: se prueba con node --test.

export type Verdict = "nodata" | "reinforce" | "review" | "mastered";
/** Votos por valoración: [No la sé, Me costó, Bien, Fácil]. */
export type VoteCounts = [number, number, number, number];

/**
 * Veredicto de los votos de los alumnos. Puntuación: No la sé 0 · Me costó 1
 * · Bien 2 · Fácil 3.
 * - Sin datos: menos de 3 votos, o participación < 40 % de los esperados.
 * - Requiere refuerzo: ≥ 30 % "No la sé", o media < 1,2.
 * - Dominio aparente: ≥ 70 % "Bien" + "Fácil" y ≤ 10 % "No la sé".
 * - Necesita repaso: lo demás.
 */
export function votesVerdict(counts: VoteCounts, expected?: number | null): Verdict {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total < 3 || (expected && total < 0.4 * expected)) return "nodata";
  const [no, hard, good, easy] = counts;
  const mean = (hard * 1 + good * 2 + easy * 3) / total;
  if (no / total >= 0.3 || mean < 1.2) return "reinforce";
  if ((good + easy) / total >= 0.7 && no / total <= 0.1) return "mastered";
  return "review";
}

/** Valoración de la docente (1–4): No la sé → refuerzo · Me costó → repaso · Bien o Fácil → dominio. */
export function teacherVerdict(rating: 1 | 2 | 3 | 4): Verdict {
  return rating === 1 ? "reinforce" : rating === 2 ? "review" : "mastered";
}

const SEVERITY: Record<Verdict, number> = { nodata: 0, mastered: 1, review: 2, reinforce: 3 };

/** Si hay ambos, el peor de los dos: nunca se promedian. "Sin datos" no cuenta. */
export function combinedVerdict(votes: Verdict, teacher?: Verdict): Verdict {
  if (!teacher) return votes;
  if (votes === "nodata") return teacher;
  return SEVERITY[votes] >= SEVERITY[teacher] ? votes : teacher;
}
