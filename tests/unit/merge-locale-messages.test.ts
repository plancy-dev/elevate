import { describe, expect, it } from "vitest";
import type { AbstractIntlMessages } from "next-intl";
import { mergeLocaleMessages } from "@/lib/i18n/merge-locale-messages";

describe("mergeLocaleMessages", () => {
  it("fills missing leaves from English fallback", () => {
    const merged = mergeLocaleMessages(
      {
        Dashboard: {
          productions: { onlyEn: "x", both: "en" },
        },
      } as AbstractIntlMessages,
      {
        Dashboard: {
          productions: { both: "ko" },
        },
      } as AbstractIntlMessages,
    );
    expect(merged.Dashboard).toEqual({
      productions: { onlyEn: "x", both: "ko" },
    });
  });

  it("returns primary when fallback branch is absent", () => {
    const merged = mergeLocaleMessages(
      { A: { b: "1" } } as AbstractIntlMessages,
      { A: { b: "2", c: "3" } } as AbstractIntlMessages,
    );
    expect(merged).toEqual({ A: { b: "2", c: "3" } });
  });
});
