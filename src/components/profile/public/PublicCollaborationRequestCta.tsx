"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { submitInfluencerCollaborationRequest } from "@/lib/collaboration/submitInfluencerCollaborationRequest";

export function PublicCollaborationRequestCta({
  influencerUserId,
  defaultBudgetTRY,
}: {
  influencerUserId: string;
  defaultBudgetTRY: number;
}) {
  const dialogId = useId();
  const titleId = `${dialogId}-modal-title`;
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [sending, setSending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const defaultAmt =
    defaultBudgetTRY > 0 ? Math.max(100, Math.ceil(defaultBudgetTRY / 100) * 100) : 100;

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

    close();
    form.reset();
    setToast(true);
  }

  return (
    <>
      <div className="public-profile-hero__cta public-profile-hero__cta--collab">
        <button type="button" className="btn public-profile-hero__cta-btn" onClick={() => setOpen(true)}>
          İş birliği isteği gönder
        </button>
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
              İş birliği isteği gönder
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
          İş birliği isteği gönderildi
        </div>
      ) : null}
    </>
  );
}
