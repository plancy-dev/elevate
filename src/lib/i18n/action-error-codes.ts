/**
 * Stable machine codes returned by server actions for client-side i18n via
 * `Dashboard.actionErrors.*` (next-intl).
 * Do not show raw English from DB/SDK to users when a code is used.
 */
export const ActionErrorCode = {
  authNotAuthenticated: "authNotAuthenticated",
  authNoOrganization: "authNoOrganization",
  authInsufficientPermissions: "authInsufficientPermissions",
  authInviteManagersOnly: "authInviteManagersOnly",
  authAdminOnly: "authAdminOnly",
  authVenuePermissionDenied: "authVenuePermissionDenied",

  settingsOrgNameRequired: "settingsOrgNameRequired",
  settingsTextTooLong: "settingsTextTooLong",

  inviteInvalidEmail: "inviteInvalidEmail",
  inviteInvalidRole: "inviteInvalidRole",
  inviteEmailAlreadyMember: "inviteEmailAlreadyMember",
  invitePendingDuplicate: "invitePendingDuplicate",
  inviteNotAuthenticated: "inviteNotAuthenticated",
  inviteMissingId: "inviteMissingId",
  inviteCreated: "inviteCreated",
  inviteRevoked: "inviteRevoked",

  teamMissingMember: "teamMissingMember",
  teamInvalidRole: "teamInvalidRole",
  teamCannotChangeOwnRole: "teamCannotChangeOwnRole",
  teamServerConfig: "teamServerConfig",
  teamMemberNotFound: "teamMemberNotFound",
  teamNotInOrg: "teamNotInOrg",
  teamRoleUpdated: "teamRoleUpdated",

  dbError: "dbError",
  unexpected: "unexpected",

  onboardingServiceRoleMissing: "onboardingServiceRoleMissing",
  onboardingOrgCreateFailed: "onboardingOrgCreateFailed",
  onboardingProfileUnavailable: "onboardingProfileUnavailable",

  studioEpisodeNotFound: "studioEpisodeNotFound",
  studioArtifactNotFound: "studioArtifactNotFound",
  studioInvalidUrl: "studioInvalidUrl",
  studioTextTooLong: "studioTextTooLong",
  studioMetadataTooLarge: "studioMetadataTooLarge",
  studioInvalidStatus: "studioInvalidStatus",
  studioTitleRequired: "studioTitleRequired",
  studioRoleRequired: "studioRoleRequired",
  studioInvalidSortOrder: "studioInvalidSortOrder",

  studioDemoSeedDisabled: "studioDemoSeedDisabled",
  studioDemoSeedNotEmpty: "studioDemoSeedNotEmpty",

  studioInvalidFormatTemplate: "studioInvalidFormatTemplate",
  studioChannelLabelRequired: "studioChannelLabelRequired",
  studioTopicLineTooLong: "studioTopicLineTooLong",
} as const;

export type ActionErrorCode =
  (typeof ActionErrorCode)[keyof typeof ActionErrorCode];

const CODE_SET = new Set<string>(Object.values(ActionErrorCode));

export function isActionErrorCode(value: string): value is ActionErrorCode {
  return CODE_SET.has(value);
}
