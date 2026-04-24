import { describe, expect, it } from "vitest";
import {
  STUDIO_PROVIDER_DOCS,
  getProviderDocs,
} from "@/lib/studio-integrations/provider-docs";
import { STUDIO_INTEGRATION_PROVIDER_IDS } from "@/lib/studio-integrations/types";

describe("provider docs map", () => {
  it("has an entry for every provider id", () => {
    for (const id of STUDIO_INTEGRATION_PROVIDER_IDS) {
      const docs = getProviderDocs(id);
      expect(docs.apiDocsUrl.startsWith("https://")).toBe(true);
    }
  });

  it("entries declare HTTPS pricing / tos URLs when present", () => {
    for (const id of STUDIO_INTEGRATION_PROVIDER_IDS) {
      const entry = STUDIO_PROVIDER_DOCS[id];
      if (entry.pricingUrl) expect(entry.pricingUrl.startsWith("https://")).toBe(true);
      if (entry.tosUrl) expect(entry.tosUrl.startsWith("https://")).toBe(true);
    }
  });
});
