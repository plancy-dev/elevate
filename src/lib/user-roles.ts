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
