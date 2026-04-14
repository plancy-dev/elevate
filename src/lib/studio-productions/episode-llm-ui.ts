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
    }
  | undefined;

export const studioEpisodeLlmInitialState: StudioEpisodeLlmActionState = undefined;
