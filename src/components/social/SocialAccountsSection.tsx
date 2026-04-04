"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { SocialAccountCard, type SocialAccountCardData } from "./SocialAccountCard";
import { ConnectSocialAccountForm } from "./ConnectSocialAccountForm";
import { VerifySocialAccountForm } from "./VerifySocialAccountForm";

/** Row from GET /api/social-accounts/mine (verificationCode only while not verified). */
export type DashboardSocialAccount = SocialAccountCardData & {
  verificationCode: string | null;
};

type MineResponse = {
  ok?: boolean;
  socialAccounts?: DashboardSocialAccount[];
  error?: string;
};

export function SocialAccountsSection() {
  const [accounts, setAccounts] = useState<DashboardSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/social-accounts/mine", { cache: "no-store" });
      const data = (await res.json()) as MineResponse;
      if (!res.ok) {
        setLoadError(data.error ?? "Liste alınamadı.");
        return;
      }
      const list = Array.isArray(data.socialAccounts) ? data.socialAccounts : [];
      setAccounts(
        list.map((row) => ({
          ...row,
          verificationCode: row.verificationCode ?? null,
        })),
      );
    } catch {
      setLoadError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section
      className="dash-card dash-card--section social-accounts-section"
      aria-labelledby="dash-social-heading"
    >
      <h2 id="dash-social-heading" className="dash-section__title">
        Sosyal hesaplar
      </h2>
      <p className="dash-section__lede muted">
        Instagram, TikTok veya YouTube hesabınızı bağlayıp doğrulama durumunu buradan yönetebilirsiniz.
      </p>

      {loading && (
        <div className="social-accounts-skeleton" aria-hidden>
          <div className="skeleton skeleton-block" style={{ height: 56, marginBottom: 10 }} />
          <div className="skeleton skeleton-line skeleton-line--short" />
        </div>
      )}
      {loadError ? <p className="social-accounts-section__error">{loadError}</p> : null}

      {!loading && !loadError && (
        <>
          {accounts.length === 0 && (
            <EmptyStateCard
              icon="📱"
              title="Bağlı sosyal hesap yok"
              description="Aşağıdaki formdan hesap ekleyerek doğrulama adımına geçebilirsiniz."
            />
          )}
          {accounts.length > 0 && (
            <div className="social-accounts-list">
              {accounts.map((a) => (
                <div key={a.id} className="social-accounts-stack__item">
                  <SocialAccountCard account={a} />
                  {!a.isVerified && (
                    <VerifySocialAccountForm
                      socialAccountId={a.id}
                      verificationCode={a.verificationCode}
                      onVerified={refresh}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <ConnectSocialAccountForm
            onConnected={() => {
              void refresh();
            }}
          />
        </>
      )}
    </section>
  );
}
