import { test, expect } from "@playwright/test";
import { E2E_FIXTURE } from "../helpers/e2eFixture";
import { loginAsBrand, loginAsInfluencer } from "../helpers/auth";

test.describe("e2e: sohbet ve iş birliği puanı", () => {
  test("tamamlanan teklif sohbeti — influencer: puan paneli readonly", async ({ page }) => {
    await loginAsInfluencer(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.completedId}`);

    await expect(page.getByRole("link", { name: /Sohbetler/i })).toBeVisible();
    await expect(page.getByPlaceholder("Mesaj yazın…")).toBeVisible();
    await expect(page.getByRole("button", { name: "Gönder" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "İş birliği puanı" })).toBeVisible();
    await expect(page.getByText("Sizin puanınız")).toBeVisible();
    await expect(page.getByText("Puan verildi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Puanı gönder" })).toHaveCount(0);
  });

  test("tamamlanan teklif sohbeti — marka: karşı tarafın puanı + kendi puan formu", async ({ page }) => {
    await loginAsBrand(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.completedId}`);

    await expect(page.getByPlaceholder("Mesaj yazın…")).toBeVisible();
    await expect(page.getByRole("heading", { name: "İş birliği puanı" })).toBeVisible();
    await expect(page.getByText(/Karşı taraf size/)).toBeVisible();
    await expect(page.getByText(/yıldız verdi/)).toBeVisible();
    await expect(page.getByText("Karşı tarafı puanlayın")).toBeVisible();
  });

  test("devam eden teklif sohbeti — iş birliği puanı bölümü yok", async ({ page }) => {
    await loginAsInfluencer(page);
    await page.goto(`/chat/${E2E_FIXTURE.conversations.inProgressId}`);

    await expect(page.getByPlaceholder("Mesaj yazın…")).toBeVisible();
    await expect(page.getByRole("heading", { name: "İş birliği puanı" })).toHaveCount(0);
  });
});
