"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorStateCard } from "@/components/feedback/ErrorStateCard";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorStateCard
      title="Bir hata oluştu"
      description="Bu sayfa yüklenirken beklenmeyen bir sorun oluştu."
      footer="Sorun devam ederse destek@influsepet.com adresine ulaşabilirsiniz."
    >
      <button type="button" className="btn" onClick={() => reset()}>
        Tekrar dene
      </button>
      <Link className="btn secondary" href="/">
        Ana sayfaya dön
      </Link>
    </ErrorStateCard>
  );
}
