import type { OfferStatus } from "@prisma/client";

const LABELS: Record<OfferStatus, string> = {
  PENDING: "Bekliyor",
  ACCEPTED: "Kabul edildi",
  REJECTED: "Reddedildi",
  CANCELLED: "İptal edildi",
  IN_PROGRESS: "Çalışılıyor",
  DELIVERED: "Teslim edildi",
  REVISION_REQUESTED: "Revize istendi",
  COMPLETED: "Tamamlandı",
  DISPUTED: "Anlaşmazlık",
};

export function statusBadgeLabel(status: OfferStatus): string {
  return LABELS[status] ?? status;
}

function statusClass(status: OfferStatus): string {
  const map: Record<OfferStatus, string> = {
    PENDING: "status-badge--pending",
    ACCEPTED: "status-badge--accepted",
    REJECTED: "status-badge--rejected",
    CANCELLED: "status-badge--cancelled",
    IN_PROGRESS: "status-badge--in-progress",
    DELIVERED: "status-badge--delivered",
    REVISION_REQUESTED: "status-badge--revision",
    COMPLETED: "status-badge--completed",
    DISPUTED: "status-badge--disputed",
  };
  return map[status] ?? "status-badge--pending";
}

export function StatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span className={`status-badge ${statusClass(status)}`} title={LABELS[status]}>
      {LABELS[status] ?? status}
    </span>
  );
}
