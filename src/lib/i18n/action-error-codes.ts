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
  studioDraftSnapshotNotFound: "studioDraftSnapshotNotFound",
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

  studioIntegrationsEncryptionNotConfigured:
    "studioIntegrationsEncryptionNotConfigured",
  studioIntegrationsSecretRequired: "studioIntegrationsSecretRequired",
  studioIntegrationsProviderInvalid: "studioIntegrationsProviderInvalid",
  studioIntegrationsDisabled: "studioIntegrationsDisabled",
  studioIntegrationsOpenAiTestFailed: "studioIntegrationsOpenAiTestFailed",
  studioIntegrationsProviderNotConfigured:
    "studioIntegrationsProviderNotConfigured",
  studioIntegrationsProviderVerifyFailed: "studioIntegrationsProviderVerifyFailed",
  studioIntegrationsSecretTooLong: "studioIntegrationsSecretTooLong",
  /** DB CHECK / migration missing for provider (e.g. anthropic) */
  studioIntegrationsDbProviderNotAllowed:
    "studioIntegrationsDbProviderNotAllowed",

  studioLlmDisabled: "studioLlmDisabled",
  studioLlmNoProvider: "studioLlmNoProvider",
  /** Chosen provider has no saved API key (Integrations). */
  studioLlmProviderNotAvailable: "studioLlmProviderNotAvailable",
  studioLlmRequestFailed: "studioLlmRequestFailed",
  studioLlmBadResponse: "studioLlmBadResponse",
  /** Refine-with-LLM: empty instruction field */
  studioLlmInstructionRequired: "studioLlmInstructionRequired",

  studioDraftTemplateNameRequired: "studioDraftTemplateNameRequired",
  studioDraftTemplateBiasRequired: "studioDraftTemplateBiasRequired",
  studioDraftTemplateNotFound: "studioDraftTemplateNotFound",
  studioDraftTemplateNameTooLong: "studioDraftTemplateNameTooLong",
  studioDraftTemplateBiasTooLong: "studioDraftTemplateBiasTooLong",
  /** @deprecated Prefer specific Runway errors; kept for older clients */
  studioRunwayManualOnly: "studioRunwayManualOnly",
  studioRunwayPromptRequired: "studioRunwayPromptRequired",
  studioRunwayNotConfigured: "studioRunwayNotConfigured",
  studioRunwayTaskFailed: "studioRunwayTaskFailed",
  studioRunwayTimeout: "studioRunwayTimeout",
  studioRunwayApiError: "studioRunwayApiError",
  studioYoutubeUploadNotAvailable: "studioYoutubeUploadNotAvailable",
} as const;

export type ActionErrorCode =
  (typeof ActionErrorCode)[keyof typeof ActionErrorCode];

const CODE_SET = new Set<string>(Object.values(ActionErrorCode));

export function isActionErrorCode(value: string): value is ActionErrorCode {
  return CODE_SET.has(value);
}
