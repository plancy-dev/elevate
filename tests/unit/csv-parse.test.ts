import { describe, expect, it } from "vitest";
import { parseCsvRows } from "@/lib/csv-parse";

describe("parseCsvRows", () => {
  it("parses simple comma-separated rows", () => {
    const text = "a,b\n1,2";
    expect(parseCsvRows(text)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    const text = 'email,name\n"a@b.com","Doe, Jane"';
    expect(parseCsvRows(text)).toEqual([
      ["email", "name"],
      ["a@b.com", "Doe, Jane"],
    ]);
  });

  it("handles escaped quotes", () => {
    const text = 'x\n"say ""hi"""';
    expect(parseCsvRows(text)).toEqual([["x"], ['say "hi"']]);
  });
});
