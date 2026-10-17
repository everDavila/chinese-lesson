const HAN_RUN = /\p{Script=Han}+/gu;

/** Términos chinos aislados en notas redactadas principalmente en español o inglés. */
export function noteTermCandidates(texts: Array<string | null | undefined>): string[] {
  return [...new Set(texts.flatMap((text) => text?.match(HAN_RUN) ?? []))];
}
