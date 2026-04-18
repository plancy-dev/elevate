import { describe, expect, it } from "vitest";
import {
  isPkceVerifierMissingError,
  shouldAllowPkceErrorSessionRecovery,
} from "@/lib/auth/pkce-session-recovery";

describe("pkce-session-recovery", () => {
  it("verifier missing: no session recovery, treated as verifier error", () => {
    const msg =
      "PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser";
    expect(isPkceVerifierMissingError(msg)).toBe(true);
    expect(shouldAllowPkceErrorSessionRecovery(msg)).toBe(false);
  });

  it("invalid_grant / already used: allow recovery path", () => {
    expect(shouldAllowPkceErrorSessionRecovery("invalid_grant")).toBe(true);
    expect(shouldAllowPkceErrorSessionRecovery("This code has already been used")).toBe(
      true,
    );
    expect(isPkceVerifierMissingError("invalid_grant")).toBe(false);
  });

  it("unknown errors: conservative — no recovery", () => {
    expect(shouldAllowPkceErrorSessionRecovery("network failure")).toBe(false);
    expect(isPkceVerifierMissingError("network failure")).toBe(false);
  });
});
