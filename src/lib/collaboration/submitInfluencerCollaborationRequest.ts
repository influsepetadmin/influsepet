/** Markanın influencer’a iş birliği isteği (şimdilik mock; API eklendiğinde burada çağrılır). */
export type InfluencerCollaborationRequestDraft = {
  campaignTitle: string;
  description: string;
  budgetTry: number;
};

export async function submitInfluencerCollaborationRequest(
  _influencerUserId: string,
  _draft: InfluencerCollaborationRequestDraft,
): Promise<{ ok: true } | { ok: false; message: string }> {
  await new Promise((r) => setTimeout(r, 280));
  return { ok: true };
}
