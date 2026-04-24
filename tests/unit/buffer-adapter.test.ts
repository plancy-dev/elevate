import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBufferIdea,
  createBufferPost,
  listBufferChannels,
} from "@/lib/studio-integrations/providers/buffer/buffer-adapter";

const originalFetch = globalThis.fetch;

function mockFetch(handler: (req: { url: string; body: unknown }) => unknown) {
  return vi.fn(async (url: string, init?: { body?: string }) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    const result = handler({ url, body });
    if (result instanceof Response) return result;
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
}

describe("Buffer adapter", () => {
  beforeEach(() => {
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  });
  afterEach(() => {
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it("rejects empty API keys immediately", async () => {
    const list = await listBufferChannels("");
    expect(list.ok).toBe(false);
    if (!list.ok) expect(list.error.code).toBe("buffer_missing_key");

    const post = await createBufferPost("", {
      channelId: "c",
      text: "t",
    });
    expect(post.ok).toBe(false);
  });

  it("listBufferChannels flattens channels across orgs and maps platforms", async () => {
    (globalThis as { fetch: typeof fetch }).fetch = mockFetch(() => ({
      data: {
        account: {
          organizations: [
            {
              id: "org-1",
              channels: [
                { id: "ch-ig", name: "Main IG", service: "instagram", serviceType: "business" },
                { id: "ch-yt", name: "Main YT", service: "youtube_shorts", serviceType: null },
              ],
            },
            {
              id: "org-2",
              channels: [
                { id: "ch-tt", name: "TT", service: "tiktok", serviceType: null },
              ],
            },
          ],
        },
      },
    })) as typeof fetch;

    const result = await listBufferChannels("valid-key");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.channels).toHaveLength(3);
    expect(result.channels.find((c) => c.id === "ch-ig")?.platform).toBe("instagram");
    expect(result.channels.find((c) => c.id === "ch-yt")?.platform).toBe("youtube_shorts");
    expect(result.channels.find((c) => c.id === "ch-tt")?.platform).toBe("tiktok");
    expect(result.channels.find((c) => c.id === "ch-ig")?.organizationId).toBe("org-1");
  });

  it("createBufferPost returns postId on success and maps MutationError", async () => {
    (globalThis as { fetch: typeof fetch }).fetch = mockFetch(() => ({
      data: {
        createPost: {
          __typename: "PostActionSuccess",
          post: { id: "post-123", status: "scheduled", dueAt: "2030-01-01T00:00:00Z" },
        },
      },
    })) as typeof fetch;

    const ok = await createBufferPost("valid", {
      channelId: "c",
      text: "hello",
      scheduledAt: "2030-01-01T00:00:00Z",
      mediaUrls: ["https://example.com/v.mp4"],
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.postId).toBe("post-123");

    (globalThis as { fetch: typeof fetch }).fetch = mockFetch(() => ({
      data: {
        createPost: {
          __typename: "MutationError",
          message: "channel disconnected",
        },
      },
    })) as typeof fetch;

    const fail = await createBufferPost("valid", { channelId: "c", text: "x" });
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.error.code).toBe("buffer_validation");
      expect(fail.error.message).toContain("channel disconnected");
    }
  });

  it("createBufferPost surfaces auth errors via HTTP status", async () => {
    (globalThis as { fetch: typeof fetch }).fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ errors: [{ message: "bad token" }] }), {
          status: 401,
        }),
    ) as typeof fetch;
    const r = await createBufferPost("bad", { channelId: "c", text: "t" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("buffer_auth_error");
  });

  it("createBufferIdea returns the new idea id", async () => {
    (globalThis as { fetch: typeof fetch }).fetch = mockFetch(() => ({
      data: { createIdea: { __typename: "Idea", id: "idea-1" } },
    })) as typeof fetch;
    const r = await createBufferIdea("k", {
      organizationId: "org",
      title: "T",
      text: "body",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ideaId).toBe("idea-1");
  });
});
