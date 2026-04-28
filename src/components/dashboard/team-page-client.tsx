"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  createOrganizationInvitation,
  revokeOrganizationInvitation,
  type InvitationActionState,
} from "@/actions/invitations";
import { updateMemberRole } from "@/actions/team";
import type { OrgInvitationRow, OrgMemberRow } from "@/lib/data/team";
import { inviteAbsoluteUrl } from "@/lib/invite-url";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { OrgRoleKey } from "@/lib/user-roles";
import { normalizeOrgRoleKey } from "@/lib/user-roles";
import { toast } from "@/lib/ui/app-toast";
import { Button } from "@/components/ui/button";

type Props = {
  members: OrgMemberRow[];
  invitations: OrgInvitationRow[];
  canInvite: boolean;
  canManageRoles: boolean;
  currentUserId: string;
};

const ROLES: OrgRoleKey[] = ["viewer", "coordinator", "organizer", "admin"];

function roleTranslationKey(role: string): OrgRoleKey {
  return normalizeOrgRoleKey(role);
}

export function TeamPageClient({
  members,
  invitations,
  canInvite,
  canManageRoles,
  currentUserId,
}: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Dashboard.team");
  const tRoles = useTranslations("Dashboard.roles");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [inviteState, inviteAction, invitePending] = useActionState(
    createOrganizationInvitation,
    undefined as InvitationActionState,
  );
  const [rolePending, startRole] = useTransition();
  const prevInvitePending = useRef(false);

  useEffect(() => {
    const done =
      prevInvitePending.current &&
      !invitePending &&
      inviteState?.success &&
      !inviteState?.error;
    prevInvitePending.current = invitePending;
    if (done) {
      toast.success(translateActionErrorMessage(inviteState.success!, tAction));
    }
  }, [invitePending, inviteState, tAction]);

  async function onRevoke(id: string) {
    if (!confirm(t("confirmRevoke"))) return;
    const r = await revokeOrganizationInvitation(id);
    if (r?.error) {
      toast.error(translateActionErrorMessage(r.error, tAction));
    } else if (r?.success) {
      toast.success(translateActionErrorMessage(r.success, tAction));
    }
    router.refresh();
  }

  function onRoleChange(memberId: string, role: string) {
    startRole(async () => {
      const r = await updateMemberRole(memberId, role);
      if (r?.error) {
        toast.error(translateActionErrorMessage(r.error, tAction));
      }
      router.refresh();
    });
  }

  function formatExpires(d: string) {
    return new Date(d).toLocaleDateString(locale, { dateStyle: "medium" });
  }

  async function copyInviteLink(token: string) {
    await navigator.clipboard.writeText(inviteAbsoluteUrl(token));
    toast.success(t("linkCopied"));
  }

  return (
    <div className="p-6 space-y-8">
      {canInvite && (
        <section className="border border-ink-100 bg-paper-0 p-6 max-w-lg">
          <h2 className="text-sm font-medium text-ink-900 mb-4">
            {t("inviteTitle")}
          </h2>
          <form action={inviteAction} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="invite-email"
                className="block text-xs font-medium text-ink-700 mb-1"
              >
                {t("email")}
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-10 w-full bg-paper-0 border border-ink-100 px-3 text-sm text-ink-900 focus:outline-none focus:border-focus"
              />
            </div>
            <div>
              <label
                htmlFor="invite-role"
                className="block text-xs font-medium text-ink-700 mb-1"
              >
                {t("role")}
              </label>
              <select
                id="invite-role"
                name="role"
                defaultValue="viewer"
                className="h-10 w-full bg-paper-0 border border-ink-100 px-3 text-sm text-ink-900 focus:outline-none focus:border-focus"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {tRoles(r)}
                  </option>
                ))}
              </select>
            </div>
            {inviteState?.error && (
              <p className="text-xs text-danger">
                {translateActionErrorMessage(inviteState.error, tAction)}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-fit"
              isLoading={invitePending}
            >
              {t("sendInvitation")}
            </Button>
          </form>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-ink-900 mb-3">
          {t("members")}
        </h2>
        <div className="border border-ink-100 bg-paper-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-500 uppercase tracking-wider">
                <th className="px-4 py-2 font-medium">{t("colName")}</th>
                <th className="px-4 py-2 font-medium">{t("colEmail")}</th>
                <th className="px-4 py-2 font-medium">{t("colRole")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-ink-100 last:border-0 hover:bg-paper-50"
                >
                  <td className="px-4 py-3 text-ink-900">{m.displayName}</td>
                  <td className="px-4 py-3 text-ink-500 text-xs">
                    {m.email}
                  </td>
                  <td className="px-4 py-3">
                    {canManageRoles && m.id !== currentUserId ? (
                      <select
                        defaultValue={m.role}
                        disabled={rolePending}
                        onChange={(e) => onRoleChange(m.id, e.target.value)}
                        className="h-8 bg-paper-0 border border-ink-100 px-2 text-xs text-ink-900"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {tRoles(r)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-ink-700">
                        {tRoles(roleTranslationKey(m.role))}
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
          <h2 className="text-sm font-medium text-ink-900 mb-3">
            {t("pendingInvitations")}
          </h2>
          <ul className="space-y-3">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="border border-ink-100 bg-paper-0 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm text-ink-900">{inv.email}</div>
                  <div className="text-xs text-ink-500">
                    {tRoles(roleTranslationKey(inv.role))} ·{""}
                    {t("expires", { date: formatExpires(inv.expiresAt) })}
                  </div>
                  <div className="mt-2 text-xs text-ink-500 break-all font-mono">
                    {inviteAbsoluteUrl(inv.token)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void copyInviteLink(inv.token)}
                  >
                    {t("copyLink")}
                  </Button>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    onClick={() => onRevoke(inv.id)}
                  >
                    {t("revoke")}
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
