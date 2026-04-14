import { verifyRunwayApiKey } from "@/lib/studio-integrations/runway-verify";
import type { StudioProviderAdapter } from "@/lib/studio-integrations/providers/types";

/**
 * Runway ML API — health via task list ping; generation in a later phase (submit + poll).
 * @see https://docs.dev.runwayml.com/
 */
export const runwayAdapter: StudioProviderAdapter = {
  id: "runway",

  async healthCheck(secret: string) {
    const r = await verifyRunwayApiKey(secret);
    if (r.ok) return { ok: true };
    return { ok: false, status: r.status };
  },

  async runStep(_secret: string, _args: Record<string, unknown>) {
    void _secret;
    void _args;
    return { ok: false, code: "not_implemented" as const };
  },
};
