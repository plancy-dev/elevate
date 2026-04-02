/** Human-readable labels for `profiles.role` (dashboard). */
export const USER_ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  organizer: "Organizer",
  coordinator: "Coordinator",
  viewer: "Viewer",
};

export function formatUserRoleLabel(role: string | null | undefined): string {
  if (!role) return USER_ROLE_LABEL.viewer;
  return USER_ROLE_LABEL[role] ?? role;
}

/** Organization-scoped admin (`profiles.role === "admin"`). Not platform staff. */
export function isOrganizationAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}

const ORG_ROLE_KEYS = ["admin", "organizer", "coordinator", "viewer"] as const;

export type OrgRoleKey = (typeof ORG_ROLE_KEYS)[number];

/** Canonical role for `Dashboard.roles.*` message keys. */
export function normalizeOrgRoleKey(
  role: string | null | undefined,
): OrgRoleKey {
  if (role && ORG_ROLE_KEYS.includes(role as OrgRoleKey)) {
    return role as OrgRoleKey;
  }
  return "viewer";
}
