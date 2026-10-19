export const EXAMPLE_NAME_MAX_LENGTH = 120;

/** Nom affichable : espaces de bord retirés et espaces internes réduits à un seul. */
export function normalizeExampleName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
