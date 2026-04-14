/**
 * Client-safe types/state for Studio episode LLM server actions (no "use server" file exports).
 */
export type StudioEpisodeLlmDraftPayload = {
  hook: string;
  title: string;
  script_draft: string;
};

export type StudioEpisodeLlmActionState =
  | {
      error?: string;
      success?: string;
      /** Returned on draftGenerated / draftRefined so the client can review before syncing UI. */
      draft?: StudioEpisodeLlmDraftPayload;
      /** Set when Runway text-to-video completes; first output URL for UI. */
      runway?: { taskId: string; outputUrl: string };
    }
  | undefined;

export const studioEpisodeLlmInitialState: StudioEpisodeLlmActionState = undefined;
