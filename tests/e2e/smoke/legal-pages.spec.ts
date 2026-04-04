import { test, expect } from "@playwright/test";

const LEGAL_PAGES: { path: string; heading: string }[] = [
  { path: "/kullanim-kosullari", heading: "Kullanım Koşulları" },
  { path: "/gizlilik-politikasi", heading: "Gizlilik Politikası" },
  { path: "/kvkk-aydinlatma-metni", heading: "KVKK Aydınlatma Metni" },
];

test.describe("smoke: legal pages", () => {
  for (const { path, heading } of LEGAL_PAGES) {
    test(`renders ${heading} at ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();

      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      await expect(page.getByRole("article")).toBeVisible();
    });
  }
});
