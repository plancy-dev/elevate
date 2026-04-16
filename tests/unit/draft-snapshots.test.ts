import { describe, expect, it } from "vitest";
import {
  normalizeDraftTripleForSnapshot,
  shouldArchiveSupersededDraft,
} from "@/lib/studio-productions/draft-snapshots";

describe("normalizeDraftTripleForSnapshot", () => {
  it("unifies CRLF and trims fields", () => {
    expect(
      normalizeDraftTripleForSnapshot({
        hook: "  a\r\n",
        title: " t ",
        script_draft: "x\ry",
      }),
    ).toEqual({
      hook: "a",
        title: "t",
        script_draft: "x\ny",
      });
  });

  it("treats CRLF vs LF script as equal for superseded check", () => {
    const prior = { hook: "h", title: "t", script_draft: "line\r\nline" };
    const next = { hook: "h", title: "t", script_draft: "line\nline" };
    expect(shouldArchiveSupersededDraft(prior, next)).toBe(false);
  });
});
