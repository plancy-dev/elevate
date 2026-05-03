import { describe, expect, it } from "vitest";
import { buildContentQualitySnapshot } from "@/lib/content-ops/quality-monitor";

type MonitorItem = {
  id: string;
  type: "blog" | "newsletter";
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  review_notes: string | null;
  metadata: Record<string, unknown> | null;
};

type MonitorRun = {
  run_type: string;
  status: string;
  created_at: string;
  error_summary: string | null;
  metadata: Record<string, unknown> | null;
};

function isoAt(baseMs: number, offsetHours: number): string {
  return new Date(baseMs + offsetHours * 60 * 60 * 1000).toISOString();
}

describe("content quality delta window contract", () => {
  it("keeps current/previous windows non-overlapping for 24h and 7d", () => {
    const nowMs = Date.parse("2026-01-15T00:00:00.000Z");
    const runs: MonitorRun[] = [
      {
        run_type: "draft_generate",
        status: "ok",
        created_at: isoAt(nowMs, -12),
        error_summary: null,
        metadata: { createdItems: 5 },
      },
      {
        run_type: "draft_generate",
        status: "ok",
        created_at: isoAt(nowMs, -6 * 24),
        error_summary: null,
        metadata: { createdItems: 3 },
      },
      {
        run_type: "draft_generate",
        status: "ok",
        created_at: isoAt(nowMs, -7 * 24),
        error_summary: null,
        metadata: { createdItems: 2 },
      },
      {
        run_type: "draft_generate",
        status: "ok",
        created_at: isoAt(nowMs, -8 * 24),
        error_summary: null,
        metadata: { createdItems: 1 },
      },
      {
        run_type: "draft_generate",
        status: "ok",
        created_at: isoAt(nowMs, -9 * 24),
        error_summary: null,
        metadata: { createdItems: 4 },
      },
    ];

    const items: MonitorItem[] = [
      {
        id: "a",
        type: "blog",
        title: "current 24h",
        status: "draft",
        created_at: isoAt(nowMs, -2),
        updated_at: isoAt(nowMs, -2),
        review_notes: null,
        metadata: { generate: { mode: "pack_registry" } },
      },
      {
        id: "b",
        type: "blog",
        title: "boundary current 24h",
        status: "draft",
        created_at: isoAt(nowMs, -24),
        updated_at: isoAt(nowMs, -24),
        review_notes: null,
        metadata: { generate: { mode: "pack_registry" } },
      },
      {
        id: "c",
        type: "blog",
        title: "previous 24h",
        status: "draft",
        created_at: isoAt(nowMs, -25),
        updated_at: isoAt(nowMs, -25),
        review_notes: null,
        metadata: { generate: { mode: "pack_registry" } },
      },
    ];

    const snapshot = buildContentQualitySnapshot({
      items: items as never[],
      runs: runs as never[],
      nowMs,
      windowDays: 7,
      freshWindowHours: 24,
    });

    expect(snapshot.generatedCount).toBe(10);
    expect(snapshot.generated7dDelta.previous).toBe(5);
    expect(snapshot.generated7dDelta.deltaPercent).toBe(100);

    expect(snapshot.freshGeneratedCount).toBe(2);
    expect(snapshot.generated24hDelta.previous).toBe(1);
    expect(snapshot.generated24hDelta.deltaPercent).toBe(100);
  });

  it("returns null delta when previous window is zero and current is positive", () => {
    const nowMs = Date.parse("2026-01-15T00:00:00.000Z");
    const runs: MonitorRun[] = [];
    const items: MonitorItem[] = [
      {
        id: "only-current",
        type: "newsletter",
        title: "current only",
        status: "draft",
        created_at: isoAt(nowMs, -3),
        updated_at: isoAt(nowMs, -3),
        review_notes: null,
        metadata: { generate: { mode: "pack_registry" } },
      },
    ];

    const snapshot = buildContentQualitySnapshot({
      items: items as never[],
      runs: runs as never[],
      nowMs,
      windowDays: 7,
      freshWindowHours: 24,
    });

    expect(snapshot.generated24hDelta.previous).toBe(0);
    expect(snapshot.generated24hDelta.current).toBe(1);
    expect(snapshot.generated24hDelta.deltaPercent).toBeNull();
  });

  it("aggregates deferred publish count from run metadata", () => {
    const nowMs = Date.parse("2026-01-15T00:00:00.000Z");
    const runs: MonitorRun[] = [
      {
        run_type: "publish",
        status: "succeeded",
        created_at: isoAt(nowMs, -3),
        error_summary: "warning:[newsletter:item-1] frequency_window_deferred",
        metadata: { deferredCount: 4 },
      },
      {
        run_type: "publish_retry_failed",
        status: "succeeded",
        created_at: isoAt(nowMs, -2),
        error_summary: null,
        metadata: { result: { deferredCount: 2 } },
      },
    ];

    const snapshot = buildContentQualitySnapshot({
      items: [] as never[],
      runs: runs as never[],
      nowMs,
      windowDays: 7,
      freshWindowHours: 24,
    });

    expect(snapshot.deferredCount).toBe(6);
  });

  it("builds strategy scoreboard and winner selection", () => {
    const nowMs = Date.parse("2026-01-15T00:00:00.000Z");
    const items: MonitorItem[] = [
      {
        id: "n1",
        type: "newsletter",
        title: "novelty good",
        status: "published",
        created_at: isoAt(nowMs, -2),
        updated_at: isoAt(nowMs, -2),
        review_notes: null,
        metadata: {
          generate: { mode: "pack_registry", autotune: { strategy: "novelty_boost" } },
          review_gate: { latest: { metrics: { qualityScore: 22 } } },
        },
      },
      {
        id: "n2",
        type: "newsletter",
        title: "novelty review",
        status: "review_required",
        created_at: isoAt(nowMs, -3),
        updated_at: isoAt(nowMs, -3),
        review_notes: null,
        metadata: {
          generate: { mode: "pack_registry", autotune: { strategy: "novelty_boost" } },
          review_gate: { latest: { metrics: { qualityScore: 18 } } },
        },
      },
      {
        id: "o1",
        type: "blog",
        title: "overcopy",
        status: "review_required",
        created_at: isoAt(nowMs, -4),
        updated_at: isoAt(nowMs, -4),
        review_notes: null,
        metadata: {
          generate: { mode: "pack_registry", autotune: { strategy: "overcopy_mitigate" } },
          review_gate: { latest: { metrics: { qualityScore: 15 } } },
        },
      },
      {
        id: "b1",
        type: "blog",
        title: "balanced",
        status: "published",
        created_at: isoAt(nowMs, -5),
        updated_at: isoAt(nowMs, -5),
        review_notes: null,
        metadata: {
          generate: { mode: "pack_registry", autotune: { strategy: "balanced" } },
          review_gate: { latest: { metrics: { qualityScore: 20 } } },
        },
      },
    ];

    const snapshot = buildContentQualitySnapshot({
      items: items as never[],
      runs: [] as never[],
      nowMs,
      windowDays: 7,
      freshWindowHours: 24,
    });

    const novelty = snapshot.strategyScoreboard.find((row) => row.strategy === "novelty_boost");
    expect(novelty?.sampleCount).toBe(2);
    expect(novelty?.avgQualityScore).toBe(20);
    expect(novelty?.reviewRequiredRatio).toBe(0.5);
    expect(snapshot.winnerStrategy).toBe("balanced");
    expect(snapshot.hasInsufficientStrategySample).toBe(true);
  });

  it("falls back to weekday strategy when legacy metadata lacks autotune strategy", () => {
    const nowMs = Date.parse("2026-01-16T00:00:00.000Z");
    const items: MonitorItem[] = [
      {
        id: "legacy-friday",
        type: "newsletter",
        title: "legacy tagged by weekday",
        status: "published",
        created_at: "2026-01-09T09:00:00.000Z",
        updated_at: "2026-01-09T09:00:00.000Z",
        review_notes: null,
        metadata: {
          generate: { mode: "pack_registry", pack_version: "v1.2.0" },
          review_gate: { latest: { metrics: { qualityScore: 21 } } },
        },
      },
    ];

    const snapshot = buildContentQualitySnapshot({
      items: items as never[],
      runs: [] as never[],
      nowMs,
      windowDays: 14,
      freshWindowHours: 24,
    });

    const overcopy = snapshot.strategyScoreboard.find((row) => row.strategy === "overcopy_mitigate");
    expect(overcopy?.sampleCount).toBe(1);
    expect(snapshot.winnerStrategy).toBe("overcopy_mitigate");
  });

  it("aggregates citation coverage for 7d and fresh 24h", () => {
    const nowMs = Date.parse("2026-01-15T00:00:00.000Z");
    const items: MonitorItem[] = [
      {
        id: "c1",
        type: "newsletter",
        title: "fresh generated",
        status: "published",
        created_at: isoAt(nowMs, -2),
        updated_at: isoAt(nowMs, -2),
        review_notes: null,
        metadata: {
          generate: { mode: "pack_registry" },
          review_gate: { latest: { metrics: { qualityScore: 20, citationCoverage: 0.8 } } },
        },
      },
      {
        id: "c2",
        type: "blog",
        title: "7d item",
        status: "review_required",
        created_at: isoAt(nowMs, -30),
        updated_at: isoAt(nowMs, -30),
        review_notes: null,
        metadata: {
          generate: { mode: "pack_registry" },
          review_gate: { latest: { metrics: { qualityScore: 16, citationCoverage: 0.4 } } },
        },
      },
    ];

    const snapshot = buildContentQualitySnapshot({
      items: items as never[],
      runs: [] as never[],
      nowMs,
      windowDays: 7,
      freshWindowHours: 24,
    });

    expect(snapshot.citationCoverage7dAvg).toBe(0.6);
    expect(snapshot.citationCoverage24hAvg).toBe(0.8);
  });
});
