// Registro del laboratorio (/lab). Regla en REGLAS-DESARROLLO.md: todo
// experimento vive en /lab/<slug>, se publica para que otros lo vean y se
// queda aquí aunque se implemente; solo cambia su estado. Cada versión que se
// probó suma una entrada a su historia (no los ajustes menores): la página la
// muestra como línea de tiempo y el índice ordena por la más reciente.
export type LabStatus = "testing" | "implemented";

export type LabEvent = {
  date: string;
  /** Texto en messages/*.json → Lab.items.<slug>.history.<id>. */
  id: string;
  /** Este paso lo llevó a Renshi (cambia la etiqueta a «Implementado»). */
  implemented?: boolean;
};

export type Lab = {
  slug: string;
  /** Dónde se usa dentro de Renshi, si ya se implementó. */
  usedIn?: string;
  history: LabEvent[];
};

// Textos en messages/*.json → Lab.items.<slug>.{title,summary,history}.
const REGISTRY: Lab[] = [
  {
    slug: "radicales",
    history: [
      { date: "2026-10-24", id: "start" },
    ],
  },
  {
    slug: "escritura",
    history: [
      { date: "2026-10-12", id: "start" },
    ],
  },
  {
    slug: "gramatica",
    history: [
      { date: "2026-10-19", id: "start" },
    ],
  },
  {
    slug: "frases",
    history: [
      { date: "2026-10-20", id: "start" },
    ],
  },
  {
    slug: "tinta",
    usedIn: "/present",
    history: [
      { date: "2026-10-18", id: "start" },
      { date: "2026-10-18", id: "soft" },
      { date: "2026-10-19", id: "class", implemented: true },
    ],
  },
  {
    slug: "votacion",
    usedIn: "/v",
    history: [
      { date: "2026-10-11", id: "start", implemented: true },
      { date: "2026-10-12", id: "follows" },
      { date: "2026-10-12", id: "boxes" },
      { date: "2026-10-12", id: "panda" },
      { date: "2026-10-16", id: "connection" },
    ],
  },
];

const statusOf = (l: Lab): LabStatus => (l.history.some((e) => e.implemented) ? "implemented" : "testing");
const last = (l: Lab) => l.history[l.history.length - 1].date;

export type LabSummary = Lab & { status: LabStatus; since: string; updated: string; implementedOn?: string };

/** Los experimentos, del cambio más reciente al más antiguo. */
export const LABS: LabSummary[] = REGISTRY.map((l) => ({
  ...l,
  status: statusOf(l),
  since: l.history[0].date,
  updated: last(l),
  implementedOn: l.history.find((e) => e.implemented)?.date,
})).sort((a, b) => b.updated.localeCompare(a.updated));

export const labBySlug = (slug: string) => LABS.find((l) => l.slug === slug);
