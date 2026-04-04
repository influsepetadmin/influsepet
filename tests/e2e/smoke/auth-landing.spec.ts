import { test, expect } from "@playwright/test";

test.describe("smoke: auth landing (login mode)", () => {
  test("on / shows login form fields and submit without errors", async ({ page }) => {
    const res = await page.goto("/?mode=login&role=INFLUENCER");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Giriş", level: 2 })).toBeVisible();
    await expect(page.getByLabel("E-posta")).toBeVisible();
    await expect(page.getByLabel("Şifre", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeVisible();
  });

  test("/giris mirrors login mode with same form affordances", async ({ page }) => {
    const res = await page.goto("/giris?mode=login");
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Giriş", level: 2 })).toBeVisible();
    await expect(page.getByLabel("E-posta")).toBeVisible();
    await expect(page.getByLabel("Şifre", { exact: true })).toBeVisible();
  });
});
