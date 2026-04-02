import { describe, expect, it } from "vitest";
import { isUnhelpfulTossClientErrorMessage } from "@/lib/payments/toss-widget-user-message";

describe("isUnhelpfulTossClientErrorMessage", () => {
  it("flags empty and Korean unknown phrasing", () => {
    expect(isUnhelpfulTossClientErrorMessage("")).toBe(true);
    expect(isUnhelpfulTossClientErrorMessage("   ")).toBe(true);
    expect(isUnhelpfulTossClientErrorMessage("알 수 없는 오류가 발생했습니다.")).toBe(
      true,
    );
    expect(isUnhelpfulTossClientErrorMessage("알 수 없는 에러")).toBe(true);
  });

  it("flags short English unknown errors", () => {
    expect(isUnhelpfulTossClientErrorMessage("Unknown error")).toBe(true);
    expect(isUnhelpfulTossClientErrorMessage("unknown")).toBe(true);
    expect(isUnhelpfulTossClientErrorMessage("Widgets.UnknownError")).toBe(true);
  });

  it("keeps specific messages", () => {
    expect(
      isUnhelpfulTossClientErrorMessage(
        "Network request failed: check your connection",
      ),
    ).toBe(false);
  });
});
