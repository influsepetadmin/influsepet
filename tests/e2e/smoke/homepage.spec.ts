import { test, expect } from "@playwright/test";

test.describe("smoke: homepage", () => {
  test("renders auth landing with main landmark, login heading and role controls", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Giriş", level: 2 })).toBeVisible();
    await expect(page.getByText("Rolünü seç", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Influencer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Marka" })).toBeVisible();
  });
});
