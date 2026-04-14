/**
 * Feature flags for Studio integrations (v2). Server vs public split per ADR-006.
 */

/** Show Integrations page and nav entry (marketing / preview). */
export function readStudioIntegrationsUiFlag(): boolean {
  return process.env.NEXT_PUBLIC_STUDIO_INTEGRATIONS_UI === "true";
}

/**
 * Master switch for any outbound provider call from Elevate servers.
 * Keep false in production until security review (PLAN Phase 1+).
 */
export function readStudioIntegrationsServerEnabled(): boolean {
  return process.env.STUDIO_INTEGRATIONS_ENABLED === "true";
}
