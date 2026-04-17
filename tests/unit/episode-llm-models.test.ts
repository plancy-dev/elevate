import { describe, expect, it } from "vitest";
import {
  chooseStudioDraftLlmProvider,
  defaultDraftModel,
  resolveDraftModel,
} from "@/lib/studio-productions/episode-llm-models";

describe("episode-llm-models", () => {
  it("resolveDraftModel falls back to default when empty or unknown", () => {
    expect(resolveDraftModel("openai", "")).toBe(defaultDraftModel("openai"));
    expect(resolveDraftModel("openai", "not-a-real-model")).toBe(
      defaultDraftModel("openai"),
    );
    expect(resolveDraftModel("anthropic", "claude-3-5-sonnet-20241022")).toBe(
      "claude-3-5-sonnet-20241022",
    );
  });

  it("chooseStudioDraftLlmProvider respects availability and explicit choice", () => {
    expect(
      chooseStudioDraftLlmProvider(
        { openai: true, anthropic: false },
        "anthropic",
      ),
    ).toBeNull();
    expect(
      chooseStudioDraftLlmProvider(
        { openai: true, anthropic: false },
        "openai",
      ),
    ).toBe("openai");
    expect(
      chooseStudioDraftLlmProvider(
        { openai: false, anthropic: true },
        "",
      ),
    ).toBe("anthropic");
    expect(
      chooseStudioDraftLlmProvider(
        { openai: true, anthropic: true },
        "",
      ),
    ).toBe("anthropic");
    expect(
      chooseStudioDraftLlmProvider(
        { openai: true, anthropic: true },
        "anthropic",
      ),
    ).toBe("anthropic");
  });
});
