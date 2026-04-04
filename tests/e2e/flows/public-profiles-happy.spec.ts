import { test, expect } from "@playwright/test";
import { E2E_FIXTURE } from "../helpers/e2eFixture";

test.describe("e2e: public profiles (seed kullanıcıları)", () => {
  test("influencer /u/[username] hero ve istatistikler", async ({ page }) => {
    await page.goto(`/u/${E2E_FIXTURE.influencer.publicUsername}`);
    await expect(page.getByRole("heading", { name: E2E_FIXTURE.influencer.name, level: 1 })).toBeVisible();
    await expect(page.getByText(`@${E2E_FIXTURE.influencer.publicUsername}`)).toBeVisible();
    await expect(page.getByText("Tamamlanan iş birliği", { exact: false })).toBeVisible();
    await expect(page.getByText("Ortalama puan", { exact: false })).toBeVisible();
  });

  test("marka /brand/[username] hero ve istatistikler", async ({ page }) => {
    await page.goto(`/brand/${E2E_FIXTURE.brand.publicUsername}`);
    await expect(page.getByRole("heading", { name: E2E_FIXTURE.brand.companyName, level: 1 })).toBeVisible();
    await expect(page.getByText(`@${E2E_FIXTURE.brand.publicUsername}`)).toBeVisible();
    await expect(page.getByText("Tamamlanan iş birliği", { exact: false })).toBeVisible();
  });
});
