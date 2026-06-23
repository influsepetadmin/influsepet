# InfluSepet profile image gateway

This Cloudflare Worker receives authenticated server-to-server profile-image uploads from the Next.js app and writes them to the existing R2 bucket through an R2 binding.

It intentionally does not use R2 S3 access keys. Railway talks to the Worker over normal Cloudflare HTTPS; the Worker writes to R2 with the `PROFILE_IMAGES` binding.

## Worker contract

- Route: `POST /profile-images`
- Auth: `Authorization: Bearer <shared secret>`
- Body: raw image bytes
- Allowed content types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 5 MB
- R2 binding: `PROFILE_IMAGES`
- R2 bucket: `influsepet-profile-images`
- Public URL response: `https://media.influsepet.com/profile-images/{uuid}.{ext}`

## Deploy

From this directory:

```bash
npx wrangler login
npx wrangler secret put PROFILE_IMAGE_GATEWAY_SECRET
npx wrangler deploy
```

The R2 binding is declared in `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "PROFILE_IMAGES"
bucket_name = "influsepet-profile-images"
```

Use a long random shared secret, for example:

```bash
openssl rand -base64 48
```

Do not commit the secret. Store the same value in Railway as `PROFILE_IMAGE_GATEWAY_SECRET` after the Worker is deployed.

## Custom domain / route

In Cloudflare Workers, attach a route or custom domain to this Worker. Use a dedicated upload host, for example:

```text
https://profile-image-gateway.influsepet.com
```

Do not use `https://media.influsepet.com` as the Worker upload URL. That domain is the public image delivery domain returned to the app after upload.

## Railway variables

Leave both variables unset to keep the current local upload behavior.

After the Worker is deployed and reachable, set both variables together in Railway:

```text
PROFILE_IMAGE_GATEWAY_URL=https://profile-image-gateway.influsepet.com
PROFILE_IMAGE_GATEWAY_SECRET=<same long random secret stored as the Worker secret>
```

If only one variable is set, the Next.js app intentionally returns a safe configuration error for profile-image uploads.

## Safe test

1. Deploy the Worker and custom domain.
2. Send a tiny JPEG/PNG/WebP test upload to `POST /profile-images` with the bearer secret.
3. Confirm the JSON response contains only a URL under `https://media.influsepet.com/profile-images/`.
4. Confirm the object exists in the `influsepet-profile-images` bucket.
5. Add the two Railway variables.
6. Redeploy Railway.
7. Upload one influencer profile image.
8. Confirm the profile stores the returned public media URL and the image renders.

If the Worker upload fails, the Next.js app does not silently fall back to local storage. Existing profile image values remain unchanged because profile updates only receive a new URL after upload succeeds.
