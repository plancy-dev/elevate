import { describe, expect, it } from "vitest";
import {
  formatUserRoleLabel,
  isOrganizationAdmin,
  normalizeOrgRoleKey,
  USER_ROLE_LABEL,
} from "@/lib/user-roles";

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

describe("normalizeOrgRoleKey", () => {
  it("maps known roles", () => {
    expect(normalizeOrgRoleKey("admin")).toBe("admin");
    expect(normalizeOrgRoleKey("viewer")).toBe("viewer");
    expect(normalizeOrgRoleKey("organizer")).toBe("organizer");
    expect(normalizeOrgRoleKey("coordinator")).toBe("coordinator");
  });

  it("defaults unknown or nullish to viewer", () => {
    expect(normalizeOrgRoleKey(null)).toBe("viewer");
    expect(normalizeOrgRoleKey(undefined)).toBe("viewer");
    expect(normalizeOrgRoleKey("custom_role")).toBe("viewer");
  });
});

describe("isOrganizationAdmin", () => {
  it("is true only for admin role", () => {
    expect(isOrganizationAdmin("admin")).toBe(true);
    expect(isOrganizationAdmin("viewer")).toBe(false);
    expect(isOrganizationAdmin("organizer")).toBe(false);
    expect(isOrganizationAdmin(null)).toBe(false);
    expect(isOrganizationAdmin(undefined)).toBe(false);
  });
});
