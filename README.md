# InfluSepet

Marketplace-style web app connecting **brands** and **influencers**: profiles, collaboration offers, chat (with media), social account linking, reviews, and portfolio items. Payments (e.g. iyzico) are **not** implemented in the current codebase.

## Tech stack

- **Runtime:** Node.js
- **Framework:** Next.js 15 (App Router), React 19
- **Database:** PostgreSQL via **Prisma**
- **Auth:** Custom session cookie (HMAC-signed), not NextAuth in app code
- **Styling:** Global CSS (`src/app/globals.css`)

## Local setup

1. **Node.js** — use an LTS version compatible with Next.js 15 (e.g. 20.x).
2. **PostgreSQL** — create a database for the app (e.g. `createdb influsepet`).
3. **Environment file**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`: set `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_PUBLIC_SITE_URL` for local (see below).

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Database schema**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

   This applies migrations and keeps the database in sync with `prisma/schema.prisma`.

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

## Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Used by Prisma. |
| `SESSION_SECRET` | **Yes in production** | At least **32 characters**, random. Used to sign session cookies. In development, a dev fallback exists if unset. |
| `NEXT_PUBLIC_SITE_URL` | **Strongly recommended** | Public site origin, **no trailing slash** (e.g. `https://example.com`). Used for metadata, sitemap, canonical URLs. **Set at build time** for production so client code sees the correct value. |
| `VERCEL_URL` | Optional | On Vercel, often set automatically. Used only as a fallback in `getSiteOrigin()` when `NEXT_PUBLIC_SITE_URL` is unset. |

See `.env.example` for placeholders. **Never commit real secrets or production `.env`.**

## Database / Prisma

- Schema: `prisma/schema.prisma`
- Client: generated to `node_modules/@prisma/client` via `prisma generate` (also runs on `npm install` if configured, or run explicitly after schema changes).
- Migrations live under `prisma/migrations/`.

**Production:** use `prisma migrate deploy` (see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)).

## Development commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (typecheck + lint during build) |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `npx prisma studio` | Browse DB in a GUI (optional) |

### E2E (Playwright)

Tests live under `tests/e2e/` (`smoke/`, `auth/`, `flows/`). The default `baseURL` is `http://127.0.0.1:3000`; override with `PLAYWRIGHT_BASE_URL` if needed.

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run Playwright (starts `npm run dev` unless a server is already up locally) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:headed` | Run with a visible browser |
| `npm run test:e2e:debug` | Step-through debugging |
| `npm run db:seed:e2e` | Insert fixed E2E users + offers + chats (requires `DATABASE_URL` and current migrations) |

**Auth / data-dependent tests** require PostgreSQL with migrations applied. Playwright `globalSetup` runs `db:seed:e2e` when `DATABASE_URL` is set; set `E2E_SKIP_DB_SEED=1` to skip. Optional `E2E_TEST_PASSWORD` overrides the default password in `tests/e2e/helpers/e2eFixture.ts`.

`db:seed:e2e` creates two ana E2E kullanıcıları (influencer + marka), sabit teklif/sohbet/teslim satırları ve **üçüncü** bir influencer (yalnızca yetkisiz sohbet erişimi senaryosu için).

First-time setup: install browser binaries with `npx playwright install chromium` (or `npx playwright install` for all).

## Build & quality

- **`npm run build`** — should pass before releases; it runs lint and TypeScript checks as part of the Next.js build.
- **`npm run lint`** — run ad-hoc or in CI.

## Migrations (summary)

- **Local:** `npx prisma migrate dev` — creates/applying migrations during development.
- **Production:** `npx prisma migrate deploy` — applies pending migrations without prompting.

Full sequencing, failure modes, and the recent `nicheText` change are documented in **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**.

## Uploads & storage

The app stores files on the **local filesystem** relative to the process working directory:

| Path | Purpose |
|------|---------|
| `public/uploads/profile-images/` | Profile images (served as static files under `/uploads/profile-images/...`) |
| `private/collab-media/` | Chat / collaboration media (served via authenticated API routes, not public static) |

**Production implications:** default hosting with **ephemeral disks** (e.g. many serverless/container setups) will **lose uploads** on redeploy or new instances unless you use **persistent volumes**, **object storage (S3-compatible)**, or equivalent. Plan storage before launch.

Ensure upload directories exist and are writable where you deploy, or replace with external storage in a future change.

## Production / deployment (overview)

1. Set environment variables on the host (especially `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`).
2. Run **`prisma migrate deploy`** against the production database **before** or as part of the deployment that expects the new schema (see checklist).
3. Run **`npm run build`** with production env (especially `NEXT_PUBLIC_*` at build time).
4. Start with **`npm run start`** (or your platform’s equivalent).

**Known risks** (session security, migrations, URLs, disk storage) are listed in **DEPLOYMENT_CHECKLIST.md** — read that before going live.

---

## License

See `package.json` (`license` field).
