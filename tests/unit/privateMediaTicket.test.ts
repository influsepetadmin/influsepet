import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  PRIVATE_MEDIA_TICKET_MAX_TTL_MS,
  PRIVATE_MEDIA_TICKET_VERSION,
  type PrivateMediaTicketClaims,
  signPrivateMediaTicket,
  verifyPrivateMediaTicket,
} from "../../src/lib/uploads/privateMediaTicket";

const secret = "test-private-media-ticket-secret";
const now = Date.now();
const baseClaims: PrivateMediaTicketClaims = {
  version: PRIVATE_MEDIA_TICKET_VERSION,
  audience: "delivery-media:upload",
  offerId: "offer_123",
  actorUserId: "user_123",
  mimeType: "video/mp4",
  declaredSize: 20 * 1024 * 1024,
  maxBytes: 200 * 1024 * 1024,
  iat: now,
  exp: now + 60_000,
  nonce: "upload-session-123",
};

function signRawClaims(claims: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

test("valid private media tickets verify for the intended audience", () => {
  const ticket = signPrivateMediaTicket(baseClaims, secret);
  const result = verifyPrivateMediaTicket(ticket, secret, "delivery-media:upload");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.claims.offerId, baseClaims.offerId);
    assert.equal(result.claims.actorUserId, baseClaims.actorUserId);
  }
});

test("invalid, expired, and wrong-audience tickets fail safely", () => {
  const valid = signPrivateMediaTicket(baseClaims, secret);
  assert.deepEqual(verifyPrivateMediaTicket(`${valid}x`, secret, "delivery-media:upload"), {
    ok: false,
    error: "BAD_SIGNATURE",
  });

  const expired = signPrivateMediaTicket({ ...baseClaims, iat: now - 60_000, exp: now - 1 }, secret);
  assert.deepEqual(verifyPrivateMediaTicket(expired, secret, "delivery-media:upload"), {
    ok: false,
    error: "EXPIRED",
  });

  const tooLong = signRawClaims(
    { ...baseClaims, exp: baseClaims.iat + PRIVATE_MEDIA_TICKET_MAX_TTL_MS + 1 },
  );
  assert.deepEqual(verifyPrivateMediaTicket(tooLong, secret, "delivery-media:upload"), {
    ok: false,
    error: "CLAIMS_INVALID",
  });
});

test("missing private media ticket secret disables ticket verification only", () => {
  const ticket = signPrivateMediaTicket(baseClaims, secret);
  assert.deepEqual(verifyPrivateMediaTicket(ticket, "", "delivery-media:upload"), {
    ok: false,
    error: "CONFIG_MISSING",
  });
});
