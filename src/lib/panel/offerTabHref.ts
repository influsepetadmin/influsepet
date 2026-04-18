/** Shared query builder for panel offer lists (?tab= & optional &durum=). */
export function buildOfferTabHref(
  basePath: string,
  tab: string,
  durumKey: string,
): string {
  const d = durumKey && durumKey !== "tumu" ? `&durum=${encodeURIComponent(durumKey)}` : "";
  return `${basePath}?tab=${tab}${d}`;
}
