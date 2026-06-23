import assert from "node:assert/strict";
import test from "node:test";
import {
  getProfileImageGatewayConfig,
  isAllowedProfileImageGatewayPublicUrl,
  normalizeProfileImageGatewayUrl,
  profileImageGatewayConstants,
} from "../../src/lib/uploads/profileImageGateway";

test("uses local profile image storage when gateway variables are absent", () => {
  assert.deepEqual(getProfileImageGatewayConfig({}), { mode: "local" });
});

test("requires gateway URL and secret to be configured together", () => {
  assert.equal(
    getProfileImageGatewayConfig({ PROFILE_IMAGE_GATEWAY_URL: "https://profile-image-gateway.example.com" }).mode,
    "error",
  );
  assert.equal(
    getProfileImageGatewayConfig({ PROFILE_IMAGE_GATEWAY_SECRET: "secret" }).mode,
    "error",
  );
});

test("normalizes a Worker gateway origin into the upload endpoint", () => {
  assert.equal(
    normalizeProfileImageGatewayUrl(" https://profile-image-gateway.example.com/ "),
    "https://profile-image-gateway.example.com",
  );

  assert.deepEqual(
    getProfileImageGatewayConfig({
      PROFILE_IMAGE_GATEWAY_URL: "https://profile-image-gateway.example.com/",
      PROFILE_IMAGE_GATEWAY_SECRET: "secret",
    }),
    {
      mode: "gateway",
      endpointUrl: "https://profile-image-gateway.example.com/profile-images",
      secret: "secret",
    },
  );
});

test("rejects unsafe gateway URL shapes", () => {
  assert.equal(normalizeProfileImageGatewayUrl("http://profile-image-gateway.example.com"), null);
  assert.equal(normalizeProfileImageGatewayUrl("https://profile-image-gateway.example.com/path"), null);
  assert.equal(normalizeProfileImageGatewayUrl("https://user:pass@profile-image-gateway.example.com"), null);
  assert.equal(normalizeProfileImageGatewayUrl("https://profile-image-gateway.example.com?x=1"), null);
});

test("keeps the public media domain separate from the upload gateway URL", () => {
  assert.equal(normalizeProfileImageGatewayUrl("https://media.influsepet.com"), null);
  assert.equal(profileImageGatewayConstants.publicBaseUrl, "https://media.influsepet.com/profile-images/");
  assert.equal(profileImageGatewayConstants.uploadPath, "/profile-images");
});

test("accepts only expected public profile image URLs returned by the Worker", () => {
  assert.equal(
    isAllowedProfileImageGatewayPublicUrl(
      "https://media.influsepet.com/profile-images/123e4567-e89b-12d3-a456-426614174000.jpg",
    ),
    true,
  );
  assert.equal(
    isAllowedProfileImageGatewayPublicUrl(
      "https://media.influsepet.com/profile-images/123e4567-e89b-12d3-a456-426614174000.webp",
    ),
    true,
  );
  assert.equal(isAllowedProfileImageGatewayPublicUrl("/uploads/profile-images/local.jpg"), false);
  assert.equal(
    isAllowedProfileImageGatewayPublicUrl(
      "https://profile-image-gateway.example.com/profile-images/123e4567-e89b-12d3-a456-426614174000.jpg",
    ),
    false,
  );
});
