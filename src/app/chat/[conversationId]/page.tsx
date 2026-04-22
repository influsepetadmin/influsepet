import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { getAvatarUrl } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";
import { getAvailableOfferTransitions, type OfferForTransition } from "@/lib/offers/transitions";
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

  const [conversation, me, latestDelivery] = await Promise.all([
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
            initiatedBy: true,
            brief: true,
            title: true,
            campaignName: true,
            createdAt: true,
            dueDate: true,
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
    prisma.offerDelivery.findFirst({
      where: { offer: { conversation: { id: conversationId } } },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
  ]);

  if (!conversation || !me) return notFound();

  const isParticipant =
    conversation.offer.brandId === session.uid || conversation.offer.influencerId === session.uid;
  if (!isParticipant) {
    const panelHref =
      me.role === "BRAND" ? "/marka/overview" : me.role === "INFLUENCER" ? "/influencer/overview" : "/";
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
    me.role === "BRAND" ? "/marka/overview" : me.role === "INFLUENCER" ? "/influencer/overview" : "/";
  const discoverHref = me.role === "BRAND" ? "/marka/discover" : "/influencer/discover";
  const offersPanelHref = me.role === "BRAND" ? "/marka/offers" : "/influencer/offers";

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
  const dueDateLabel = o.dueDate
    ? o.dueDate.toLocaleString("tr-TR", { dateStyle: "medium" })
    : null;

  const forTransition: OfferForTransition = {
    id: o.id,
    status: o.status,
    brandId: o.brandId,
    influencerId: o.influencerId,
    initiatedBy: o.initiatedBy,
  };
  const availableNextTransitions = getAvailableOfferTransitions({
    offer: forTransition,
    sessionUser: { id: session.uid, role: me.role },
  });

  const briefPreview = o.brief?.trim() ?? "";
  const briefForClient =
    briefPreview.length > 280 ? `${briefPreview.slice(0, 280).trim()}…` : briefPreview;
  const collaborationTitle = offerTitle(o.title, o.campaignName);

  return (
    <div className="chat-layout chat-layout--conversation">
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
          dueDateLabel,
        }}
        workspaceNav={{
          chatListHref: "/chat",
          homeHref,
          discoverHref,
          offersPanelHref,
          collaborationTitle,
          discoverLabel: me.role === "BRAND" ? "Influencer keşfet" : "Keşfet",
        }}
        workspaceSummary={{
          latestDelivery: latestDelivery ? { status: latestDelivery.status } : null,
        }}
        chatContext={{
          otherSideName,
          otherSideRole,
          otherSideAvatarSrc,
          otherSideHandleLine,
          profileHref,
          offerTitle: offerTitle(o.title, o.campaignName),
          brief: briefForClient,
        }}
        offersPanelHref={offersPanelHref}
        availableNextTransitions={availableNextTransitions}
      />
    </div>
  );
}
