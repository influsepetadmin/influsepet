import { test, expect } from "@playwright/test";
import { SMOKE_UNKNOWN_PATH } from "../helpers/constants";

test.describe("smoke: global 404", () => {
  test("unknown path shows not-found page with title", async ({ page }) => {
    const res = await page.goto(SMOKE_UNKNOWN_PATH);
    expect(res?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "Sayfa bulunamadı", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ana sayfaya dön" })).toBeVisible();
  });
});
