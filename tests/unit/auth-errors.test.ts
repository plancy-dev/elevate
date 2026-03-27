import { describe, expect, it } from "vitest";
import {
  formatAuthError,
  formatAuthEmailDeliveryError,
  formatOAuthCallbackError,
  formatSignInPasswordError,
  formatUnknownAuthError,
} from "@/lib/auth-errors";

describe("formatAuthError", () => {
  it("maps rate limit messages to user copy", () => {
    expect(
      formatAuthError({ message: "429: email rate limit exceeded" }),
    ).toMatch(/Too many authentication emails/);
  });

  it("passes through other messages", () => {
    expect(formatAuthError({ message: "Something else" })).toBe("Something else");
  });
});

describe("formatSignInPasswordError", () => {
  it("handles invalid login copy", () => {
    const out = formatSignInPasswordError({
      message: "Invalid login credentials",
    });
    expect(out).toMatch(/don’t match/);
  });

  it("delegates rate limits to formatAuthError", () => {
    const out = formatSignInPasswordError({
      message: "Email rate limit exceeded",
    });
    expect(out).toMatch(/Too many/);
  });
});

describe("formatAuthEmailDeliveryError", () => {
  it("mentions reset emails for rate limits", () => {
    expect(
      formatAuthEmailDeliveryError({ message: "429 rate limit" }),
    ).toMatch(/reset emails/);
  });
});

describe("formatUnknownAuthError", () => {
  it("maps object with message through formatAuthError", () => {
    expect(formatUnknownAuthError({ message: "429: rate limit" })).toMatch(
      /Too many authentication emails/,
    );
  });

  it("returns generic copy for non-Error shapes", () => {
    expect(formatUnknownAuthError(null)).toMatch(/Something went wrong/);
    expect(formatUnknownAuthError(undefined)).toMatch(/Something went wrong/);
  });
});

describe("formatOAuthCallbackError", () => {
  it("handles otp_expired", () => {
    expect(
      formatOAuthCallbackError("access_denied", "link expired", "otp_expired"),
    ).toMatch(/expired/);
  });

  it("handles access_denied without otp", () => {
    expect(formatOAuthCallbackError("access_denied", null, null)).toMatch(
      /cancelled/,
    );
  });
});
