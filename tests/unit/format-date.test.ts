import { describe, expect, it } from "vitest";
import { formatDateTimeUtc } from "@/lib/utils/format-date";

describe("formatDateTimeUtc", () => {
  it("formats ISO timestamps in UTC", () => {
    const s = formatDateTimeUtc("2026-03-27T12:00:00.000Z");
    expect(s).toMatch(/2026/);
    expect(s).toMatch(/Mar/);
  });

  it("returns raw string for invalid input", () => {
    expect(formatDateTimeUtc("not-a-date")).toBe("not-a-date");
  });
});
