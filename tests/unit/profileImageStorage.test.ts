import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProfileImageObjectKey,
  buildR2ProfileImageUrl,
  buildR2S3ClientConfig,
  ProfileImageStorageConfigError,
  resolveProfileImageStorageConfig,
} from "../../src/lib/uploads/profileImageStorage";

const completeR2Env = {
  R2_ENDPOINT: "https://account-id.r2.cloudflarestorage.com",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  R2_BUCKET: "influsepet-profile-images",
  R2_PUBLIC_BASE_URL: "https://media.influsepet.com",
};

test("uses local storage when all R2 variables are absent", () => {
  assert.deepEqual(resolveProfileImageStorageConfig({}), { mode: "local" });
});

test("uses R2 storage when all R2 variables are present", () => {
  assert.deepEqual(resolveProfileImageStorageConfig(completeR2Env), {
    mode: "r2",
    endpoint: completeR2Env.R2_ENDPOINT,
    accessKeyId: completeR2Env.R2_ACCESS_KEY_ID,
    secretAccessKey: completeR2Env.R2_SECRET_ACCESS_KEY,
    bucket: completeR2Env.R2_BUCKET,
    publicBaseUrl: completeR2Env.R2_PUBLIC_BASE_URL,
  });
});

test("normalizes the R2 endpoint to its account-level origin", () => {
  const config = resolveProfileImageStorageConfig({
    ...completeR2Env,
    R2_ENDPOINT: "  https://account-id.r2.cloudflarestorage.com/  ",
  });

  assert.equal(config.mode, "r2");
  if (config.mode === "r2") {
    assert.equal(config.endpoint, "https://account-id.r2.cloudflarestorage.com");
  }
});

test("rejects public domains and paths as the R2 write endpoint", () => {
  assert.throws(
    () => resolveProfileImageStorageConfig({ ...completeR2Env, R2_ENDPOINT: completeR2Env.R2_PUBLIC_BASE_URL }),
    ProfileImageStorageConfigError,
  );
  assert.throws(
    () =>
      resolveProfileImageStorageConfig({
        ...completeR2Env,
        R2_ENDPOINT: "https://account-id.r2.cloudflarestorage.com/influsepet-profile-images",
      }),
    ProfileImageStorageConfigError,
  );
});

test("keeps the public URL separate and forces path-style R2 requests", () => {
  const config = resolveProfileImageStorageConfig(completeR2Env);
  assert.equal(config.mode, "r2");
  if (config.mode !== "r2") return;

  const clientConfig = buildR2S3ClientConfig(config);
  assert.equal(clientConfig.endpoint, completeR2Env.R2_ENDPOINT);
  assert.notEqual(clientConfig.endpoint, completeR2Env.R2_PUBLIC_BASE_URL);
  assert.equal(clientConfig.forcePathStyle, true);
});

test("rejects partial R2 configuration instead of falling back locally", () => {
  assert.throws(
    () => resolveProfileImageStorageConfig({ R2_ENDPOINT: completeR2Env.R2_ENDPOINT }),
    (error: unknown) =>
      error instanceof ProfileImageStorageConfigError &&
      error.message.includes("R2_ACCESS_KEY_ID") &&
      error.message.includes("R2_PUBLIC_BASE_URL"),
  );
});

test("builds the expected profile image object key and public URL", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  const key = buildProfileImageObjectKey("image/webp", id);

  assert.equal(key, `profile-images/${id}.webp`);
  assert.equal(
    buildR2ProfileImageUrl(completeR2Env.R2_PUBLIC_BASE_URL, key),
    `https://media.influsepet.com/profile-images/${id}.webp`,
  );
});

test("normalizes a trailing slash in the R2 public base URL", () => {
  assert.equal(
    buildR2ProfileImageUrl(
      "https://media.influsepet.com/",
      "profile-images/123e4567-e89b-12d3-a456-426614174000.jpg",
    ),
    "https://media.influsepet.com/profile-images/123e4567-e89b-12d3-a456-426614174000.jpg",
  );
});
