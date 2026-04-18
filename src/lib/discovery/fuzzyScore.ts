import { getCategoryLabel } from "@/lib/categories";
import {
  compactFoldedSearchText,
  compactSearchText,
  foldTrAscii,
  normalizeSearchText,
  tokenizeSearchQuery,
} from "./searchNormalize";
import { levenshtein } from "./levenshtein";

const MAX_LV = 24;

function bestTokenScore(queryNorm: string, hayWords: string[]): number {
  let best = 0;
  for (const w of hayWords) {
    if (!w) continue;
    if (w === queryNorm) {
      best = Math.max(best, 100);
      continue;
    }
    if (w.startsWith(queryNorm) && queryNorm.length >= 3) {
      best = Math.max(best, 92);
      continue;
    }
    if (queryNorm.length >= 3 && w.includes(queryNorm)) {
      best = Math.max(best, 78);
      continue;
    }
    if (queryNorm.length <= MAX_LV && w.length <= MAX_LV) {
      const d = levenshtein(queryNorm, w);
      if (d === 1) best = Math.max(best, 72);
      else if (d === 2) best = Math.max(best, 55);
      else if (d === 3 && queryNorm.length >= 6) best = Math.max(best, 38);
    }
  }
  return best;
}

function haystackWords(...parts: (string | null | undefined)[]): string[] {
  const raw = parts.filter(Boolean).join(" ");
  const n = normalizeSearchText(raw);
  return n.split(/\s+/).filter(Boolean);
}

/** Token split after Turkish norm + ASCII fold (fuzzy / typo layer). */
function haystackWordsFolded(...parts: (string | null | undefined)[]): string[] {
  const raw = parts.filter(Boolean).join(" ");
  const n = foldTrAscii(raw);
  return n.split(/\s+/).filter(Boolean);
}

export type InfluencerScoreRow = {
  id: string;
  username: string;
  city: string | null;
  category: string;
  nicheText: string | null;
  user: { name: string };
  selectedCategories: { categoryKey: string }[];
};

export function scoreInfluencerMatch(rawQuery: string, row: InfluencerScoreRow): number {
  const q = normalizeSearchText(rawQuery);
  const qc = compactSearchText(rawQuery);
  const qFold = foldTrAscii(rawQuery).trim();
  const qcFold = compactFoldedSearchText(rawQuery);
  if (!q && !qc && !qFold && !qcFold) return 0;

  const catLabels = row.selectedCategories.map((c) => getCategoryLabel(c.categoryKey).toLocaleLowerCase("tr-TR"));
  const hayFull = [
    row.username,
    row.user.name,
    row.city,
    row.category,
    row.nicheText,
    catLabels.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const normFull = normalizeSearchText(hayFull);
  const compactFull = compactSearchText(hayFull);
  const normFullFold = foldTrAscii(hayFull);
  const compactFullFold = compactFoldedSearchText(hayFull);

  if (qc.length >= 3 && compactFull.includes(qc)) return 100;
  if (q.length >= 2 && normFull.includes(q)) return 96;
  if (qcFold.length >= 3 && compactFullFold.includes(qcFold)) return 99;
  if (qFold.length >= 2 && normFullFold.includes(qFold)) return 94;

  const words = haystackWords(
    row.username,
    row.user.name,
    row.city,
    row.category,
    row.nicheText,
    catLabels.join(" "),
  );
  const wordsFold = haystackWordsFolded(
    row.username,
    row.user.name,
    row.city,
    row.category,
    row.nicheText,
    catLabels.join(" "),
  );

  let best = 0;
  if (q.length >= 2) best = Math.max(best, bestTokenScore(q, words));
  if (qFold.length >= 2) best = Math.max(best, bestTokenScore(qFold, wordsFold));

  for (const tok of tokenizeSearchQuery(rawQuery, 2)) {
    best = Math.max(best, bestTokenScore(tok, words));
    const tf = foldTrAscii(tok);
    if (tf.length >= 2) best = Math.max(best, bestTokenScore(tf, wordsFold));
    if (tok.length >= 3) {
      best = Math.max(best, bestTokenScore(tok, [compactFull]));
      best = Math.max(best, bestTokenScore(tf, [compactFullFold]));
    }
  }

  return best;
}

export type BrandScoreRow = {
  id: string;
  companyName: string;
  username: string | null;
  city: string | null;
  bio: string | null;
  website: string | null;
  user: { name: string };
  selectedCategories: { categoryKey: string }[];
};

export function scoreBrandMatch(rawQuery: string, row: BrandScoreRow): number {
  const q = normalizeSearchText(rawQuery);
  const qc = compactSearchText(rawQuery);
  const qFold = foldTrAscii(rawQuery).trim();
  const qcFold = compactFoldedSearchText(rawQuery);
  if (!q && !qc && !qFold && !qcFold) return 0;

  const catLabels = row.selectedCategories.map((c) => getCategoryLabel(c.categoryKey).toLocaleLowerCase("tr-TR"));
  const hayFull = [
    row.companyName,
    row.username,
    row.city,
    row.bio,
    row.website,
    row.user.name,
    catLabels.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const normFull = normalizeSearchText(hayFull);
  const compactFull = compactSearchText(hayFull);
  const normFullFold = foldTrAscii(hayFull);
  const compactFullFold = compactFoldedSearchText(hayFull);

  if (qc.length >= 3 && compactFull.includes(qc)) return 100;
  if (q.length >= 2 && normFull.includes(q)) return 96;
  if (qcFold.length >= 3 && compactFullFold.includes(qcFold)) return 99;
  if (qFold.length >= 2 && normFullFold.includes(qFold)) return 94;

  const words = haystackWords(
    row.companyName,
    row.username,
    row.city,
    row.bio,
    row.website,
    row.user.name,
    catLabels.join(" "),
  );
  const wordsFold = haystackWordsFolded(
    row.companyName,
    row.username,
    row.city,
    row.bio,
    row.website,
    row.user.name,
    catLabels.join(" "),
  );

  let best = 0;
  if (q.length >= 2) best = Math.max(best, bestTokenScore(q, words));
  if (qFold.length >= 2) best = Math.max(best, bestTokenScore(qFold, wordsFold));
  for (const tok of tokenizeSearchQuery(rawQuery, 2)) {
    best = Math.max(best, bestTokenScore(tok, words));
    const tf = foldTrAscii(tok);
    if (tf.length >= 2) best = Math.max(best, bestTokenScore(tf, wordsFold));
    if (tok.length >= 3) {
      best = Math.max(best, bestTokenScore(tok, [compactFull]));
      best = Math.max(best, bestTokenScore(tf, [compactFullFold]));
    }
  }

  return best;
}

export const MIN_FUZZY_SCORE = 28;
export const MIN_FUZZY_SCORE_FALLBACK = 22;
