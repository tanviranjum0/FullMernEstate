export interface RecommendationSubject {
  id: string;
  listingType: string;
  propertyType: string;
  citySlug: string;
  neighbourhoodSlug: string;
  price: number;
  bedrooms: number;
  areaSqft: number | null;
  amenities: readonly string[];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function relativeCloseness(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  return 1 - clamp01(Math.abs(a - b) / Math.max(a, b));
}

function jaccard(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const intersection = b.filter((item) => setA.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Scores how similar a candidate is to the property being viewed (0–100). Location carries
 * the most weight, then type and price band, then size and shared amenities. Listings of a
 * different transaction type (sale vs. rent) are never similar.
 */
export function similarityScore(
  base: RecommendationSubject,
  candidate: RecommendationSubject,
): number {
  if (candidate.id === base.id || candidate.listingType !== base.listingType) return 0;

  let score = 0;
  if (base.neighbourhoodSlug && candidate.neighbourhoodSlug === base.neighbourhoodSlug) score += 30;
  else if (candidate.citySlug === base.citySlug) score += 15;
  if (candidate.propertyType === base.propertyType) score += 20;
  score += 20 * relativeCloseness(base.price, candidate.price);
  score += 10 * (1 - clamp01(Math.abs(base.bedrooms - candidate.bedrooms) / 3));
  if (base.areaSqft && candidate.areaSqft)
    score += 10 * relativeCloseness(base.areaSqft, candidate.areaSqft);
  score += 10 * jaccard(base.amenities, candidate.amenities);
  return Math.round(score * 10) / 10;
}

export function rankSimilar<T extends RecommendationSubject>(
  base: RecommendationSubject,
  candidates: T[],
  limit: number,
): T[] {
  return candidates
    .map((candidate) => ({ candidate, score: similarityScore(base, candidate) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
