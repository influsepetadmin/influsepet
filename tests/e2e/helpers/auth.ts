import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { E2E_FIXTURE } from "./e2eFixture";

export async function loginAsInfluencer(page: Page) {
  await page.goto("/?mode=login&role=INFLUENCER");
  await page.getByLabel("E-posta").fill(E2E_FIXTURE.influencer.email);
  await page.getByLabel("Şifre", { exact: true }).fill(E2E_FIXTURE.password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).toHaveURL(/\/influencer/);
}

export async function loginAsBrand(page: Page) {
  await page.goto("/?mode=login&role=BRAND");
  await page.getByLabel("E-posta").fill(E2E_FIXTURE.brand.email);
  await page.getByLabel("Şifre", { exact: true }).fill(E2E_FIXTURE.password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).toHaveURL(/\/marka/);
}

export async function loginAsOtherInfluencer(page: Page) {
  await page.goto("/?mode=login&role=INFLUENCER");
  await page.getByLabel("E-posta").fill(E2E_FIXTURE.otherInfluencer.email);
  await page.getByLabel("Şifre", { exact: true }).fill(E2E_FIXTURE.password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).toHaveURL(/\/influencer/);
}
