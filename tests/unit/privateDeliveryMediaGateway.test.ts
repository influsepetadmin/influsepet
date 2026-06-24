import assert from "node:assert/strict";
import test from "node:test";
import { getPrivateDeliveryMediaStorageConfig } from "../../src/lib/uploads/privateDeliveryMediaGateway";

test("delivery R2 mode stays local when private ticket secret is absent even if profile gateway vars exist", () => {
  assert.deepEqual(
    getPrivateDeliveryMediaStorageConfig({
      PROFILE_IMAGE_GATEWAY_URL: "https://profile-image-gateway.influsepet.com",
      PROFILE_IMAGE_GATEWAY_SECRET: "profile-secret",
    }),
    { mode: "local" },
  );
});

test("delivery R2 mode enables only with ticket secret and complete gateway configuration", () => {
  const config = getPrivateDeliveryMediaStorageConfig({
    PRIVATE_MEDIA_TICKET_SECRET: "ticket-secret",
    PROFILE_IMAGE_GATEWAY_URL: "https://profile-image-gateway.influsepet.com",
    PROFILE_IMAGE_GATEWAY_SECRET: "profile-secret",
  });
  assert.equal(config.mode, "r2");
  if (config.mode === "r2") {
    assert.equal(config.origin, "https://profile-image-gateway.influsepet.com");
    assert.equal(config.gatewaySecret, "profile-secret");
    assert.equal(config.ticketSecret, "ticket-secret");
  }
});

test("delivery R2 mode fails safely when ticket secret is present but gateway vars are incomplete", () => {
  assert.deepEqual(
    getPrivateDeliveryMediaStorageConfig({
      PRIVATE_MEDIA_TICKET_SECRET: "ticket-secret",
      PROFILE_IMAGE_GATEWAY_URL: "https://profile-image-gateway.influsepet.com",
    }),
    {
      mode: "error",
      code: "DELIVERY_R2_CONFIG_INVALID",
      error: "Delivery media R2 gateway configuration is incomplete.",
    },
  );
});
