import type { Metadata } from "next";
import Link from "next/link";
import { ErrorStateCard } from "@/components/feedback/ErrorStateCard";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  description: "Aradığınız sayfa InfluSepet üzerinde bulunamadı.",
};

export default function NotFound() {
  return (
    <ErrorStateCard
      title="Sayfa bulunamadı"
      description="Aradığınız sayfa kaldırılmış, taşınmış veya hiç var olmamış olabilir."
      footer="URL adresini kontrol edip tekrar deneyebilirsiniz."
    >
      <Link className="btn" href="/">
        Ana sayfaya dön
      </Link>
      <Link className="btn secondary" href="/giris">
        Giriş yap
      </Link>
    </ErrorStateCard>
  );
}
