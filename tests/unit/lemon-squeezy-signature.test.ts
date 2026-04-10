import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyLemonSqueezySignature } from "@/lib/payments/lemon-squeezy-signature";

function lemonDigest(secret: string, rawBody: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  return hmac.update(rawBody, "utf8").digest("hex");
}

describe("verifyLemonSqueezySignature", () => {
  it("accepts a valid X-Signature (hex HMAC of raw body)", () => {
    const secret = "signing-secret-ok";
    const rawBody = '{"meta":{"event_name":"order_created"}}';
    const sig = lemonDigest(secret, rawBody);
    expect(verifyLemonSqueezySignature(rawBody, sig, secret)).toBe(true);
  });

  it("rejects when the body was tampered with", () => {
    const secret = "signing-secret-ok";
    const rawBody = '{"meta":{"event_name":"order_created"}}';
    const sig = lemonDigest(secret, rawBody);
    expect(verifyLemonSqueezySignature(`${rawBody} `, sig, secret)).toBe(false);
  });

  it("rejects missing signature header", () => {
    expect(verifyLemonSqueezySignature("{}", null, "x")).toBe(false);
  });
});
