import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RUNWAY_API_VERSION,
  verifyRunwayApiKey,
} from "@/lib/studio-integrations/runway-verify";

describe("verifyRunwayApiKey", () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("sends X-Runway-Version (required by Runway API)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const key = `key_${"a".repeat(128)}`;
    await verifyRunwayApiKey(key);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.dev.runwayml.com/v1/organization",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: `Bearer ${key}`,
          "X-Runway-Version": RUNWAY_API_VERSION,
        }),
      }),
    );
  });

  it("strips whitespace from pasted keys before calling the API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const key = `key_${"a".repeat(128)}`;
    await verifyRunwayApiKey(`  ${key.slice(0, 70)}\n${key.slice(70)}  `);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${key}`,
        }),
      }),
    );
  });
});
