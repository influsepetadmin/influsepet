"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { submitInfluencerCollaborationRequest } from "@/lib/collaboration/submitInfluencerCollaborationRequest";
import { getProfileCtaAbVariantForTrack, useProfileCtaAbVariant } from "@/lib/productTracking/profileCtaAb";
import { trackFirstTimeOnce, trackProductEvent } from "@/lib/productTracking/productEvents";
import { TrackedChatOpenLink } from "@/components/tracking/TrackedChatOpenLink";
import { PublicProfileHeroTrustChips } from "@/components/profile/public/PublicProfileHeroTrustChips";

const CTA_ENTRY_HIGHLIGHT_MS = 2400;
const CTA_ENTRY_HIGHLIGHT_SESSION_KEY = "influsepet_profile_cta_highlight_seen";

function actionHintLine(
  hasChat: boolean,
  completedCollaborationsCount: number,
  ratingCount: number,
): string {
  if (hasChat) {
    return "Önce sohbeti açın; gerekirse aynı yerden yeni teklif de gönderebilirsiniz.";
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

export function PublicCollaborationRequestCta({
  influencerUserId,
  defaultBudgetTRY,
  chatHref,
  averageRating,
  ratingCount,
  completedCollaborationsCount,
  cameFromDiscover = false,
}: {
  influencerUserId: string;
  defaultBudgetTRY: number;
  chatHref?: string | null;
  averageRating: number | null;
  ratingCount: number;
  completedCollaborationsCount: number;
  cameFromDiscover?: boolean;
}) {
  const dialogId = useId();
  const titleId = `${dialogId}-modal-title`;
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [sending, setSending] = useState(false);
  const [highlightOfferCta, setHighlightOfferCta] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const defaultAmt =
    defaultBudgetTRY > 0 ? Math.max(100, Math.ceil(defaultBudgetTRY / 100) * 100) : 100;
  const abVariant = useProfileCtaAbVariant();

  const close = useCallback(() => setOpen(false), []);

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
    if (!toast) return;
    const t = window.setTimeout(() => setToast(false), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

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
    const budgetTry = Number.parseInt(budgetRaw, 10);
    if (!title || !brief || !Number.isFinite(budgetTry)) return;

    setSending(true);
    const res = await submitInfluencerCollaborationRequest(influencerUserId, {
      campaignTitle: title,
      description: brief,
      budgetTry,
    });
    setSending(false);
    if (!res.ok) return;

    trackProductEvent({
      event: "collaboration_request_sent",
      location: "public_profile_influencer",
      label: "brand_to_influencer_flow",
      influencerUserId,
    });
    trackFirstTimeOnce("influsepet_ft_public_collab_request_brand", {
      event: "first_collaboration_request_sent",
      location: "public_profile_influencer",
    });

    close();
    form.reset();
    setToast(true);
  }

  const hasChat = Boolean(chatHref);
  const hint = actionHintLine(hasChat, completedCollaborationsCount, ratingCount);
  const trustLine = microTrustLine(completedCollaborationsCount, ratingCount);
  /** A: sohbet varsa sohbet önce (primary). B: teklif her zaman primary. */
  const offerIsPrimary = !hasChat || abVariant === "B";

  const offerButton = (
    <button
      type="button"
      className={`btn public-profile-hero__cta-btn ${offerIsPrimary ? "public-profile-hero__cta-btn--prominent" : "secondary public-profile-hero__cta-btn--offer-when-chat"}${highlightOfferCta ? " public-profile-hero__cta-btn--entry-highlight" : ""}`}
      onClick={() => {
        trackProductEvent({
          event: "cta_click",
          location: "public_profile_influencer",
          label: "isu_birligi_teklifi_gonder",
          influencerUserId,
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
              location="public_profile_influencer"
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
              İş birliği teklifi gönder
            </h2>
            <form className="public-collab-modal__form" onSubmit={onSubmit}>
              <label htmlFor={`${dialogId}-campaign-title`}>Kampanya başlığı</label>
              <input
                id={`${dialogId}-campaign-title`}
                name="title"
                type="text"
                required
                autoComplete="off"
              />
              <label htmlFor={`${dialogId}-brief`}>Kısa açıklama</label>
              <textarea id={`${dialogId}-brief`} name="brief" required rows={3} />
              <label htmlFor={`${dialogId}-budget`}>Bütçe (TRY)</label>
              <input
                id={`${dialogId}-budget`}
                name="budget"
                type="number"
                required
                min={100}
                step={100}
                defaultValue={defaultAmt}
              />
              <div className="public-collab-modal__actions">
                <button type="button" className="btn secondary" onClick={close} disabled={sending}>
                  İptal
                </button>
                <button type="submit" className="btn public-collab-modal__submit" disabled={sending}>
                  {sending ? "Gönderiliyor…" : "İsteği gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="public-collab-toast" role="status" aria-live="polite">
          İş birliği teklifi gönderildi
        </div>
      ) : null}
    </>
  );
}
