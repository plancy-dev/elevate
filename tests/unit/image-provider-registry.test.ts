import { describe, expect, it } from "vitest";
import {
  IMAGE_PROVIDER_META,
} from "@/lib/studio-integrations/providers/images/types";
import { getImageProviderAdapter } from "@/lib/studio-integrations/providers/images/registry";
import {
  STUDIO_IMAGE_PROVIDER_IDS,
  isStudioImageProviderId,
} from "@/lib/studio-integrations/types";

describe("image provider registry", () => {
  it("maps every provider id to an adapter function", () => {
    for (const id of STUDIO_IMAGE_PROVIDER_IDS) {
      const adapter = getImageProviderAdapter(id);
      expect(typeof adapter).toBe("function");
    }
  });

  it("every provider has a default model + maxCount", () => {
    for (const id of STUDIO_IMAGE_PROVIDER_IDS) {
      const meta = IMAGE_PROVIDER_META[id];
      expect(meta.defaultModel).toBeTruthy();
      expect(meta.maxCount).toBeGreaterThan(0);
    }
  });

  it("isStudioImageProviderId narrows correctly", () => {
    expect(isStudioImageProviderId("google_gemini")).toBe(true);
    expect(isStudioImageProviderId("flux_replicate")).toBe(true);
    expect(isStudioImageProviderId("flux_fal")).toBe(true);
    expect(isStudioImageProviderId("seedream")).toBe(true);
    expect(isStudioImageProviderId("openai")).toBe(false);
    expect(isStudioImageProviderId(42)).toBe(false);
  });
});
