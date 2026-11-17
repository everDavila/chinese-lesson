// Precisión por habilidad: de los intentos de cada habilidad, cuántos fueron
// aciertos. «Ya la sé» (known) cuenta como acierto; rendirse, no. Pura: sin
// acceso a datos, para probarla sola.
export type SkillKey = "recognize" | "write";
export type SkillAccuracy = { skill: SkillKey; attempts: number; correct: number; percent: number | null };

export function accuracyBySkill(events: { skill: string; outcome: string }[]): SkillAccuracy[] {
  return (["recognize", "write"] as const).map((skill) => {
    const list = events.filter((e) => e.skill === skill);
    const correct = list.filter((e) => e.outcome === "correct" || e.outcome === "known").length;
    return { skill, attempts: list.length, correct, percent: list.length ? Math.round((correct / list.length) * 100) : null };
  });
}
