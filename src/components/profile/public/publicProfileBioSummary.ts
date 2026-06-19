const HERO_BIO_MAX_LENGTH = 180;

export function getPublicProfileBioSummary(bio: string | null | undefined): {
  text: string | null;
  isTruncated: boolean;
} {
  const text = bio?.trim();
  if (!text) return { text: null, isTruncated: false };
  if (text.length <= HERO_BIO_MAX_LENGTH) return { text, isTruncated: false };

  const candidate = text.slice(0, HERO_BIO_MAX_LENGTH + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const end = lastSpace > HERO_BIO_MAX_LENGTH * 0.7 ? lastSpace : HERO_BIO_MAX_LENGTH;

  return { text: `${text.slice(0, end).trimEnd()}...`, isTruncated: true };
}
