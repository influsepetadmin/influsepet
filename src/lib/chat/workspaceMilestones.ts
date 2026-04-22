import type { DeliveryStatus, OfferStatus } from "@prisma/client";

export type MilestoneUiState = "done" | "current" | "upcoming" | "muted";

export type WorkspaceMilestone = {
  key: string;
  label: string;
  state: MilestoneUiState;
};

/** High-level lifecycle strip for the chat workspace (offer-level, not per-message). */
export function buildWorkspaceMilestones(offerStatus: OfferStatus): WorkspaceMilestone[] {
  const base = (): WorkspaceMilestone[] => [
    { key: "sent", label: "Teklif gönderildi", state: "done" },
    { key: "accepted", label: "Kabul edildi", state: "upcoming" },
    { key: "delivered", label: "Teslim edildi", state: "upcoming" },
    { key: "rated", label: "Puanlandı", state: "upcoming" },
  ];

  if (offerStatus === "REJECTED" || offerStatus === "CANCELLED") {
    const m = base();
    m[0].state = "done";
    m[1].label = offerStatus === "REJECTED" ? "Reddedildi" : "İptal edildi";
    m[1].state = "muted";
    m[2].state = "muted";
    m[3].state = "muted";
    return m;
  }

  if (offerStatus === "DISPUTED") {
    const m = base();
    m[0].state = "done";
    m[1].state = "done";
    m[2].state = "current";
    m[2].label = "Anlaşmazlık";
    m[3].state = "upcoming";
    return m;
  }

  const m = base();

  if (offerStatus === "PENDING") {
    m[1].state = "current";
    return m;
  }

  m[0].state = "done";
  m[1].state = "done";

  if (offerStatus === "ACCEPTED") {
    m[2].state = "current";
    m[2].label = "Teslim bekleniyor";
    return m;
  }

  if (offerStatus === "IN_PROGRESS") {
    m[2].state = "current";
    m[2].label = "Teslim bekleniyor";
    return m;
  }

  if (offerStatus === "REVISION_REQUESTED") {
    m[2].state = "current";
    m[2].label = "Revize / teslim";
    m[3].state = "upcoming";
    return m;
  }

  if (offerStatus === "DELIVERED") {
    m[2].state = "done";
    m[3].state = "current";
    m[3].label = "Tamamlanıyor";
    return m;
  }

  if (offerStatus === "COMPLETED") {
    m[2].state = "done";
    m[3].state = "done";
    return m;
  }

  return m;
}

export type WorkspacePillTone =
  | "pending"
  | "progress"
  | "success"
  | "neutral"
  | "danger"
  | "warning"
  | "waiting";

/** Primary collaboration status — compact copy aligned with workspace pills. */
export function workspaceOfferPill(offerStatus: OfferStatus): { text: string; tone: WorkspacePillTone } {
  const map: Record<OfferStatus, { text: string; tone: WorkspacePillTone }> = {
    PENDING: { text: "Bekliyor", tone: "pending" },
    ACCEPTED: { text: "Kabul edildi", tone: "success" },
    REJECTED: { text: "Reddedildi", tone: "danger" },
    CANCELLED: { text: "İptal edildi", tone: "danger" },
    IN_PROGRESS: { text: "Teslim bekleniyor", tone: "progress" },
    DELIVERED: { text: "Teslim edildi", tone: "success" },
    REVISION_REQUESTED: { text: "Revize istendi", tone: "warning" },
    COMPLETED: { text: "Tamamlandı", tone: "success" },
    DISPUTED: { text: "Anlaşmazlık", tone: "warning" },
  };
  return map[offerStatus] ?? { text: offerStatus, tone: "neutral" };
}

/** Secondary pill from latest delivery row (avoid when offer already completed). */
export function workspaceDeliveryPill(
  offerStatus: OfferStatus,
  latest: { status: DeliveryStatus } | null,
): { text: string; tone: WorkspacePillTone } | null {
  if (offerStatus === "COMPLETED" || offerStatus === "REJECTED" || offerStatus === "CANCELLED") {
    return null;
  }

  if (!latest) {
    if (offerStatus === "IN_PROGRESS" || offerStatus === "ACCEPTED") {
      return { text: "Henüz teslim yok", tone: "waiting" };
    }
    return null;
  }

  switch (latest.status) {
    case "SUBMITTED":
      return { text: "Teslim inceleniyor", tone: "progress" };
    case "APPROVED":
      return { text: "Teslim onaylandı", tone: "success" };
    case "REVISION_REQUESTED":
      return { text: "Revize bekleniyor", tone: "warning" };
    default:
      return null;
  }
}
