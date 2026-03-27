"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createOrganizationInvitation,
  revokeOrganizationInvitation,
  type InvitationActionState,
} from "@/actions/invitations";
import { updateMemberRole } from "@/actions/team";
import type { OrgInvitationRow, OrgMemberRow } from "@/lib/data/team";
import { roleLabel } from "@/lib/labels/user-role";
import { inviteAbsoluteUrl } from "@/lib/invite-url";
import { Button } from "@/components/ui/button";

type Props = {
  members: OrgMemberRow[];
  invitations: OrgInvitationRow[];
  canInvite: boolean;
  canManageRoles: boolean;
  currentUserId: string;
};

const ROLES = ["viewer", "coordinator", "organizer", "admin"] as const;

export function TeamPageClient({
  members,
  invitations,
  canInvite,
  canManageRoles,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [inviteState, inviteAction, invitePending] = useActionState(
    createOrganizationInvitation,
    undefined as InvitationActionState,
  );
  const [rolePending, startRole] = useTransition();

  async function onRevoke(id: string) {
    if (!confirm("Remove this invitation?")) return;
    const r = await revokeOrganizationInvitation(id);
    if (r?.error) window.alert(r.error);
    router.refresh();
  }

  function onRoleChange(memberId: string, role: string) {
    startRole(async () => {
      const r = await updateMemberRole(memberId, role);
      if (r?.error) window.alert(r.error);
      router.refresh();
    });
  }

  return (
    <div className="p-6 space-y-8">
      {canInvite && (
        <section className="border border-border-subtle bg-layer-01 p-6 max-w-lg">
          <h2 className="text-sm font-medium text-text-primary mb-4">
            Invite teammate
          </h2>
          <form action={inviteAction} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="invite-email"
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Email
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
              />
            </div>
            <div>
              <label
                htmlFor="invite-role"
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Role
              </label>
              <select
                id="invite-role"
                name="role"
                defaultValue="viewer"
                className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            {inviteState?.error && (
              <p className="text-xs text-danger">{inviteState.error}</p>
            )}
            {inviteState?.success && (
              <p className="text-xs text-accent">{inviteState.success}</p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-fit"
              isLoading={invitePending}
            >
              Send invitation
            </Button>
          </form>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-text-primary mb-3">Members</h2>
        <div className="border border-border-subtle bg-layer-01 overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs text-text-tertiary uppercase tracking-wider">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-layer-02"
                >
                  <td className="px-4 py-3 text-text-primary">{m.displayName}</td>
                  <td className="px-4 py-3 text-text-tertiary text-xs">
                    {m.email}
                  </td>
                  <td className="px-4 py-3">
                    {canManageRoles && m.id !== currentUserId ? (
                      <select
                        defaultValue={m.role}
                        disabled={rolePending}
                        onChange={(e) => onRoleChange(m.id, e.target.value)}
                        className="h-8 bg-field border border-border-subtle px-2 text-xs text-text-primary"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-text-secondary">
                        {roleLabel(m.role)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {canInvite && invitations.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-text-primary mb-3">
            Pending invitations
          </h2>
          <ul className="space-y-3">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="border border-border-subtle bg-layer-01 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm text-text-primary">{inv.email}</div>
                  <div className="text-xs text-text-tertiary">
                    {roleLabel(inv.role)} · expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2 text-xs text-text-tertiary break-all font-mono">
                    {inviteAbsoluteUrl(inv.token)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        inviteAbsoluteUrl(inv.token),
                      );
                    }}
                  >
                    Copy link
                  </Button>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    onClick={() => onRevoke(inv.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
