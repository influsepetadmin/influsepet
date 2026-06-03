"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewStatus = "VERIFIED" | "REJECTED";

export function AdminSocialVerificationActions({ socialAccountId }: { socialAccountId: string }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<ReviewStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(status: ReviewStatus) {
    setPendingStatus(status);
    setError(null);
    try {
      const res = await fetch("/api/social-accounts/admin-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialAccountId, status }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "İşlem tamamlanamadı.");
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <div className="admin-social-verification-actions">
      <button
        type="button"
        className="btn btn--sm"
        disabled={pendingStatus !== null}
        onClick={() => void review("VERIFIED")}
      >
        {pendingStatus === "VERIFIED" ? "…" : "Onayla"}
      </button>
      <button
        type="button"
        className="btn secondary btn--subtle btn--sm"
        disabled={pendingStatus !== null}
        onClick={() => void review("REJECTED")}
      >
        {pendingStatus === "REJECTED" ? "…" : "Reddet"}
      </button>
      {error ? <p className="admin-social-verification-actions__error">{error}</p> : null}
    </div>
  );
}
