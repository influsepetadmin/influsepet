import { test, expect } from "@playwright/test";
import { SMOKE_NONEXISTENT_USERNAME } from "../helpers/constants";

test.describe("smoke: public profiles (not found)", () => {
  test(`/u/[username] shows not-found when profile does not exist`, async ({ page }) => {
    const res = await page.goto(`/u/${SMOKE_NONEXISTENT_USERNAME}`);
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Profil bulunamadı", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ana sayfaya dön" })).toBeVisible();
  });

  test(`/brand/[username] shows not-found when brand profile does not exist`, async ({ page }) => {
    const res = await page.goto(`/brand/${SMOKE_NONEXISTENT_USERNAME}`);
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Marka profili bulunamadı", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ana sayfaya dön" })).toBeVisible();
  });
});
