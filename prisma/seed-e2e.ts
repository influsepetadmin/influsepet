/**
 * Playwright / manuel E2E için minimum sabit kullanıcı + teklif + sohbet + teslim verisi.
 * Çalıştır: `npm run db:seed:e2e` (DATABASE_URL gerekli).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { E2E_FIXTURE } from "../tests/e2e/helpers/e2eFixture";

const prisma = new PrismaClient();

function offerBase(overrides: {
  id: string;
  title: string;
  brief: string;
  offerAmountTRY: number;
  status: "PENDING" | "REJECTED" | "IN_PROGRESS" | "DELIVERED" | "REVISION_REQUESTED" | "COMPLETED";
}) {
  const offerAmountTRY = overrides.offerAmountTRY;
  const commissionTRY = Math.round(offerAmountTRY * 0.15);
  const netPayoutTRY = offerAmountTRY - commissionTRY;
  return {
    id: overrides.id,
    brandId: E2E_FIXTURE.brand.userId,
    influencerId: E2E_FIXTURE.influencer.userId,
    title: overrides.title,
    brief: overrides.brief,
    offerAmountTRY,
    commissionTRY,
    netPayoutTRY,
    commissionRate: 0.15,
    status: overrides.status,
    initiatedBy: "BRAND" as const,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(E2E_FIXTURE.password, 10);

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          E2E_FIXTURE.influencer.email,
          E2E_FIXTURE.brand.email,
          E2E_FIXTURE.otherInfluencer.email,
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      id: E2E_FIXTURE.influencer.userId,
      email: E2E_FIXTURE.influencer.email,
      name: E2E_FIXTURE.influencer.name,
      role: "INFLUENCER",
      passwordHash,
      influencer: {
        create: {
          username: E2E_FIXTURE.influencer.publicUsername,
          category: "moda",
          followerCount: 1000,
          basePriceTRY: 500,
          city: "İstanbul",
          bio: "E2E seed influencer profili.",
          selectedCategories: {
            create: [{ categoryKey: "moda" }],
          },
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      id: E2E_FIXTURE.brand.userId,
      email: E2E_FIXTURE.brand.email,
      name: E2E_FIXTURE.brand.name,
      role: "BRAND",
      passwordHash,
      brand: {
        create: {
          companyName: E2E_FIXTURE.brand.companyName,
          username: E2E_FIXTURE.brand.publicUsername,
          city: "Ankara",
          bio: "E2E seed marka profili.",
          selectedCategories: {
            create: [{ categoryKey: "teknoloji" }],
          },
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      id: E2E_FIXTURE.otherInfluencer.userId,
      email: E2E_FIXTURE.otherInfluencer.email,
      name: E2E_FIXTURE.otherInfluencer.name,
      role: "INFLUENCER",
      passwordHash,
      influencer: {
        create: {
          username: E2E_FIXTURE.otherInfluencer.publicUsername,
          category: "yemek",
          followerCount: 100,
          basePriceTRY: 300,
          city: "İzmir",
          bio: "E2E üçüncü kullanıcı — sohbet erişim testi.",
          selectedCategories: {
            create: [{ categoryKey: "yemek" }],
          },
        },
      },
    },
  });

  await prisma.offer.createMany({
    data: [
      offerBase({
        id: E2E_FIXTURE.offers.pendingId,
        title: E2E_FIXTURE.titles.pending,
        brief: "Seed — bekleyen.",
        offerAmountTRY: 800,
        status: "PENDING",
      }),
      offerBase({
        id: E2E_FIXTURE.offers.rejectedId,
        title: E2E_FIXTURE.titles.rejected,
        brief: "Seed — reddedildi.",
        offerAmountTRY: 900,
        status: "REJECTED",
      }),
      offerBase({
        id: E2E_FIXTURE.offers.inProgressId,
        title: E2E_FIXTURE.titles.inProgress,
        brief: "Seed — e2e.",
        offerAmountTRY: 2000,
        status: "IN_PROGRESS",
      }),
      offerBase({
        id: E2E_FIXTURE.offers.deliveredReviewId,
        title: E2E_FIXTURE.titles.deliveredReview,
        brief: "Seed — marka incelemesi bekliyor.",
        offerAmountTRY: 1500,
        status: "DELIVERED",
      }),
      offerBase({
        id: E2E_FIXTURE.offers.revisionRequestedId,
        title: E2E_FIXTURE.titles.revisionRequested,
        brief: "Seed — revize.",
        offerAmountTRY: 1200,
        status: "REVISION_REQUESTED",
      }),
      offerBase({
        id: E2E_FIXTURE.offers.completedId,
        title: E2E_FIXTURE.titles.completed,
        brief: "Seed verisi — e2e.",
        offerAmountTRY: 1000,
        status: "COMPLETED",
      }),
    ],
  });

  await prisma.offerDelivery.create({
    data: {
      offerId: E2E_FIXTURE.offers.deliveredReviewId,
      submittedById: E2E_FIXTURE.influencer.userId,
      deliveryUrl: "https://example.com/e2e-delivery-pending-review",
      deliveryText: "E2E teslim — marka incelemesi bekliyor.",
      status: "SUBMITTED",
    },
  });

  await prisma.offerDelivery.create({
    data: {
      offerId: E2E_FIXTURE.offers.revisionRequestedId,
      submittedById: E2E_FIXTURE.influencer.userId,
      deliveryUrl: "https://example.com/e2e-delivery-revision",
      deliveryText: "E2E teslim — revize talebi.",
      status: "REVISION_REQUESTED",
    },
  });

  await prisma.offerDelivery.create({
    data: {
      offerId: E2E_FIXTURE.offers.completedId,
      submittedById: E2E_FIXTURE.influencer.userId,
      deliveryUrl: "https://example.com/e2e-completed-delivery",
      deliveryText: "E2E onaylı teslim.",
      status: "APPROVED",
    },
  });

  await prisma.collaborationRating.create({
    data: {
      offerId: E2E_FIXTURE.offers.completedId,
      raterUserId: E2E_FIXTURE.influencer.userId,
      rateeUserId: E2E_FIXTURE.brand.userId,
      rating: 4,
    },
  });

  const convs: { id: string; offerId: string; body: string; senderId: string }[] = [
    {
      id: E2E_FIXTURE.conversations.pendingId,
      offerId: E2E_FIXTURE.offers.pendingId,
      body: "E2E seed mesaj — pending.",
      senderId: E2E_FIXTURE.brand.userId,
    },
    {
      id: E2E_FIXTURE.conversations.rejectedId,
      offerId: E2E_FIXTURE.offers.rejectedId,
      body: "E2E seed mesaj — rejected.",
      senderId: E2E_FIXTURE.brand.userId,
    },
    {
      id: E2E_FIXTURE.conversations.inProgressId,
      offerId: E2E_FIXTURE.offers.inProgressId,
      body: "E2E seed mesajı — devam eden iş birliği.",
      senderId: E2E_FIXTURE.influencer.userId,
    },
    {
      id: E2E_FIXTURE.conversations.deliveredReviewId,
      offerId: E2E_FIXTURE.offers.deliveredReviewId,
      body: "E2E seed mesaj — teslim edildi.",
      senderId: E2E_FIXTURE.influencer.userId,
    },
    {
      id: E2E_FIXTURE.conversations.revisionRequestedId,
      offerId: E2E_FIXTURE.offers.revisionRequestedId,
      body: "E2E seed mesaj — revize.",
      senderId: E2E_FIXTURE.brand.userId,
    },
    {
      id: E2E_FIXTURE.conversations.completedId,
      offerId: E2E_FIXTURE.offers.completedId,
      body: "E2E seed mesajı — tamamlanan iş birliği.",
      senderId: E2E_FIXTURE.brand.userId,
    },
  ];

  for (const c of convs) {
    await prisma.conversation.create({
      data: {
        id: c.id,
        offerId: c.offerId,
        messages: {
          create: {
            senderId: c.senderId,
            body: c.body,
            kind: "TEXT",
          },
        },
      },
    });
  }

  console.log(
    "[seed-e2e] OK — 3 kullanıcı, 6 teklif, teslim satırları, sohbetler, 1 collaboration rating.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
