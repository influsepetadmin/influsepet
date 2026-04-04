import { test, expect } from "@playwright/test";

test.describe("smoke: protected routes (unauthenticated)", () => {
  test("visiting /influencer redirects to auth landing with influencer login hint", async ({ page }) => {
    await page.goto("/influencer");

    await expect(page).toHaveURL(/[?&]role=INFLUENCER/);
    await expect(page).toHaveURL(/[?&]mode=login/);
    await expect(page.getByRole("heading", { name: "Giriş", level: 2 })).toBeVisible();
  });

  test("visiting /marka redirects to auth landing with brand login hint", async ({ page }) => {
    await page.goto("/marka");

    await expect(page).toHaveURL(/[?&]role=BRAND/);
    await expect(page).toHaveURL(/[?&]mode=login/);
    await expect(page.getByRole("heading", { name: "Giriş", level: 2 })).toBeVisible();
  });
});
