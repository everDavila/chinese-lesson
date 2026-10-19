// Registro del laboratorio (/lab). Regla en REGLAS-DESARROLLO.md: todo
// experimento vive en /lab/<slug>, se publica para que otros lo vean y se
// queda aquí aunque se implemente; solo cambia su estado.
export type LabStatus = "testing" | "implemented";

export type Lab = {
  slug: string;
  status: LabStatus;
  /** Dónde se usa dentro de Renshi, si ya se implementó. */
  usedIn?: string;
  since: string;
};

// Textos en messages/*.json → Lab.items.<slug>.{title,summary}.
export const LABS: Lab[] = [
  { slug: "escritura", status: "testing", since: "2026-10-12" },
  { slug: "gramatica", status: "testing", since: "2026-10-19" },
  { slug: "tinta", status: "implemented", usedIn: "/present", since: "2026-10-18" },
  { slug: "votacion", status: "implemented", usedIn: "/v", since: "2026-10-11" },
];

export const labBySlug = (slug: string) => LABS.find((l) => l.slug === slug);
