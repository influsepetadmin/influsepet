# InfluSepet — deployment & migration checklist

Use this for production releases and database operations. **Payments (iyzico) are out of scope** for this document.

---

## 1. Migrations: `prisma migrate deploy`

### What it does

- Applies **pending** SQL migrations from `prisma/migrations/` to the database pointed to by **`DATABASE_URL`**.
- Does **not** create new migration files (that is `prisma migrate dev` in development).

### When to run

- **Every production deployment** that ships code depending on a new or changed schema, **before** the new app version serves traffic that expects that schema.
- Typical order:
  1. Ensure `DATABASE_URL` points at the **production** database.
  2. Run `npx prisma migrate deploy` (or `prisma migrate deploy` via your CI/CD).
  3. Deploy/restart the application.

### If migrations are skipped or run after a bad deploy

- The app may **crash at runtime** (Prisma errors: missing columns/tables) or behave incorrectly.
- **Mitigation:** run `migrate deploy` as soon as possible; roll back the app version if the DB is ahead and incompatible.

### Recent schema note: `nicheText`

- Migration adding **`InfluencerProfile.nicheText`** (nullable text): `prisma/migrations/20260330150000_influencer_niche_text/`.
- Until this migration is applied, production DBs **without** that column will fail Prisma operations touching `InfluencerProfile` if the running code expects `nicheText`.
- **Action:** deploy migrations **before** or **with** the app build that includes the `nicheText` field in the Prisma schema.

### Production DB alignment

- **One canonical `DATABASE_URL` per environment** (staging vs production). Avoid pointing a local `migrate dev` at production.
- After restore from backup, confirm migration history matches (`_prisma_migrations` table) before relying on the app.

---

## 2. Environment variables (production)

| Variable | Risk if wrong / missing |
|----------|-------------------------|
| **`DATABASE_URL`** | Wrong DB → data loss or connecting to dev DB from prod. |
| **`SESSION_SECRET`** | Missing or short in production → **app throws at startup** (`session.ts`). Weak secret → session forgery risk. Generate e.g. `openssl rand -base64 48`. |
| **`NEXT_PUBLIC_SITE_URL`** | Wrong or unset → bad canonical URLs, sitemap/OG base, and client-side assumptions about site origin. Set to **HTTPS** public URL, **no trailing slash**. Remember: `NEXT_PUBLIC_*` is embedded at **build** time. |
| **`VERCEL_URL`** | Optional; Vercel sets it. Fallback only when `NEXT_PUBLIC_SITE_URL` is unset — do not rely on it as the primary production URL. |

---

## 3. Known deployment risks

### Local disk uploads

- **Profile images:** `public/uploads/profile-images/`
- **Collaboration/chat media:** `private/collab-media/`

On platforms with **read-only filesystem** or **ephemeral storage**, uploads may fail or **disappear** after restart/deploy.

**Mitigations:** persistent disk, network volume, or **object storage** (S3-compatible) with code changes in a later milestone.

### Migrations before traffic

- Skipping **`prisma migrate deploy`** while shipping new schema → runtime errors until DB matches code.

### Session security

- **`SESSION_SECRET`** must be **≥ 32 characters** in production and kept secret. Rotating it **invalidates** all existing sessions (users log in again).

### Site URL

- **`NEXT_PUBLIC_SITE_URL`** must reflect the real public URL so metadata and links are correct.

---

## 4. Quick command reference

```bash
# Production database — apply migrations only
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Generate Prisma Client (after pull or schema change)
npx prisma generate

# Local development — create/apply migrations interactively
npx prisma migrate dev
```

---

## 5. Build & lint (release gate)

Before tagging a release:

```bash
npm run lint
npm run build
```

Fix failures before deploying.
