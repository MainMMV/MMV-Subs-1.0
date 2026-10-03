import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";

const botToken = "123456:test-token-for-signature-checks";
process.env.TELEGRAM_BOT_TOKEN = botToken;

const { verifyTelegramLogin } = await import("./telegram.js");

function signedIdentity(overrides: Record<string, unknown> = {}) {
  const identity: Record<string, unknown> = {
    id: 987654321,
    first_name: "MMV",
    username: "mmv_user",
    auth_date: Math.floor(Date.now() / 1000),
    ...overrides,
  };
  const checkString = Object.entries(identity)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("\n");
  const secret = createHash("sha256").update(botToken).digest();
  identity.hash = createHmac("sha256", secret).update(checkString).digest("hex");
  return identity;
}

test("accepts a current Telegram Login payload with a valid signature", () => {
  const result = verifyTelegramLogin(signedIdentity());
  assert.equal(result?.id, 987654321);
  assert.equal(result?.username, "mmv_user");
});

test("rejects a Telegram identity changed after signing", () => {
  const payload = signedIdentity();
  payload.id = 123;
  assert.equal(verifyTelegramLogin(payload), null);
});

test("rejects an expired Telegram Login payload", () => {
  const payload = signedIdentity({ auth_date: Math.floor(Date.now() / 1000) - 901 });
  assert.equal(verifyTelegramLogin(payload), null);
});
