import { test, expect } from "@playwright/test";
import { E2E_FIXTURE } from "../helpers/e2eFixture";
import { loginAsBrand, loginAsInfluencer } from "../helpers/auth";

test.describe("e2e: login", () => {
  test("influencer hesabı ile giriş — influencer paneli", async ({ page }) => {
    await loginAsInfluencer(page);
    await expect(page.getByRole("heading", { name: "Influencer Paneli", level: 1 })).toBeVisible();
  });

  test("marka hesabı ile giriş — marka paneli", async ({ page }) => {
    await loginAsBrand(page);
    await expect(page.getByRole("heading", { name: "Marka Paneli", level: 1 })).toBeVisible();
  });

  test("influencer e-postası + Marka rolü seçiliyse hata mesajı", async ({ page }) => {
    await page.goto("/?mode=login&role=BRAND");
    await page.getByLabel("E-posta").fill(E2E_FIXTURE.influencer.email);
    await page.getByLabel("Şifre", { exact: true }).fill(E2E_FIXTURE.password);
    await page.getByRole("button", { name: "Giriş Yap" }).click();
    await expect(page.getByRole("alert")).toContainText(/Böyle bir marka hesabı bulunamadı/);
  });

  test("marka e-postası + Influencer rolü seçiliyse hata mesajı", async ({ page }) => {
    await page.goto("/?mode=login&role=INFLUENCER");
    await page.getByLabel("E-posta").fill(E2E_FIXTURE.brand.email);
    await page.getByLabel("Şifre", { exact: true }).fill(E2E_FIXTURE.password);
    await page.getByRole("button", { name: "Giriş Yap" }).click();
    await expect(page.getByRole("alert")).toContainText(/Böyle bir influencer hesabı bulunamadı/);
  });
});
