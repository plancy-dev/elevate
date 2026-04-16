import { describe, expect, it } from "vitest";
import { studioArtifactWorkflowPhase } from "@/lib/studio-productions/studio-artifact-workflow-phase";

describe("studioArtifactWorkflowPhase", () => {
  it("classifies reference and draft roles", () => {
    expect(studioArtifactWorkflowPhase("reference_source")).toBe("input");
    expect(studioArtifactWorkflowPhase("hook")).toBe("draft");
    expect(studioArtifactWorkflowPhase("script_draft")).toBe("draft");
    expect(studioArtifactWorkflowPhase("tts_audio")).toBe("produce");
    expect(studioArtifactWorkflowPhase("other_custom")).toBe("other");
  });
});
