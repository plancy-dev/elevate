/**
 * Buffer Publish API (GraphQL) adapter — server-only.
 *
 * Two mutations are exposed here:
 *   - `createBufferIdea`  — content idea (draft / not scheduled)
 *   - `createBufferPost`  — scheduled post (what we use for auto-publish)
 *
 * Plus the channel discovery query for the Integrations page.
 *
 * @see https://buffer.com/developers/api
 */
import "server-only";

export type BufferPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "youtube_shorts"
  | "x"
  | "threads"
  | "linkedin"
  | "facebook"
  | "pinterest"
  | "other";

export type BufferChannel = {
  id: string;
  name: string;
  service: string;
  serviceType: string | null;
  organizationId: string;
  platform: BufferPlatform;
};

export type BufferError = {
  code:
    | "buffer_missing_key"
    | "buffer_api_error"
    | "buffer_auth_error"
    | "buffer_rate_limited"
    | "buffer_timeout"
    | "buffer_validation";
  message?: string;
  status?: number;
};

function resolveBufferGraphqlUrl(): string {
  const raw = process.env.BUFFER_API_URL?.trim();
  if (!raw) return "https://api.buffer.com/graphql";
  // Buffer now requires api.buffer.com/graphql. Keep old env values safe.
  if (raw === "https://graph.buffer.com") return "https://api.buffer.com/graphql";
  return raw;
}

const BUFFER_GRAPHQL_URL = resolveBufferGraphqlUrl();
const DEFAULT_TIMEOUT_MS = 20_000;

function mapServiceToPlatform(service: string | null | undefined): BufferPlatform {
  const s = (service ?? "").toLowerCase();
  if (s.includes("instagram")) return "instagram";
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("youtube_short") || s === "youtube_shorts") return "youtube_shorts";
  if (s.includes("youtube")) return "youtube";
  if (s === "twitter" || s === "x") return "x";
  if (s.includes("thread")) return "threads";
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("facebook")) return "facebook";
  if (s.includes("pinterest")) return "pinterest";
  return "other";
}

async function bufferFetch<T>(
  apiKey: string,
  body: { query: string; variables?: Record<string, unknown> },
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<
  { ok: true; data: T } | { ok: false; error: BufferError }
> {
  const key = apiKey.replace(/\s+/g, "").trim();
  if (!key) return { ok: false, error: { code: "buffer_missing_key" } };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(BUFFER_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: { code: "buffer_auth_error", status: res.status },
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        error: { code: "buffer_rate_limited", status: 429 },
      };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: {
          code: "buffer_api_error",
          status: res.status,
          message: text.slice(0, 400),
        },
      };
    }

    const parsed = (await res.json()) as {
      data?: T;
      errors?: Array<{ message?: string }>;
    };
    if (parsed.errors && parsed.errors.length > 0) {
      const message = parsed.errors
        .map((e) => e.message ?? "")
        .filter(Boolean)
        .join(";");
      return {
        ok: false,
        error: { code: "buffer_validation", message },
      };
    }
    if (!parsed.data) {
      return {
        ok: false,
        error: { code: "buffer_api_error", message: "empty response" },
      };
    }
    return { ok: true, data: parsed.data };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: { code: "buffer_timeout" } };
    }
    return {
      ok: false,
      error: {
        code: "buffer_api_error",
        message: err instanceof Error ? err.message : String(err),
      },
    };
  } finally {
    clearTimeout(tid);
  }
}

/**
 * List publish-capable channels visible to the authenticated Buffer account.
 * Returns a flat list regardless of organization to keep the Integrations UI
 * simple; callers filter by `organizationId` when needed.
 */
export async function listBufferChannels(
  apiKey: string,
): Promise<
  | { ok: true; channels: BufferChannel[] }
  | { ok: false; error: BufferError }
> {
  const query = `
    query Channels {
      account {
        organizations {
          id
          channels {
            id
            name
            service
            serviceType
          }
        }
      }
    }
  `;
  type Resp = {
    account?: {
      organizations?: Array<{
        id: string;
        channels?: Array<{
          id: string;
          name: string;
          service: string | null;
          serviceType: string | null;
        }>;
      }>;
    };
  };
  const r = await bufferFetch<Resp>(apiKey, { query });
  if (!r.ok) return { ok: false, error: r.error };

  const channels: BufferChannel[] = [];
  for (const org of r.data.account?.organizations ?? []) {
    for (const ch of org.channels ?? []) {
      channels.push({
        id: ch.id,
        name: ch.name,
        service: ch.service ?? "",
        serviceType: ch.serviceType ?? null,
        organizationId: org.id,
        platform: mapServiceToPlatform(ch.service),
      });
    }
  }
  return { ok: true, channels };
}

export type CreateBufferPostParams = {
  channelId: string;
  text: string;
  /** ISO 8601 timestamp. Optional — omit for "next available slot" scheduling. */
  scheduledAt?: string;
  mediaUrls?: string[];
};

export type CreateBufferPostResult =
  | { ok: true; postId: string; status: string | null; dueAt: string | null }
  | { ok: false; error: BufferError };

/**
 * Create a scheduled post on a single Buffer channel. For multi-channel
 * publish, call this once per channel in parallel (the server action
 * `schedulePostToBuffer` wraps this pattern).
 */
export async function createBufferPost(
  apiKey: string,
  params: CreateBufferPostParams,
): Promise<CreateBufferPostResult> {
  const query = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            status
            dueAt
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;
  const input: Record<string, unknown> = {
    channelId: params.channelId,
    text: params.text,
    schedulingType: "automatic",
    mode: params.scheduledAt ? "customScheduled" : "automatic",
  };
  if (params.scheduledAt) input.dueAt = params.scheduledAt;
  if (params.mediaUrls && params.mediaUrls.length > 0) {
    input.mediaUrls = params.mediaUrls;
  }

  type Resp = {
    createPost?:
      | {
          __typename?: "PostActionSuccess";
          post?: { id: string; status: string | null; dueAt: string | null };
          message?: never;
        }
      | {
          __typename?: "MutationError";
          message: string;
          post?: never;
        };
  };

  const r = await bufferFetch<Resp>(apiKey, {
    query,
    variables: { input },
  });
  if (!r.ok) return { ok: false, error: r.error };

  const body = r.data.createPost;
  if (!body) {
    return {
      ok: false,
      error: { code: "buffer_api_error", message: "createPost empty" },
    };
  }
  if ("message" in body && typeof body.message === "string") {
    return {
      ok: false,
      error: { code: "buffer_validation", message: body.message },
    };
  }
  if (!body.post?.id) {
    return {
      ok: false,
      error: { code: "buffer_api_error", message: "no post id" },
    };
  }
  return {
    ok: true,
    postId: body.post.id,
    status: body.post.status ?? null,
    dueAt: body.post.dueAt ?? null,
  };
}

export type CreateBufferIdeaParams = {
  /** Buffer organization id (required for createIdea). */
  organizationId: string;
  title: string;
  text: string;
};

export type CreateBufferIdeaResult =
  | { ok: true; ideaId: string }
  | { ok: false; error: BufferError };

/**
 * Create an idea (draft) on Buffer's idea board. Provided for completeness —
 * our default UX creates scheduled posts via `createBufferPost`.
 */
export async function createBufferIdea(
  apiKey: string,
  params: CreateBufferIdeaParams,
): Promise<CreateBufferIdeaResult> {
  const query = `
    mutation CreateIdea($input: CreateIdeaInput!) {
      createIdea(input: $input) {
        ... on Idea {
          id
        }
        ... on MutationError {
          message
        }
      }
    }
  `;
  type Resp = {
    createIdea?:
      | { __typename?: "Idea"; id: string; message?: never }
      | { __typename?: "MutationError"; message: string; id?: never };
  };
  const r = await bufferFetch<Resp>(apiKey, {
    query,
    variables: {
      input: {
        organizationId: params.organizationId,
        content: {
          title: params.title,
          text: params.text,
        },
      },
    },
  });
  if (!r.ok) return { ok: false, error: r.error };

  const body = r.data.createIdea;
  if (!body) {
    return {
      ok: false,
      error: { code: "buffer_api_error", message: "createIdea empty" },
    };
  }
  if ("message" in body && typeof body.message === "string" && !body.id) {
    return {
      ok: false,
      error: { code: "buffer_validation", message: body.message },
    };
  }
  if (!body.id) {
    return {
      ok: false,
      error: { code: "buffer_api_error", message: "no idea id" },
    };
  }
  return { ok: true, ideaId: body.id };
}
