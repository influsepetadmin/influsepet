/**
 * E2E seed + testler için tek kaynak sabitler.
 * `prisma/seed-e2e.ts` ile senkron tutulmalı.
 */
export const E2E_FIXTURE = {
  password: process.env.E2E_TEST_PASSWORD ?? "E2E_Test_Pass_2026!",
  influencer: {
    email: "e2e-influencer@test.local",
    name: "E2E Influencer",
    publicUsername: "e2e_influencer_pub",
    userId: "e2e01infuser00000001",
  },
  brand: {
    email: "e2e-brand@test.local",
    name: "E2E Brand User",
    companyName: "E2E Test Markası",
    publicUsername: "e2e_brand_pub",
    userId: "e2e01branduser000001",
  },
  /** Üçüncü influencer — aynı sohbete katılmıyor (erişim engeli senaryosu). */
  otherInfluencer: {
    email: "e2e-other@test.local",
    name: "E2E Üçüncü Influencer",
    publicUsername: "e2e_other_pub",
    userId: "e2e01otherinfuser01",
  },
  offers: {
    completedId: "e2e01offercompleted01",
    inProgressId: "e2e01offerinprogress1",
    pendingId: "e2e01offerpending01",
    rejectedId: "e2e01offerrejected1",
    deliveredReviewId: "e2e01offerdelivrev01",
    revisionRequestedId: "e2e01offerrevision01",
  },
  conversations: {
    completedId: "e2e01convcompleted001",
    inProgressId: "e2e01convinprogress01",
    pendingId: "e2e01convpending001",
    rejectedId: "e2e01convrejected01",
    deliveredReviewId: "e2e01convdeliver01",
    revisionRequestedId: "e2e01convrevision01",
  },
  titles: {
    pending: "E2E seed pending teklif",
    rejected: "E2E seed reddedilen teklif",
    deliveredReview: "E2E seed teslim incelemede",
    revisionRequested: "E2E seed revize istendi",
    completed: "E2E tamamlanan teklif",
    inProgress: "E2E devam eden teklif",
  },
} as const;
