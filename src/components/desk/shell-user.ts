import type { OrgRoleKey } from "@/lib/user-roles";

export type DeskShellUser = {
  displayName: string;
  email: string;
  role: OrgRoleKey;
  orgName: string;
  initials: string;
};
