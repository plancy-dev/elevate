const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  organizer: "Organizer",
  coordinator: "Coordinator",
  viewer: "Viewer",
};

export function roleLabel(key: string): string {
  return ROLE_LABEL[key] ?? key;
}
