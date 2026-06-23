import assert from "node:assert/strict";
import test from "node:test";
import {
  DELIVERY_MEDIA_OBJECT_PREFIX,
  isValidDeliveryMediaObjectKey,
  parseHttpRangeHeader,
  resolveDeliveryMediaObjectKey,
  validateDeliveryMediaStorageRecord,
} from "../../src/lib/uploads/privateDeliveryMedia";

const validObjectKey = `${DELIVERY_MEDIA_OBJECT_PREFIX}123e4567-e89b-12d3-a456-426614174000.mp4`;

test("legacy LOCAL delivery media rows remain valid with storedFilename only", () => {
  assert.equal(
    validateDeliveryMediaStorageRecord({
      storageProvider: "LOCAL",
      storedFilename: "123e4567-e89b-12d3-a456-426614174000.jpg",
      objectKey: null,
    }),
    true,
  );
  assert.equal(
    validateDeliveryMediaStorageRecord({
      storedFilename: "123e4567-e89b-12d3-a456-426614174000.webp",
    }),
    true,
  );
});

test("R2 delivery media rows require a valid delivery-media objectKey", () => {
  assert.equal(
    validateDeliveryMediaStorageRecord({
      storageProvider: "R2",
      storedFilename: "legacy-placeholder.mp4",
      objectKey: validObjectKey,
    }),
    true,
  );
  assert.equal(
    validateDeliveryMediaStorageRecord({
      storageProvider: "R2",
      storedFilename: "legacy-placeholder.mp4",
      objectKey: null,
    }),
    false,
  );
  assert.equal(resolveDeliveryMediaObjectKey({ storageProvider: "R2", storedFilename: "x", objectKey: validObjectKey }), validObjectKey);
});

test("delivery object keys are restricted to delivery-media uuid paths", () => {
  assert.equal(isValidDeliveryMediaObjectKey(validObjectKey), true);
  assert.equal(isValidDeliveryMediaObjectKey("profile-images/123e4567-e89b-12d3-a456-426614174000.jpg"), false);
  assert.equal(isValidDeliveryMediaObjectKey("delivery-media/../../secret.mp4"), false);
  assert.equal(isValidDeliveryMediaObjectKey("delivery-media/not-a-uuid.mp4"), false);
});

test("range request parsing accepts simple byte ranges and rejects malformed ranges", () => {
  assert.deepEqual(parseHttpRangeHeader("bytes=0-99"), { offset: 0, length: 100 });
  assert.deepEqual(parseHttpRangeHeader("bytes=100-"), { offset: 100 });
  assert.deepEqual(parseHttpRangeHeader("bytes=-500"), { offset: -500 });
  assert.equal(parseHttpRangeHeader("items=0-99"), null);
  assert.equal(parseHttpRangeHeader("bytes=99-0"), null);
  assert.equal(parseHttpRangeHeader("bytes=0-99,200-299"), null);
});
