export const CONNECTION_WARNING_AFTER = 2;

export function nextConnectionFailures(current: number, succeeded: boolean): number {
  return succeeded ? 0 : current + 1;
}
