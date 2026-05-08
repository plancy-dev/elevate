export type UserRole = "admin" | "organizer" | "coordinator" | "viewer";

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  organization_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: "starter" | "professional" | "enterprise";
  created_at: string;
}
