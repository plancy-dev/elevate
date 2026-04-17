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
  /** project_id does not exist in org or is not accessible */
  studioProjectInvalid: "studioProjectInvalid",
  /** Pipeline pre-steps: no script_draft content */
  studioPipelineNeedScript: "studioPipelineNeedScript",
  /** Thumbnail image step: run packaging step first */
  studioPipelineNeedPackaging: "studioPipelineNeedPackaging",
  /** Thumbnail uses OpenAI Images API only */
  studioOpenAiRequiredForThumbnail: "studioOpenAiRequiredForThumbnail",

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
  /** Runway account has insufficient credits / quota for this task */
  studioRunwayInsufficientCredits: "studioRunwayInsufficientCredits",

  /** Scene render: no Runway key in org integrations */
  studioSceneRenderNoRunwayKey: "studioSceneRenderNoRunwayKey",
  studioSceneRenderInvalidJson: "studioSceneRenderInvalidJson",
  studioSceneRenderScenesInvalid: "studioSceneRenderScenesInvalid",
  studioSceneRenderNoScript: "studioSceneRenderNoScript",
  studioSceneRenderNoScenes: "studioSceneRenderNoScenes",
  /** Sum of scene durations exceeds org safety cap */
  studioSceneRenderBudgetExceeded: "studioSceneRenderBudgetExceeded",

  /** Episode pipeline_prefs JSON exceeds size cap */
  studioPipelinePrefsTooLarge: "studioPipelinePrefsTooLarge",

  /** ElevenLabs TTS: generic HTTP / validation error from provider */
  studioTtsElevenLabsApiError: "studioTtsElevenLabsApiError",
  /** ElevenLabs TTS: 401 / 403 */
  studioTtsElevenLabsAuthError: "studioTtsElevenLabsAuthError",
  /** ElevenLabs TTS: 402 or plan / quota */
  studioTtsElevenLabsQuotaError: "studioTtsElevenLabsQuotaError",
  studioTtsElevenLabsEmptyText: "studioTtsElevenLabsEmptyText",
  studioTtsElevenLabsTimeout: "studioTtsElevenLabsTimeout",
  studioTtsEmptyScript: "studioTtsEmptyScript",
  studioTtsNoElevenLabsKey: "studioTtsNoElevenLabsKey",
  studioTtsInsertFailed: "studioTtsInsertFailed",
  studioTtsCustomVoiceIdRequired: "studioTtsCustomVoiceIdRequired",
  studioSubtitleInsertFailed: "studioSubtitleInsertFailed",
  studioSubtitleNoOpenAiKey: "studioSubtitleNoOpenAiKey",
  studioSubtitleAudioFetchFailed: "studioSubtitleAudioFetchFailed",
  studioSubtitleWhisperError: "studioSubtitleWhisperError",

  studioYoutubeUploadNotAvailable: "studioYoutubeUploadNotAvailable",

  /** FFmpeg assembly: no episode artifacts */
  studioAssemblyNoArtifacts: "studioAssemblyNoArtifacts",
  /** FFmpeg assembly: no scene_clip URLs */
  studioAssemblyNoClips: "studioAssemblyNoClips",
  /** FFmpeg assembly: DB insert failed */
  studioAssemblyInsertFailed: "studioAssemblyInsertFailed",
  /** FFmpeg binary missing or not executable (set FFMPEG_PATH or install ffmpeg) */
  studioAssemblyFfmpegNotFound: "studioAssemblyFfmpegNotFound",
  /** FFmpeg runtime error (codec, filter, corrupt input, etc.) */
  studioAssemblyFfmpegError: "studioAssemblyFfmpegError",
  /** Clip/audio download failed (network, URL, storage) */
  studioAssemblyDownloadFailed: "studioAssemblyDownloadFailed",

  /** User scene clip upload: file too large */
  studioSceneUploadTooLarge: "studioSceneUploadTooLarge",
  /** User scene clip upload: MIME not allowed */
  studioSceneUploadInvalidType: "studioSceneUploadInvalidType",
  /** User scene clip upload: no scene plan JSON for duration */
  studioScenePlanMissing: "studioScenePlanMissing",
  /** User scene clip upload: DB insert failed */
  studioSceneUploadInsertFailed: "studioSceneUploadInsertFailed",

  /** Reference pipeline: OpenAI key missing (YouTube STT) */
  studioReferenceNoApiKey: "studioReferenceNoApiKey",
  studioReferenceExtractionFailed: "studioReferenceExtractionFailed",
  studioReferenceNoSources: "studioReferenceNoSources",
  studioReferenceLlmFailed: "studioReferenceLlmFailed",
  studioReferenceLlmParseFailed: "studioReferenceLlmParseFailed",
  studioReferenceUrlInvalid: "studioReferenceUrlInvalid",
  studioReferenceUrlBlocked: "studioReferenceUrlBlocked",
  studioReferenceFetchFailed: "studioReferenceFetchFailed",
  studioReferenceNoteEmpty: "studioReferenceNoteEmpty",
  /** Web URL tab: use YouTube tab for video transcript */
  studioReferenceUseYoutubeTab: "studioReferenceUseYoutubeTab",
  /** yt-dlp / ffmpeg not on PATH (common on serverless) */
  studioReferenceYoutubeToolMissing: "studioReferenceYoutubeToolMissing",
} as const;

export type ActionErrorCode =
  (typeof ActionErrorCode)[keyof typeof ActionErrorCode];

const CODE_SET = new Set<string>(Object.values(ActionErrorCode));

export function isActionErrorCode(value: string): value is ActionErrorCode {
  return CODE_SET.has(value);
}
