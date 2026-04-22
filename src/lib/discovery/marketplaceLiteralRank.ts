import { getCategoryLabel } from "@/lib/categories";
import {
  compactFoldedSearchText,
  compactSearchText,
  foldTrAscii,
  normalizeSearchText,
} from "./searchNormalize";

export type InfluencerLiteralRow = {
  username: string;
  city: string | null;
  category: string;
  nicheText: string | null;
  bio: string | null;
  user: { name: string };
  selectedCategories: { categoryKey: string }[];
};

export type BrandLiteralRow = {
  companyName: string;
  username: string | null;
  city: string | null;
  bio: string | null;
  website: string | null;
  user: { name: string };
  selectedCategories: { categoryKey: string }[];
};

/** 40–100: higher = stronger literal (substring / prefix / exact) match — no typo distance. */
export function literalRankInfluencer(rawQuery: string, row: InfluencerLiteralRow): number {
  if (!rawQuery.trim()) return 100;
  let best = 40;
  const u = normalizeSearchText(row.username);
  const uc = compactSearchText(row.username);
  const uf = foldTrAscii(row.username);
  const ucf = compactFoldedSearchText(row.username);

  const n = normalizeSearchText(row.user.name);
  const nf = foldTrAscii(row.user.name);

  const labels = row.selectedCategories.map((c) => normalizeSearchText(getCategoryLabel(c.categoryKey))).join(" ");

  const q = normalizeSearchText(rawQuery);
  const qc = compactSearchText(rawQuery);
  const qf = foldTrAscii(rawQuery).trim();
  const qcf = compactFoldedSearchText(rawQuery);

  if (q && u === q) best = Math.max(best, 100);
  if (qc.length >= 2 && uc === qc) best = Math.max(best, 99);
  if (qf && uf === qf) best = Math.max(best, 97);
  if (qcf.length >= 2 && ucf === qcf) best = Math.max(best, 96);

  if (q && u.startsWith(q)) best = Math.max(best, 92);
  if (qc.length >= 2 && uc.startsWith(qc)) best = Math.max(best, 91);
  if (qf && uf.startsWith(qf)) best = Math.max(best, 89);

  if (q && n === q) best = Math.max(best, 90);
  if (q && n.startsWith(q)) best = Math.max(best, 86);
  if (qf && nf.includes(qf)) best = Math.max(best, 84);

  if (q && u.includes(q)) best = Math.max(best, 80);
  if (qc.length >= 2 && uc.includes(qc)) best = Math.max(best, 79);
  if (qf && uf.includes(qf)) best = Math.max(best, 77);

  if (q && n.includes(q)) best = Math.max(best, 74);

  const city = row.city ? normalizeSearchText(row.city) : "";
  if (q && city && (city.includes(q) || (qf && foldTrAscii(city).includes(qf)))) best = Math.max(best, 68);

  const cat = normalizeSearchText(row.category);
  const niche = row.nicheText ? normalizeSearchText(row.nicheText) : "";
  const bio = row.bio ? normalizeSearchText(row.bio) : "";
  if (q && (cat.includes(q) || niche.includes(q) || bio.includes(q))) best = Math.max(best, 64);
  if (qf && (foldTrAscii(cat).includes(qf) || foldTrAscii(niche).includes(qf) || foldTrAscii(bio).includes(qf))) {
    best = Math.max(best, 62);
  }

  if (q && labels.includes(q)) best = Math.max(best, 62);
  if (qf && foldTrAscii(labels).includes(qf)) best = Math.max(best, 60);

  return best;
}

/** 40–100 for brand rows — same spirit as influencer literal rank. */
export function literalRankBrand(rawQuery: string, row: BrandLiteralRow): number {
  if (!rawQuery.trim()) return 100;
  let best = 40;
  const q = normalizeSearchText(rawQuery);
  const qc = compactSearchText(rawQuery);
  const qf = foldTrAscii(rawQuery).trim();
  const qcf = compactFoldedSearchText(rawQuery);

  const company = normalizeSearchText(row.companyName);
  const companyF = foldTrAscii(row.companyName);
  const companyC = compactSearchText(row.companyName);
  const companyCf = compactFoldedSearchText(row.companyName);

  const n = normalizeSearchText(row.user.name);
  const nf = foldTrAscii(row.user.name);

  const un = row.username ? normalizeSearchText(row.username) : "";
  const uc = row.username ? compactSearchText(row.username) : "";
  const uf = row.username ? foldTrAscii(row.username) : "";
  const ucf = row.username ? compactFoldedSearchText(row.username) : "";

  const labels = row.selectedCategories.map((c) => normalizeSearchText(getCategoryLabel(c.categoryKey))).join(" ");

  if (q && company === q) best = Math.max(best, 100);
  if (qc.length >= 2 && companyC === qc) best = Math.max(best, 99);
  if (qf && companyF === qf) best = Math.max(best, 97);
  if (qcf.length >= 2 && companyCf === qcf) best = Math.max(best, 96);

  if (un) {
    if (q && un === q) best = Math.max(best, 98);
    if (qc.length >= 2 && uc === qc) best = Math.max(best, 97);
    if (qf && uf === qf) best = Math.max(best, 95);
    if (q && un.startsWith(q)) best = Math.max(best, 91);
    if (qc.length >= 2 && uc.startsWith(qc)) best = Math.max(best, 90);
    if (q && un.includes(q)) best = Math.max(best, 82);
    if (qc.length >= 2 && uc.includes(qc)) best = Math.max(best, 81);
    if (qf && uf.includes(qf)) best = Math.max(best, 79);
  }

  if (q && company.startsWith(q)) best = Math.max(best, 90);
  if (qc.length >= 2 && companyC.startsWith(qc)) best = Math.max(best, 89);
  if (q && n === q) best = Math.max(best, 88);
  if (q && n.startsWith(q)) best = Math.max(best, 84);
  if (q && company.includes(q)) best = Math.max(best, 78);
  if (qc.length >= 2 && companyC.includes(qc)) best = Math.max(best, 77);
  if (qf && companyF.includes(qf)) best = Math.max(best, 75);
  if (q && n.includes(q)) best = Math.max(best, 72);

  const city = row.city ? normalizeSearchText(row.city) : "";
  if (q && city && (city.includes(q) || (qf && foldTrAscii(city).includes(qf)))) best = Math.max(best, 66);

  const bio = row.bio ? normalizeSearchText(row.bio) : "";
  const web = row.website ? normalizeSearchText(row.website) : "";
  if (q && (bio.includes(q) || web.includes(q))) best = Math.max(best, 62);

  if (q && labels.includes(q)) best = Math.max(best, 60);
  if (qf && foldTrAscii(labels).includes(qf)) best = Math.max(best, 58);

  return best;
}
