"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getProfileCtaAbVariantForTrack, useProfileCtaAbVariant } from "@/lib/productTracking/profileCtaAb";
import { trackFirstTimeOnce, trackProductEvent } from "@/lib/productTracking/productEvents";
import { TrackedChatOpenLink } from "@/components/tracking/TrackedChatOpenLink";
import { PublicProfileHeroTrustChips } from "@/components/profile/public/PublicProfileHeroTrustChips";

const CTA_ENTRY_HIGHLIGHT_MS = 2400;
const CTA_ENTRY_HIGHLIGHT_SESSION_KEY = "influsepet_profile_cta_highlight_seen";

function brandOfferHintLine(
  hasChat: boolean,
  completedCollaborationsCount: number,
  ratingCount: number,
): string {
  if (hasChat) {
    return "Devam eden sohbetiniz var — önce sohbeti açın veya yeni teklif gönderin.";
  }
  if (completedCollaborationsCount > 0 || ratingCount > 0) {
    return "Markalar bu profil ile aktif çalışıyor. Hemen iş birliği başlat.";
  }
  return "Hemen iş birliği başlat.";
}

function microTrustLine(completedCollaborationsCount: number, ratingCount: number): string {
  if (completedCollaborationsCount > 0 || ratingCount > 0) {
    return "Markalar bu profil ile aktif çalışıyor.";
  }
  return "Yeni katıldı, erken fırsat.";
}

export function PublicInfluencerBrandOfferCta({
  brandUserId,
  chatHref,
  averageRating = null,
  ratingCount = 0,
  completedCollaborationsCount = 0,
  cameFromDiscover = false,
}: {
  brandUserId: string;
  chatHref?: string | null;
  averageRating?: number | null;
  ratingCount?: number;
  completedCollaborationsCount?: number;
  cameFromDiscover?: boolean;
}) {
  const dialogId = useId();
  const titleId = `${dialogId}-modal-title`;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [highlightOfferCta, setHighlightOfferCta] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const abVariant = useProfileCtaAbVariant();

  const close = useCallback(() => {
    setOpen(false);
    setErr(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>("input, textarea, button");
    el?.focus();
  }, [open]);

  useEffect(() => {
    if (!cameFromDiscover) return;
    try {
      if (sessionStorage.getItem(CTA_ENTRY_HIGHLIGHT_SESSION_KEY)) return;
      sessionStorage.setItem(CTA_ENTRY_HIGHLIGHT_SESSION_KEY, "1");
    } catch {
      return;
    }
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      setHighlightOfferCta(true);
    });
    const t = window.setTimeout(() => setHighlightOfferCta(false), CTA_ENTRY_HIGHLIGHT_MS);
    return () => {
      mounted = false;
      window.clearTimeout(t);
    };
  }, [cameFromDiscover]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const brief = (form.elements.namedItem("brief") as HTMLTextAreaElement).value.trim();
    const budgetRaw = (form.elements.namedItem("budget") as HTMLInputElement).value;
    const offerAmountTRY = Number.parseInt(budgetRaw, 10);
    if (!title || !brief || !Number.isFinite(offerAmountTRY) || offerAmountTRY < 100) return;

    setSending(true);
    setErr(null);
    const res = await fetch("/api/offers/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: brandUserId,
        title,
        brief,
        offerAmountTRY,
        budgetTRY: offerAmountTRY,
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; conversationId?: string; error?: string }
      | null;
    setSending(false);
    if (!res.ok || !json?.ok) {
      setErr(typeof json?.error === "string" ? json.error : "Teklif gönderilemedi.");
      return;
    }
    trackProductEvent({
      event: "collaboration_created",
      location: "public_profile_brand",
      label: "influencer_to_brand_offer",
      brandUserId,
      variant: getProfileCtaAbVariantForTrack(),
    });
    trackFirstTimeOnce("influsepet_ft_collab_created_influencer_public", {
      event: "first_collaboration_created",
      location: "public_profile_brand",
    });
    close();
    form.reset();
    if (json.conversationId) {
      router.push(`/chat/${json.conversationId}`);
    }
  }

  const hasChat = Boolean(chatHref);
  const hint = brandOfferHintLine(hasChat, completedCollaborationsCount, ratingCount);
  const trustLine = microTrustLine(completedCollaborationsCount, ratingCount);
  const offerIsPrimary = !hasChat || abVariant === "B";

  const offerButton = (
    <button
      type="button"
      className={`btn public-profile-hero__cta-btn ${offerIsPrimary ? "public-profile-hero__cta-btn--prominent" : "secondary public-profile-hero__cta-btn--offer-when-chat"}${highlightOfferCta ? " public-profile-hero__cta-btn--entry-highlight" : ""}`}
      onClick={() => {
        trackProductEvent({
          event: "cta_click",
          location: "public_profile_brand",
          label: "isu_birligi_teklifi_gonder",
          brandUserId,
          variant: getProfileCtaAbVariantForTrack(),
        });
        setOpen(true);
      }}
    >
      İş birliği teklifi gönder
    </button>
  );

  const chatEl =
    hasChat && chatHref ? (
      <TrackedChatOpenLink
              href={chatHref}
              className={`btn public-profile-hero__cta-btn ${offerIsPrimary ? "secondary public-profile-hero__cta-btn--offer-when-chat" : "public-profile-hero__cta-btn--prominent public-profile-hero__cta-btn--chat-primary"}`}
              location="public_profile_brand"
              label="sohbete_git"
            >
        Sohbete git
      </TrackedChatOpenLink>
    ) : null;

  const offerWrap = (
    <div
      className={
        hasChat ? "public-profile-hero__cta-primary" : "public-profile-hero__cta-primary public-profile-hero__cta-primary--full"
      }
    >
      {offerButton}
    </div>
  );

  return (
    <>
      <div className="public-profile-cta-conversion-belt">
        {cameFromDiscover ? <p className="public-profile-hero__entry-context">Keşfet’ten geldiniz</p> : null}
        <PublicProfileHeroTrustChips
          averageRating={averageRating}
          ratingCount={ratingCount}
          completedCollaborationsCount={completedCollaborationsCount}
        />

        <div
          className={`public-profile-hero__cta-row public-profile-hero__cta-row--conversion${
            hasChat ? " public-profile-hero__cta-row--has-chat" : ""
          }`}
        >
          {!hasChat ? (
            offerWrap
          ) : abVariant === "B" ? (
            <>
              {offerWrap}
              {chatEl}
            </>
          ) : (
            <>
              {chatEl}
              {offerWrap}
            </>
          )}
        </div>

        <p className="public-profile-hero__cta-micro-trust">{trustLine}</p>
        <p className="public-profile-hero__cta-action-hint">{hint}</p>
      </div>

      {open ? (
        <div className="public-collab-modal" role="presentation">
          <button
            type="button"
            className="public-collab-modal__backdrop"
            aria-label="Kapat"
            onClick={close}
          />
          <div
            ref={panelRef}
            className="public-collab-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="public-collab-modal__title">
              Markaya teklif gönder
            </h2>
            <form className="public-collab-modal__form" onSubmit={onSubmit}>
              <label htmlFor={`${dialogId}-title`}>Kampanya başlığı</label>
              <input id={`${dialogId}-title`} name="title" type="text" required autoComplete="off" />
              <label htmlFor={`${dialogId}-brief`}>Kısa açıklama</label>
              <textarea id={`${dialogId}-brief`} name="brief" required rows={3} />
              <label htmlFor={`${dialogId}-budget`}>Teklif tutarı (TRY)</label>
              <input
                id={`${dialogId}-budget`}
                name="budget"
                type="number"
                required
                min={100}
                step={100}
                defaultValue={5000}
              />
              {err ? <p className="public-collab-modal__error">{err}</p> : null}
              <div className="public-collab-modal__actions">
                <button type="button" className="btn secondary" onClick={close} disabled={sending}>
                  İptal
                </button>
                <button type="submit" className="btn public-collab-modal__submit" disabled={sending}>
                  {sending ? "Gönderiliyor…" : "Teklifi gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
