import { test, expect } from "@playwright/test";
import { E2E_FIXTURE } from "../helpers/e2eFixture";
import { loginAsBrand, loginAsInfluencer, loginAsOtherInfluencer } from "../helpers/auth";

test.describe("e2e: teklif ve teslim görünürlüğü", () => {
  test("bekleyen teklif — influencer listede görür; marka gönderdiği listede görür", async ({ page }) => {
    await loginAsInfluencer(page);
    await expect(
      page.getByRole("heading", { name: /Markalardan gelen iş birliği istekleri/i }),
    ).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: E2E_FIXTURE.titles.pending })).toBeVisible();

    await page.context().clearCookies();
    await loginAsBrand(page);
    await expect(
      page.getByRole("heading", { name: /gönderdiğin iş birliği istekleri/i }),
    ).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: E2E_FIXTURE.titles.pending })).toBeVisible();
  });

  test("bekleyen teklif — influencer Kabul Et görebilir; marka (gönderen) Kabul Et göremez", async ({
    page,
  }) => {
    await loginAsInfluencer(page);
    const recv = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Markalardan gelen/i }),
    });
    const pendingCard = recv.getByRole("article").filter({ hasText: E2E_FIXTURE.titles.pending });
    await expect(pendingCard.getByRole("button", { name: "Kabul Et" })).toBeVisible();

    await page.context().clearCookies();
    await loginAsBrand(page);
    const sent = page.locator("section").filter({
      has: page.getByRole("heading", { name: /gönderdiğin iş birliği istekleri/i }),
    });
    const brandPendingCard = sent.getByRole("article").filter({ hasText: E2E_FIXTURE.titles.pending });
    await expect(brandPendingCard.getByRole("button", { name: "Kabul Et" })).toHaveCount(0);
  });

  test("reddedilen teklif — kartta Reddedildi durumu", async ({ page }) => {
    await loginAsInfluencer(page);
    const card = page.getByRole("article").filter({ hasText: E2E_FIXTURE.titles.rejected });
    await expect(card.getByText("Reddedildi", { exact: true })).toBeVisible();
  });

  test("devam eden teklif sohbeti — Teslim paneli var, iş birliği puanı yok, başlıkta Çalışılıyor", async ({
    page,
  }) => {
    await loginAsInfluencer(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.inProgressId}`);
    const header = page.locator(".chat-conversation__header");
    await expect(header.getByText("Çalışılıyor")).toBeVisible();
    await expect(header.getByText("Tamamlandı")).toHaveCount(0);

    await expect(page.getByRole("heading", { name: "Teslim" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "İş birliği puanı" })).toHaveCount(0);
  });

  test("devam eden teklif — influencer teslim gönderebilir; marka Teslim Gönder göremez", async ({
    page,
  }) => {
    await loginAsInfluencer(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.inProgressId}`);
    await expect(page.getByLabel("Teslim Bağlantısı")).toBeVisible();
    await expect(page.getByRole("button", { name: "Teslim Gönder" })).toBeVisible();

    await page.context().clearCookies();
    await loginAsBrand(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.inProgressId}`);
    await expect(page.getByRole("button", { name: "Teslim Gönder" })).toHaveCount(0);
  });

  test("teslim edildi (inceleme bekliyor) — marka Onayla / Revize İste görür", async ({ page }) => {
    await loginAsBrand(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.deliveredReviewId}`);
    await expect(page.getByRole("heading", { name: "Teslim" })).toBeVisible();
    await expect(page.getByText("Teslim edildi", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Onayla" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Revize İste" })).toBeVisible();
  });

  test("revize istendi — teslim geçmişinde Revize istendi", async ({ page }) => {
    await loginAsInfluencer(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.revisionRequestedId}`);
    await expect(page.getByText("Revize istendi", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Teslim Geçmişi" })).toBeVisible();
  });

  test("tamamlandı — başlıkta Tamamlandı; teslim gönderme yok; puan bölümü var", async ({ page }) => {
    await loginAsInfluencer(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.completedId}`);
    const header = page.locator(".chat-conversation__header");
    await expect(header.getByText("Tamamlandı")).toBeVisible();
    await expect(header.getByText("Çalışılıyor")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Teslim Gönder" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "İş birliği puanı" })).toBeVisible();
  });

  test("üçüncü influencer — başka tarafın sohbetine erişemez", async ({ page }) => {
    await loginAsOtherInfluencer(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.completedId}`);
    await expect(page.getByRole("heading", { name: /Bu sohbete erişemezsiniz/i })).toBeVisible();
  });
});
