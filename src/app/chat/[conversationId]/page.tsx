import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { getAvatarUrl } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { EmptyGlyphLockClosed } from "@/components/icons/emptyStateGlyphs";
import ChatClient from "./ChatClient";

function offerTitle(title: string | null, campaignName: string | null): string {
  const t = title?.trim() || campaignName?.trim();
  return t || "İş birliği";
}

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await getSessionPayload();
  if (!session) {
    return (
      <div className="chat-layout">
        <section className="dash-card dash-card--section">
          <h1 className="dash-section__title">Sohbet</h1>
          <EmptyStateCard
            icon={<EmptyGlyphLockClosed />}
            title="Oturum gerekli"
            description="Bu sohbeti görüntülemek için giriş yapmalısınız."
          >
            <Link className="btn" href="/?mode=login">
              Giriş yap
            </Link>
          </EmptyStateCard>
        </section>
      </div>
    );
  }

  const [conversation, me] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        offer: {
          select: {
            id: true,
            status: true,
            brandId: true,
            influencerId: true,
            title: true,
            campaignName: true,
            createdAt: true,
            budgetTRY: true,
            offerAmountTRY: true,
            brand: {
              select: {
                name: true,
                brand: {
                  select: { companyName: true, username: true, profileImageUrl: true },
                },
              },
            },
            influencer: {
              select: {
                name: true,
                influencer: { select: { username: true, profileImageUrl: true } },
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.uid },
      select: { role: true },
    }),
  ]);

  if (!conversation || !me) return notFound();

  const isParticipant =
    conversation.offer.brandId === session.uid || conversation.offer.influencerId === session.uid;
  if (!isParticipant) {
    const panelHref =
      me.role === "BRAND" ? "/marka" : me.role === "INFLUENCER" ? "/influencer" : "/";
    const panelLabel =
      me.role === "BRAND"
        ? "Marka paneline git"
        : me.role === "INFLUENCER"
          ? "Influencer paneline git"
          : "Uygun panele git";
    return (
      <ForbiddenStateCard
        title="Bu sohbete erişemezsiniz"
        description="Bu iş birliği sohbeti hesabınıza bağlı değil veya bağlantı başka bir kullanıcıya ait."
        panelHref={panelHref}
        panelLabel={panelLabel}
      />
    );
  }

  const homeHref =
    me.role === "BRAND" ? "/marka" : me.role === "INFLUENCER" ? "/influencer" : "/";

  const o = conversation.offer;
  const isBrandViewer = o.brandId === session.uid;
  const otherUserId = isBrandViewer ? o.influencerId : o.brandId;
  const otherSideName = isBrandViewer
    ? o.influencer?.name?.trim() || o.influencer?.influencer?.username || "Influencer"
    : o.brand?.brand?.companyName?.trim() || o.brand?.name?.trim() || "Marka";
  const otherSideRole = isBrandViewer ? "Influencer" : "Marka";
  const profileHref = isBrandViewer
    ? `/profil/influencer/${o.influencerId}`
    : `/profil/marka/${o.brandId}`;

  const rawImg = isBrandViewer
    ? o.influencer?.influencer?.profileImageUrl?.trim()
    : o.brand?.brand?.profileImageUrl?.trim();
  const otherSideAvatarSrc = rawImg || getAvatarUrl(otherUserId);

  let otherSideHandleLine: string | null = null;
  if (isBrandViewer) {
    const u = o.influencer?.influencer?.username;
    if (u) otherSideHandleLine = `@${u}`;
  } else {
    const bu = o.brand?.brand?.username?.trim();
    if (bu) otherSideHandleLine = `@${bu}`;
  }

  const budgetTry = o.budgetTRY ?? o.offerAmountTRY;
  const budgetLabel = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(budgetTry);
  const createdAtLabel = o.createdAt.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="chat-layout chat-layout--conversation">
      <nav className="chat-workflow-nav" aria-label="Sohbet gezintisi">
        <div className="chat-workflow-nav__start">
          <Link className="chat-workflow-nav__back" href="/chat">
            <span className="chat-workflow-nav__back-icon" aria-hidden>
              ←
            </span>
            <span className="chat-workflow-nav__back-text">Sohbetler</span>
          </Link>
        </div>
        <div className="chat-workflow-nav__end">
          <Link className="chat-workflow-nav__panel btn secondary btn--sm" href={homeHref}>
            Panele dön
          </Link>
        </div>
      </nav>
      <ChatClient
        conversationId={conversationId}
        meId={session.uid}
        offer={{
          id: o.id,
          status: o.status,
          brandId: o.brandId,
          influencerId: o.influencerId,
          title: o.title,
          campaignName: o.campaignName,
        }}
        workflowMeta={{
          budgetLabel,
          createdAtLabel,
        }}
        chatContext={{
          otherSideName,
          otherSideRole,
          otherSideAvatarSrc,
          otherSideHandleLine,
          profileHref,
          offerTitle: offerTitle(o.title, o.campaignName),
        }}
      />
    </div>
  );
}
