import { describe, expect, it } from "vitest";
import { formatUserRoleLabel, USER_ROLE_LABEL } from "@/lib/user-roles";

describe("formatUserRoleLabel", () => {
  it("maps known roles", () => {
    expect(formatUserRoleLabel("admin")).toBe("Admin");
    expect(formatUserRoleLabel("viewer")).toBe("Viewer");
  });

  it("defaults nullish to Viewer", () => {
    expect(formatUserRoleLabel(null)).toBe(USER_ROLE_LABEL.viewer);
    expect(formatUserRoleLabel(undefined)).toBe(USER_ROLE_LABEL.viewer);
  });

  it("passes through unknown role strings", () => {
    expect(formatUserRoleLabel("custom_role")).toBe("custom_role");
  });
});
