import { execSync } from "node:child_process";

/**
 * E2E öncesi DB seed. Atlamak için: E2E_SKIP_DB_SEED=1
 * Veritabanı yoksa uyarı verir; auth akış testleri başarısız olabilir.
 */
export default function globalSetup() {
  if (process.env.E2E_SKIP_DB_SEED === "1") {
    console.log("[e2e global-setup] E2E_SKIP_DB_SEED=1 — seed atlandı.");
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.warn("[e2e global-setup] DATABASE_URL tanımlı değil — db:seed:e2e atlanıyor.");
    return;
  }
  execSync("npm run db:seed:e2e", { stdio: "inherit", cwd: process.cwd(), env: process.env });
}
