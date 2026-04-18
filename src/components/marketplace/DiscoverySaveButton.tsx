"use client";

import { Bookmark } from "lucide-react";

/** Favori / kaydet — gelecekte API ile bağlanacak; şimdilik görsel yer tutucu. */
export function DiscoverySaveButton({
  label = "Kaydet",
  title = "Yakında: kayıtlı listeye ekle",
}: {
  label?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="discovery-save-btn"
      disabled
      title={title}
      aria-label={title}
    >
      <Bookmark size={18} strokeWidth={1.75} aria-hidden />
      <span className="discovery-save-btn__text">{label}</span>
    </button>
  );
}
