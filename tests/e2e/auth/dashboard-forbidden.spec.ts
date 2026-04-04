import { test, expect } from "@playwright/test";
import { loginAsBrand, loginAsInfluencer } from "../helpers/auth";

test.describe("e2e: yanlış rol ile dashboard", () => {
  test("influencer oturumuyla /marka — erişim engeli", async ({ page }) => {
    await loginAsInfluencer(page);
    await page.goto("/marka");
    await expect(page.getByRole("heading", { level: 1, name: /Bu alan marka hesapları içindir/ })).toBeVisible();
    await expect(page.getByText(/influencer hesabıyla giriş yaptınız/i)).toBeVisible();
  });

  test("marka oturumuyla /influencer — erişim engeli", async ({ page }) => {
    await loginAsBrand(page);
    await page.goto("/influencer");
    await expect(page.getByRole("heading", { level: 1, name: /Bu alan influencer hesapları içindir/ })).toBeVisible();
    await expect(page.getByText(/marka hesabıyla giriş yaptınız/i)).toBeVisible();
  });
});
