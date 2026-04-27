import { describe, expect, it, vi } from "vitest";
import { resetStaleVideoAssemblyJobs } from "../../workers/video-assembly/stale-recovery";

describe("resetStaleVideoAssemblyJobs", () => {
  it("maps rpc summary counts", async () => {
    const rpc = vi.fn(async () => ({
      data: [{ requeued_count: 2, failed_count: 1 }],
      error: null,
    }));
    const summary = await resetStaleVideoAssemblyJobs(
      { rpc } as unknown as Parameters<typeof resetStaleVideoAssemblyJobs>[0],
      30,
    );

    expect(rpc).toHaveBeenCalledWith("reset_stale_studio_video_assembly_jobs", {
      stale_before: "30 minutes",
    });
    expect(summary).toEqual({ requeuedCount: 2, failedCount: 1 });
  });

  it("throws when rpc fails", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      error: { message: "boom" },
    }));
    await expect(
      resetStaleVideoAssemblyJobs(
        { rpc } as unknown as Parameters<typeof resetStaleVideoAssemblyJobs>[0],
        30,
      ),
    ).rejects.toEqual({ message: "boom" });
  });
});
