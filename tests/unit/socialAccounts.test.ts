import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeSocialAccountInput } from "../../src/lib/socialAccounts";

const instagramInputs = [
  "https://www.instagram.com/kediturkceoabt/",
  "http://instagram.com/kediturkceoabt",
  "www.instagram.com/kediturkceoabt",
  "instagram.com/kediturkceoabt/",
  "instagram.com/kediturkceoabt?igsh=abc",
  "@kediturkceoabt",
  "kediturkceoabt",
];

for (const input of instagramInputs) {
  test(`canonicalizes Instagram input: ${input}`, () => {
    assert.deepEqual(canonicalizeSocialAccountInput("INSTAGRAM", input), {
      ok: true,
      platform: "INSTAGRAM",
      canonicalHandle: "kediturkceoabt",
      normalizedProfileUrl: "https://www.instagram.com/kediturkceoabt/",
    });
  });
}

const tiktokInputs = [
  "https://www.tiktok.com/@SomeUser",
  "tiktok.com/@someuser",
  "@someuser",
  "someuser",
];

for (const input of tiktokInputs) {
  test(`canonicalizes TikTok input: ${input}`, () => {
    assert.deepEqual(canonicalizeSocialAccountInput("TIKTOK", input), {
      ok: true,
      platform: "TIKTOK",
      canonicalHandle: "someuser",
      normalizedProfileUrl: "https://www.tiktok.com/@someuser",
    });
  });
}

test("rejects reserved Instagram paths", () => {
  for (const path of ["p", "reel", "reels", "explore", "stories", "accounts"]) {
    assert.equal(canonicalizeSocialAccountInput("INSTAGRAM", `instagram.com/${path}/abc`).ok, false);
  }
});

test("rejects non-profile TikTok URLs and lookalike hosts", () => {
  assert.equal(canonicalizeSocialAccountInput("TIKTOK", "tiktok.com/video/123").ok, false);
  assert.equal(canonicalizeSocialAccountInput("INSTAGRAM", "evilinstagram.com/user").ok, false);
  assert.equal(canonicalizeSocialAccountInput("TIKTOK", "eviltiktok.com/@user").ok, false);
});

test("rejects malformed plain handles instead of silently rewriting them", () => {
  assert.equal(canonicalizeSocialAccountInput("INSTAGRAM", "name/other").ok, false);
  assert.equal(canonicalizeSocialAccountInput("TIKTOK", "some user").ok, false);
});

test("keeps existing YouTube normalization behavior", () => {
  assert.deepEqual(canonicalizeSocialAccountInput("YOUTUBE", "@SomeChannel"), {
    ok: true,
    platform: "YOUTUBE",
    canonicalHandle: "somechannel",
    normalizedProfileUrl: "https://www.youtube.com/@somechannel",
  });
});
