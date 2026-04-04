import { test, expect } from "@playwright/test";

test.describe("smoke: chat (unauthenticated)", () => {
  test("/chat shows session required state, not blank page", async ({ page }) => {
    const res = await page.goto("/chat");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Sohbetler" })).toBeVisible();
    await expect(page.getByText("Oturum gerekli")).toBeVisible();
    await expect(page.getByRole("link", { name: "Giriş yap" })).toBeVisible();
  });
});
