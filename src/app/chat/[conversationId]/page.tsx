import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
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
            icon="🔐"
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
            brand: {
              select: {
                name: true,
                brand: { select: { companyName: true } },
              },
            },
            influencer: {
              select: {
                name: true,
                influencer: { select: { username: true } },
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
  const otherSideName = isBrandViewer
    ? o.influencer?.influencer?.username ?? o.influencer?.name ?? "Influencer"
    : o.brand?.brand?.companyName ?? o.brand?.name ?? "Marka";
  const otherSideRole = isBrandViewer ? "Influencer" : "Marka";
  const profileHref = isBrandViewer
    ? `/profil/influencer/${o.influencerId}`
    : `/profil/marka/${o.brandId}`;

  return (
    <div className="chat-layout">
      <div className="chat-page-toolbar">
        <Link className="btn secondary btn--sm chat-page-toolbar__back" href="/chat">
          ← Sohbetler
        </Link>
        <Link className="btn secondary" href={homeHref}>
          Panele dön
        </Link>
      </div>
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
        chatContext={{
          otherSideName,
          otherSideRole,
          profileHref,
          offerTitle: offerTitle(o.title, o.campaignName),
        }}
      />
    </div>
  );
}
