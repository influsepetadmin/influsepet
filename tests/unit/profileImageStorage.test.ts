import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProfileImageObjectKey,
  buildR2ProfileImageUrl,
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
