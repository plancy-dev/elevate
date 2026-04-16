import { describe, expect, it } from "vitest";

import {
  assertUrlSafeForFetch,
  UrlNotAllowedError,
} from "@/lib/url-extract/url-safety";

describe("assertUrlSafeForFetch", () => {
  it("rejects localhost", async () => {
    await expect(assertUrlSafeForFetch("http://localhost:3000/")).rejects.toBeInstanceOf(
      UrlNotAllowedError,
    );
  });

  it("rejects non-http protocols", async () => {
    await expect(assertUrlSafeForFetch("ftp://example.com/")).rejects.toBeInstanceOf(
      UrlNotAllowedError,
    );
  });
});
