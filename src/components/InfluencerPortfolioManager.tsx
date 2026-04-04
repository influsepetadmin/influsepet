"use client";

import { useMemo, useState } from "react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";

type Item = { id: string; title: string | null; url: string; platform: string };

function platformLabel(p: string): string {
  switch (p) {
    case "INSTAGRAM":
      return "Instagram";
    case "TIKTOK":
      return "TikTok";
    case "OTHER":
      return "Diğer";
    default:
      return p;
  }
}

export default function InfluencerPortfolioManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const canAdd = useMemo(() => url.trim().length > 0, [url]);

  async function add() {
    setErr(null);
    const res = await fetch("/api/portfolio/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform, title: title.trim() || null, url: url.trim() }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErr((data && data.error) || "Eklenemedi");
      return;
    }
    if (data?.item) {
      setItems((prev) => [
        { id: data.item.id, title: data.item.title, url: data.item.url, platform: data.item.platform },
        ...prev,
      ]);
      setTitle("");
      setUrl("");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/portfolio/items/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="portfolio-manager">
      {err ? <p className="portfolio-manager__err">{err}</p> : null}

      <div className="portfolio-add-panel">
        <p className="portfolio-add-panel__title">Yeni öğe ekle</p>
        <p className="portfolio-add-panel__hint muted">
          Örnek işlerinizin bağlantılarını ekleyin; ziyaretçiler profilinizde görebilir.
        </p>
        <div className="portfolio-add-panel__fields">
          <div className="portfolio-add-panel__field">
            <label htmlFor="portfolio-platform">Platform</label>
            <select
              id="portfolio-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
              <option value="OTHER">Diğer</option>
            </select>
          </div>
          <div className="portfolio-add-panel__field portfolio-add-panel__field--grow">
            <label htmlFor="portfolio-title">Başlık (opsiyonel)</label>
            <input
              id="portfolio-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Ürün tanıtımı"
            />
          </div>
          <div className="portfolio-add-panel__field portfolio-add-panel__field--full">
            <label htmlFor="portfolio-url">URL</label>
            <input
              id="portfolio-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="portfolio-add-panel__submit">
            <button className="btn" type="button" disabled={!canAdd} onClick={() => void add()}>
              Ekle
            </button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyStateCard
          icon="🖼️"
          title="Portföyde henüz öğe yok"
          description="Örnek içeriklerinizin bağlantılarını ekleyerek profilinizi güçlendirin."
        />
      ) : (
        <ul className="portfolio-item-list">
          {items.map((it) => (
            <li key={it.id} className="portfolio-item-card">
              <div
                className={`portfolio-item-card__thumb portfolio-item-card__thumb--${it.platform.toLowerCase()}`}
                aria-hidden
              />
              <div className="portfolio-item-card__body">
                <p className="portfolio-item-card__title">{it.title?.trim() || "Başlıksız öğe"}</p>
                <p className="portfolio-item-card__platform">{platformLabel(it.platform)}</p>
                <p className="portfolio-item-card__url muted">
                  <a href={it.url} target="_blank" rel="noreferrer">
                    Bağlantıyı aç
                  </a>
                </p>
                <div className="portfolio-item-card__actions">
                  <a className="btn secondary btn--sm" href={it.url} target="_blank" rel="noreferrer">
                    Görüntüle
                  </a>
                  <button className="btn secondary btn--subtle btn--sm" type="button" onClick={() => void remove(it.id)}>
                    Kaldır
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
