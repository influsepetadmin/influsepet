/**
 * Literal-first ordering: exact / prefix / strong substring tiers beat fuzzy tie-breaks.
 * Fuzzy scores only affect order inside the same literal tier (or when q is long enough for broad pool).
 */

export function literalMatchTier(literal: number): number {
  if (literal >= 95) return 5;
  if (literal >= 88) return 4;
  if (literal >= 75) return 3;
  if (literal >= 68) return 2;
  if (literal >= 58) return 1;
  return 0;
}

export type LiteralFirstSortable = {
  literal: number;
  fuzzy: number;
  followerCount?: number;
};

/** qLen <= 2: fuzzy ignored for ordering (literal-only feel). */
export function compareLiteralFirstInfluencer(a: LiteralFirstSortable, b: LiteralFirstSortable, qLen: number): number {
  if (qLen <= 2) {
    if (b.literal !== a.literal) return b.literal - a.literal;
    return (b.followerCount ?? 0) - (a.followerCount ?? 0);
  }
  const ta = literalMatchTier(a.literal);
  const tb = literalMatchTier(b.literal);
  if (tb !== ta) return tb - ta;
  if (b.literal !== a.literal) return b.literal - a.literal;
  if (b.fuzzy !== a.fuzzy) return b.fuzzy - a.fuzzy;
  return (b.followerCount ?? 0) - (a.followerCount ?? 0);
}

export function compareLiteralFirstBrand(a: LiteralFirstSortable, b: LiteralFirstSortable, qLen: number): number {
  if (qLen <= 2) {
    if (b.literal !== a.literal) return b.literal - a.literal;
    return 0;
  }
  const ta = literalMatchTier(a.literal);
  const tb = literalMatchTier(b.literal);
  if (tb !== ta) return tb - ta;
  if (b.literal !== a.literal) return b.literal - a.literal;
  if (b.fuzzy !== a.fuzzy) return b.fuzzy - a.fuzzy;
  return 0;
}
