import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  rollingSinceIso,
  buildMorningOpsFunnelScoreboard,
} from "@/lib/admin/morning-ops-funnel-scoreboard";

describe("morning-ops funnel scoreboard", () => {
  it("computes rollingSinceIso from a fixed instant", () => {
    const t = Date.parse("2026-05-03T12:00:00.000Z");
    expect(rollingSinceIso(t, 7)).toBe("2026-04-26T12:00:00.000Z");
    expect(rollingSinceIso(t, 30)).toBe("2026-04-03T12:00:00.000Z");
  });

  it("buildMorningOpsFunnelScoreboard runs nine head-count queries", async () => {
    const sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let idx = 0;
    const nextCount = () => sequence[idx++] ?? 0;

    function selectResult(count: number) {
      const resolved = Promise.resolve({ count, error: null });
      return {
        gte: vi.fn(() => resolved),
        then: resolved.then.bind(resolved),
      };
    }

    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => selectResult(nextCount())),
      })),
    } as unknown as SupabaseClient<Database>;

    const pinned = Date.parse("2026-05-03T00:00:00.000Z");
    const board = await buildMorningOpsFunnelScoreboard(admin, { nowMs: pinned });

    expect(admin.from).toHaveBeenCalledTimes(9);
    expect(board.waitlist).toEqual({ last7d: 1, last30d: 2, allTime: 3 });
    expect(board.catalogEntitlements).toEqual({ rowsLast7d: 4, rowsLast30d: 5, allRows: 6 });
    expect(board.promptStudioBeta).toEqual({ allowlistTotal: 9, addedLast7d: 7, addedLast30d: 8 });
    expect(board.generatedAtUtc).toBe(new Date(pinned).toISOString());
  });
});
